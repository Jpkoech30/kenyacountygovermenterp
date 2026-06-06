const axios = require('axios');
const Setting = require('../models/Setting');
const { calculateCost } = require('./llmService');

/**
 * AI Service - Feature-specific DeepSeek API methods for AI Assist.
 *
 * Each method follows the same pattern:
 * 1. Check global ai_assist_enabled setting
 * 2. Check API key
 * 3. Call DeepSeek API with feature-specific prompt
 * 4. Parse JSON response
 * 5. Calculate cost
 * 6. Return { result, inputTokens, outputTokens, costKes }
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Maximum input characters sent to DeepSeek per request.
 * Reduced to 2000 chars to minimize token consumption.
 * ~2000 chars ≈ 500-750 tokens — enough context for all features.
 */
const MAX_INPUT_CHARS = 2000;

/**
 * Per-feature max output tokens — aggressively reduced to minimize costs.
 * Grammar: just corrected text + changes array
 * Tags: just an array of strings
 * Alt text: just a short string
 * Translate/SEO/Improve: need more output for full text
 */
const FEATURE_MAX_TOKENS = {
  grammar: 300,
  translate: 500,
  tags: 100,
  seo: 200,
  alt: 100,
  improve: 500,
};

/**
 * Get a setting value by key from the database.
 */
