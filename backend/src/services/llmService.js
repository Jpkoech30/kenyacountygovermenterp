const axios = require('axios');
const Setting = require('../models/Setting');

/**
 * LLM Service - DeepSeek API integration for AI content summarisation.
 *
 * Pricing (DeepSeek):
 *   - Input: $0.435 per 1M tokens
 *   - Output: $0.87 per 1M tokens
 * Exchange rate: 129.59 KES/USD
 */

const KES_PER_USD = 129.59;
const INPUT_TOKEN_PRICE = 0.435 / 1_000_000;   // $ per input token
const OUTPUT_TOKEN_PRICE = 0.87 / 1_000_000;    // $ per output token

/**
 * Maximum input characters sent to DeepSeek for summarisation.
 * Reduces token consumption by truncating long body text.
 * ~4000 chars ≈ 1000-1500 tokens — sufficient for summarisation context.
 */
const MAX_INPUT_CHARS = 4000;

/**
 * Get a setting value by key from the database.
 * @param {string} key - Setting key
 * @param {string} defaultValue - Fallback value
 * @returns {Promise<string>}
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
 * Calculate the cost in KES for a given token usage.
 * @param {number} inputTokens - Number of input tokens used
 * @param {number} outputTokens - Number of output tokens generated
 * @returns {number} - Cost in Kenyan Shillings (2 decimal places)
 */
const calculateCost = (inputTokens, outputTokens) => {
  const costUsd = (inputTokens * INPUT_TOKEN_PRICE) + (outputTokens * OUTPUT_TOKEN_PRICE);
  const costKes = costUsd * KES_PER_USD;
  return Math.round(costKes * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate a summary of the given text using DeepSeek API.
 * @param {string} text - The content text to summarize
 * @param {string} locale - Target locale (en, sw, pok)
 * @param {object} options - Optional overrides (maxTokens, temperature)
 * @returns {Promise<{ summary: string, inputTokens: number, outputTokens: number, costKes: number }>}
 */
const summarize = async (text, locale = 'en', options = {}) => {
  // Check if LLM is enabled
  const enabled = await getSetting('llm_enabled', 'false');
  if (enabled !== 'true') {
    throw new Error('AI summarisation is disabled. Enable it in Settings.');
  }

  const apiKey = await getSetting('llm_api_key', '');
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured. Set it in Settings.');
  }

  const model = options.model || await getSetting('llm_model', 'deepseek-chat');
  const maxTokens = options.maxTokens || parseInt(await getSetting('llm_max_tokens', '1000'), 10);
  const temperature = options.temperature || parseFloat(await getSetting('llm_temperature', '0.3'));

  // Build locale-specific prompt
  const localePrompts = {
    en: 'Please provide a concise summary of the following content in English:',
    sw: 'Tafadhali toa muhtasari mfupi wa maudhui yafuatayo kwa Kiswahili:',
    pok: 'Konyokonyo kaal akai ngoleeta ka Pokot:',
  };

  const systemPrompt = localePrompts[locale] || localePrompts.en;

  // Truncate input text to reduce token consumption
  const truncatedText = text.length > MAX_INPUT_CHARS
    ? text.slice(0, MAX_INPUT_CHARS) + '\n\n[...content truncated for token efficiency]'
    : text;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: truncatedText },
        ],
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const result = response.data;
    const summary = result.choices[0]?.message?.content || '';
    const usage = result.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const costKes = calculateCost(inputTokens, outputTokens);

    return {
      summary,
      inputTokens,
      outputTokens,
      costKes,
    };
  } catch (error) {
    // Handle API errors gracefully
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

module.exports = {
  summarize,
  calculateCost,
  KES_PER_USD,
};
