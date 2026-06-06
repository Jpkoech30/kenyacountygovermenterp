const { scrapeUrl, extractFileText } = require('./scraperService');
const { callDeepSeek, parseJsonResponse } = require('./aiService');
const { calculateCost } = require('./llmService');

/**
 * AI Content Assistant Service
 *
 * Orchestrates the full workflow:
 * 1. Scrape content from a URL or extract text from an uploaded file
 * 2. Send scraped text to DeepSeek API with a structured prompt
 * 3. Parse the AI response into a structured draft object
 * 4. Calculate cost and return the result
 *
 * The generated draft includes:
 * - translations: array of { locale, title, body, excerpt }
 * - meta: array of { meta_key, meta_value }
 * - taxonomy_ids: suggested category IDs (returned as names for frontend to resolve)
 * - type: suggested content type
 * - slug: suggested URL slug
 */

const DEEPSEEK_MODEL = 'deepseek-chat';
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.3;

/**
 * Generate a structured content draft from a URL.
 * @param {string} url - The URL to scrape
 * @param {object} [options] - Optional parameters
 * @param {string} [options.targetLocale] - Target language ('en', 'sw', 'pok')
 * @param {string} [options.additionalInstructions] - Extra instructions for DeepSeek
 * @returns {Promise<object>} { draft, inputTokens, outputTokens, costKes }
 */
const generateFromUrl = async (url, options = {}) => {
  // Step 1: Scrape the URL
  const scrapedText = await scrapeUrl(url);

  if (!scrapedText || scrapedText.trim().length < 50) {
    throw new Error(
      'Could not extract enough meaningful content from the URL. The page may be empty, require authentication, or be blocked.'
    );
  }

  // Step 2: Send to DeepSeek with source context
  return generateDraft(scrapedText, url, { ...options, sourceFormat: 'webpage' });
};

/**
 * Generate a structured content draft from an uploaded file.
 * @param {string} filePath - Full path to the file on disk
 * @param {string} mimeType - MIME type of the file
 * @param {object} [options] - Optional parameters
 * @param {string} [options.targetLocale] - Target language ('en', 'sw', 'pok')
 * @param {string} [options.additionalInstructions] - Extra instructions for DeepSeek
 * @returns {Promise<object>} { draft, inputTokens, outputTokens, costKes }
 */
const generateFromFile = async (filePath, mimeType, options = {}) => {
  // Step 1: Extract text from file
  const extractedText = await extractFileText(filePath, mimeType);

  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error(
      'Could not extract enough meaningful content from the file. The file may be empty or in an unsupported format.'
    );
  }

  // Map MIME type to source format label
  const formatMap = {
    'application/pdf': 'PDF (converted to Markdown)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX (converted to Markdown)',
    'text/plain': 'plain text file',
  };
  const sourceFormat = formatMap[mimeType] || 'file';

  // Step 2: Send to DeepSeek with source context
  return generateDraft(extractedText, null, { ...options, sourceFormat });
};

/**
 * Core draft generation: send text to DeepSeek and parse the structured response.
 * @param {string} text - The scraped/extracted text content
 * @param {string|null} sourceUrl - Original URL (for reference in the prompt)
 * @param {object} [options] - Optional parameters
 * @param {string} [options.targetLocale] - Target language ('en', 'sw', 'pok')
 * @param {string} [options.additionalInstructions] - Extra instructions for DeepSeek
 * @returns {Promise<object>} { draft, inputTokens, outputTokens, costKes }
 */
const generateDraft = async (text, sourceUrl, options = {}) => {
  const { targetLocale, additionalInstructions, sourceFormat } = options;

  // Map locale to language name for the prompt
  const localeMap = { en: 'English', sw: 'Swahili', pok: 'Pokot' };
  const targetLanguage = localeMap[targetLocale] || 'English';

  const formatHint = sourceFormat
    ? `\nThe source content was extracted from a ${sourceFormat}. Some structural formatting (headings, lists) may have been preserved as Markdown. Use this structure to understand the document hierarchy.`
    : '';

  let systemPrompt = `You are a professional content writer for a county government CMS (West Pokot County, Kenya).
Your task is to analyze the provided source content and generate a structured content draft suitable for publishing on a government website.

The article MUST be written in **${targetLanguage}** language.${formatHint}

Return a JSON object with the following structure:
{
  "type": "Suggested content type (one of: page, news, event, tender, vacancy, department, department_notice, press_release)",
  "slug": "A URL-friendly slug derived from the main title (lowercase, hyphens, max 80 chars)",
  "translations": [
    {
      "locale": "${targetLocale || 'en'}",
      "title": "Title in ${targetLanguage}",
      "body": "Full body text in ${targetLanguage} (can include HTML formatting like <p>, <ul>, <li>, <h2>, <h3>)",
      "excerpt": "A brief 2-3 sentence summary in ${targetLanguage} (max 300 chars)"
    }
  ],
  "meta": [
    { "meta_key": "source_url", "meta_value": "The original source URL if available, otherwise empty string" }
  ],
  "suggested_categories": ["Array of suggested category names as strings (e.g., Health, Education, Infrastructure)"]
}

Guidelines:
1. **Content type**: Choose the most appropriate type based on the content. Use 'news' for announcements, 'page' for general information, 'event' for upcoming events, 'tender' for procurement notices, 'vacancy' for job postings.
2. **Title**: Create a clear, descriptive title in ${targetLanguage} (max 80 characters).
3. **Body**: Write well-structured HTML body content in ${targetLanguage}. Use <p> for paragraphs, <h2>/<h3> for section headings, <ul>/<li> for lists. Keep the content factual and professional.
4. **Excerpt**: Write a compelling summary in ${targetLanguage} that captures the key points.
5. **Slug**: Create a URL-friendly slug from the title.
6. **Categories**: Suggest 1-3 relevant category names that exist in a county government CMS (e.g., Health, Education, Infrastructure, Agriculture, Finance, Public Works, Water, Environment, Trade, Tourism, Sports, Culture, Social Services, Administration).
7. **Tone**: Maintain a professional, informative, and neutral government communication tone.
8. **Accuracy**: Base the content strictly on the provided source text. Do not fabricate information. If the source lacks sufficient detail for a field, provide a reasonable placeholder in brackets like [Event date not specified].

IMPORTANT: Return ONLY valid JSON. No markdown code fences, no additional text.`;

  let userContent = sourceUrl
    ? `Source URL: ${sourceUrl}\n\n---\n\nSource Content:\n${text}`
    : `Source Content:\n${text}`;

  if (additionalInstructions) {
    userContent += `\n\nAdditional Instructions from the user:\n${additionalInstructions}`;
  }

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    {
      model: DEEPSEEK_MODEL,
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  // Validate the parsed response has the required structure
  const draft = {
    type: parsed.type || 'page',
    slug: parsed.slug || '',
    translations: Array.isArray(parsed.translations) ? parsed.translations : [],
    meta: Array.isArray(parsed.meta) ? parsed.meta : [],
    suggested_categories: Array.isArray(parsed.suggested_categories)
      ? parsed.suggested_categories
      : [],
  };

  return {
    draft,
    inputTokens,
    outputTokens,
    costKes,
  };
};

module.exports = {
  generateFromUrl,
  generateFromFile,
};