const getSetting = async (key, defaultValue = '') => {
  try {
    const setting = await Setting.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Make a DeepSeek API call with the given messages and parse JSON response.
 * @param {Array} messages - Array of { role, content } objects
 * @param {object} options - { model, maxTokens, temperature }
 * @returns {Promise<{ content: string, inputTokens: number, outputTokens: number }>}
 */
const callDeepSeek = async (messages, options = {}) => {
  const apiKey = await getSetting('llm_api_key', '');
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured. Set it in Settings.');
  }

  const model = options.model || (await getSetting('llm_model', 'deepseek-chat'));
  const maxTokens = options.maxTokens || parseInt(await getSetting('llm_max_tokens', '1000'), 10);
  const temperature = options.temperature !== undefined ? options.temperature : parseFloat(await getSetting('llm_temperature', '0.3'));

  // --- Token optimisation: truncate user content to reduce input tokens ---
  const truncatedMessages = messages.map((msg) => {
    if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.length > MAX_INPUT_CHARS) {
      return {
        ...msg,
        content: msg.content.slice(0, MAX_INPUT_CHARS) + '\n\n[...content truncated for token efficiency]',
      };
    }
    return msg;
  });

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model,
        messages: truncatedMessages,
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      }
    );

    const result = response.data;
    const content = result.choices[0]?.message?.content || '';
    const usage = result.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;

    return { content, inputTokens, outputTokens };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'Unknown API error';
      throw new Error(`DeepSeek API error (${status}): ${message}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('DeepSeek API request timed out after 30 seconds.');
    }
    throw new Error(`Failed to connect to DeepSeek API: ${error.message}`);
  }
};

/**
 * Parse a JSON string from the LLM response, handling markdown code fences.
 * @param {string} content - Raw response content
 * @returns {object} Parsed JSON object
 */
const parseJsonResponse = (content) => {
  // Remove markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return JSON.parse(cleaned);
};

/**
 * Check grammar and return corrected text with list of changes.
 * @param {string} text - Text to check
 * @param {string} locale - Language locale (en, sw, pok)
 * @returns {Promise<object>} { corrected, changes, inputTokens, outputTokens, costKes }
 */
const checkGrammar = async (text, locale = 'en') => {
  const localeNames = { en: 'English', sw: 'Kiswahili', pok: 'Pokot' };
  const langName = localeNames[locale] || 'English';

  const systemPrompt = `You are a professional grammar checker for ${langName}.
Analyze the text and return a JSON object with:
- "corrected": the full corrected text
- "changes": an array of objects, each with "original" (the incorrect word/phrase), "replacement" (the correction), and "reason" (brief explanation)

Only fix actual errors. Preserve all HTML formatting, line breaks, and structure exactly.`;

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    { maxTokens: FEATURE_MAX_TOKENS.grammar }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  return {
    corrected: parsed.corrected || text,
    changes: parsed.changes || [],
    inputTokens,
    outputTokens,
    costKes,
  };
};

/**
 * Translate text from source locale to target locale.
 * @param {string} text - Text to translate
 * @param {string} sourceLocale - Source language (en, sw, pok)
 * @param {string} targetLocale - Target language (en, sw, pok)
 * @returns {Promise<object>} { translatedText, inputTokens, outputTokens, costKes }
 */
const translateText = async (text, sourceLocale, targetLocale) => {
  const localeNames = { en: 'English', sw: 'Kiswahili', pok: 'Pokot' };
  const sourceName = localeNames[sourceLocale] || 'English';
  const targetName = localeNames[targetLocale] || 'English';

  const systemPrompt = `You are a professional translator. Translate the following text from ${sourceName} to ${targetName}.
Return a JSON object with:
- "translatedText": the translated text

Preserve all HTML formatting, line breaks, and structure exactly. Do not add any commentary.`;

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    { maxTokens: FEATURE_MAX_TOKENS.translate }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  return {
    translatedText: parsed.translatedText || '',
    inputTokens,
    outputTokens,
    costKes,
  };
};

/**
 * Suggest tags based on content title and body.
 * @param {string} title - Content title
 * @param {string} body - Content body text
 * @param {number} maxTags - Maximum number of tags to suggest (default: 5)
 * @returns {Promise<object>} { tags: string[], inputTokens, outputTokens, costKes }
 */
const suggestTags = async (title, body, maxTags = 5) => {
  const systemPrompt = `You are a content tagging assistant. Based on the title and body text, suggest up to ${maxTags} relevant tags.
Return a JSON object with:
- "tags": an array of tag strings (each 1-3 words, lowercase)

Tags should be specific, relevant, and useful for content categorization.`;

  const userContent = `Title: ${title}\n\nBody: ${body}`;

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { maxTokens: FEATURE_MAX_TOKENS.tags }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  return {
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, maxTags) : [],
    inputTokens,
    outputTokens,
    costKes,
  };
};

/**
 * Generate SEO meta description and keywords.
 * @param {string} title - Content title
 * @param {string} body - Content body text
 * @param {string} locale - Language locale
 * @returns {Promise<object>} { metaDescription, metaKeywords, inputTokens, outputTokens, costKes }
 */
const suggestSeo = async (title, body, locale = 'en') => {
  const localeNames = { en: 'English', sw: 'Kiswahili', pok: 'Pokot' };
  const langName = localeNames[locale] || 'English';

  const systemPrompt = `You are an SEO specialist. Generate SEO metadata for the following content in ${langName}.
Return a JSON object with:
- "metaDescription": a compelling meta description (150-160 characters)
- "metaKeywords": a comma-separated string of relevant keywords

Keep the description natural and engaging. Keywords should be specific to the content.`;

  const userContent = `Title: ${title}\n\nBody: ${body}`;

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { maxTokens: FEATURE_MAX_TOKENS.seo }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  return {
    metaDescription: parsed.metaDescription || '',
    metaKeywords: parsed.metaKeywords || '',
    inputTokens,
    outputTokens,
    costKes,
  };
};

/**
 * Generate alt text for an image.
 * @param {string} imageUrl - URL/path to the image
 * @param {string} context - Optional context about the image
 * @returns {Promise<object>} { altText, inputTokens, outputTokens, costKes }
 */
const generateAltText = async (imageUrl, context = '') => {
  const systemPrompt = `You are an accessibility specialist. Generate concise, descriptive alt text for an image.
Return a JSON object with:
- "altText": a brief alt text description (under 125 characters)

The alt text should describe what is visually shown in the image for screen reader users. Be specific but concise.`;

  const userContent = context
    ? `Image URL: ${imageUrl}\nContext: ${context}`
    : `Image URL: ${imageUrl}`;

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { maxTokens: FEATURE_MAX_TOKENS.alt }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  return {
    altText: parsed.altText || '',
    inputTokens,
    outputTokens,
    costKes,
  };
};

/**
 * Improve/rewrite text according to an instruction.
 * @param {string} text - Text to improve
 * @param {string} instruction - Improvement instruction (e.g., "make it more professional", "simplify language")
 * @returns {Promise<object>} { rewrittenText, inputTokens, outputTokens, costKes }
 */
const improveWriting = async (text, instruction) => {
  const systemPrompt = `You are a professional writing assistant. Rewrite the following text according to the user's instruction.
Return a JSON object with:
- "rewrittenText": the improved/rewritten text

Preserve all HTML formatting, line breaks, and structure. Only make changes that align with the instruction.`;

  const userContent = `Instruction: ${instruction}\n\nText:\n${text}`;

  const { content, inputTokens, outputTokens } = await callDeepSeek(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { maxTokens: FEATURE_MAX_TOKENS.improve }
  );

  const parsed = parseJsonResponse(content);
  const costKes = calculateCost(inputTokens, outputTokens);

  return {
    rewrittenText: parsed.rewrittenText || '',
    inputTokens,
    outputTokens,
    costKes,
  };
};

module.exports = {
  callDeepSeek,
  parseJsonResponse,
  checkGrammar,
  translateText,
  suggestTags,
  suggestSeo,
  generateAltText,
  improveWriting,
};
