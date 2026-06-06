const LlmUsageLog = require('../models/LlmUsageLog');
const User = require('../models/User');
const llmService = require('../services/llmService');

/**
 * LLM Controller - standalone AI summarisation endpoint.
 * Can be used to summarize arbitrary text without creating content first.
 */

/**
 * POST /api/llm/summarize - Summarize arbitrary text
 */
const summarizeText = async (req, res, next) => {
  try {
    const { text, locale = 'en' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'text is required.',
      });
    }

    if (text.length > 50000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Text exceeds maximum length of 50,000 characters.',
      });
    }

    try {
      const result = await llmService.summarize(text, locale);

      // Log usage
      await LlmUsageLog.create({
        user_id: req.user.id,
        content_id: null,
        locale,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        cost_kes: result.costKes,
      });

      res.json({
        summary: result.summary,
        usage: {
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          cost_kes: result.costKes,
        },
      });
    } catch (llmError) {
      return res.status(502).json({
        error: 'AI service error',
        message: llmError.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summarizeText,
};
