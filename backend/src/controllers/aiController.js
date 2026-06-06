const { Op, fn, col } = require('sequelize');
const aiService = require('../services/aiService');
const LlmUsageLog = require('../models/LlmUsageLog');

/**
 * AI Assist Controller
 * Handles all /api/ai/* endpoints with:
 * - Request validation
 * - Usage logging
 * - Daily token budget enforcement
 * - Error handling
 */

// --- Rate Limiting (per-user per-hour) ---
const rateLimitMap = new Map();
const RATE_LIMIT = 20; // requests per hour per user
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if user has exceeded rate limit.
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    // Reset window
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    const resetMinutes = Math.ceil((entry.resetAt - now) / 60000);
    return { allowed: false, remaining: 0, resetMinutes };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
};

// --- Daily Token Budget (per-user) ---
// Reduced to minimize DeepSeek API costs
const DAILY_INPUT_BUDGET = 50_000;   // max input tokens per user per day
const DAILY_OUTPUT_BUDGET = 25_000;  // max output tokens per user per day

/**
 * Check if user has remaining daily token budget.
 * Queries LlmUsageLog for today's total usage.
 */
const checkDailyBudget = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await LlmUsageLog.findAll({
      where: {
        user_id: userId,
        createdAt: { [Op.gte]: today },
      },
      attributes: [
        [fn('COALESCE', fn('SUM', col('input_tokens')), 0), 'totalInput'],
        [fn('COALESCE', fn('SUM', col('output_tokens')), 0), 'totalOutput'],
      ],
      raw: true,
    });

    const totals = usage[0] || { totalInput: 0, totalOutput: 0 };
    const usedInput = parseInt(totals.totalInput, 10) || 0;
    const usedOutput = parseInt(totals.totalOutput, 10) || 0;

    return {
      allowed: usedInput < DAILY_INPUT_BUDGET && usedOutput < DAILY_OUTPUT_BUDGET,
      usedInput,
      usedOutput,
      remainingInput: Math.max(0, DAILY_INPUT_BUDGET - usedInput),
      remainingOutput: Math.max(0, DAILY_OUTPUT_BUDGET - usedOutput),
      budgetInput: DAILY_INPUT_BUDGET,
      budgetOutput: DAILY_OUTPUT_BUDGET,
    };
  } catch (error) {
    console.error('Failed to check daily budget:', error.message);
    // Allow request if budget check fails (non-blocking)
    return { allowed: true, usedInput: 0, usedOutput: 0, remainingInput: DAILY_INPUT_BUDGET, remainingOutput: DAILY_OUTPUT_BUDGET };
  }
};

/**
 * Log AI usage to the database.
 */
const logUsage = async (userId, feature, inputTokens, outputTokens, costKes, contentId = null, locale = 'en') => {
  try {
    await LlmUsageLog.create({
      user_id: userId,
      content_id: contentId,
      locale,
      feature,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_kes: costKes,
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error.message);
    // Non-blocking: don't fail the request if logging fails
  }
};

/**
 * POST /api/ai/grammar
 * Check grammar and return corrected text.
 */
const checkGrammar = async (req, res, next) => {
  try {
    const { text, locale } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Validation error', message: 'Text is required.' });
    }

    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of ${RATE_LIMIT} requests per hour. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    const budget = await checkDailyBudget(req.user.id);
    if (!budget.allowed) {
      return res.status(429).json({
        error: 'Daily token budget exceeded',
        message: `You have used ${budget.usedInput.toLocaleString()} input tokens and ${budget.usedOutput.toLocaleString()} output tokens today. Your daily budget is ${budget.budgetInput.toLocaleString()} input / ${budget.budgetOutput.toLocaleString()} output tokens. Please try again tomorrow.`,
        budget,
      });
    }

    const result = await aiService.checkGrammar(text, locale || 'en');

    await logUsage(req.user.id, 'grammar', result.inputTokens, result.outputTokens, result.costKes);

    res.json({
      corrected: result.corrected,
      changes: result.changes,
      cost: result.costKes,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      budget: { remainingInput: budget.remainingInput - result.inputTokens, remainingOutput: budget.remainingOutput - result.outputTokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/translate
 * Translate text between locales.
 */
const translateText = async (req, res, next) => {
  try {
    const { text, sourceLocale, targetLocale } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Validation error', message: 'Text is required.' });
    }
    if (!sourceLocale || !targetLocale) {
      return res.status(400).json({ error: 'Validation error', message: 'sourceLocale and targetLocale are required.' });
    }
    if (sourceLocale === targetLocale) {
      return res.status(400).json({ error: 'Validation error', message: 'sourceLocale and targetLocale must be different.' });
    }

    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of ${RATE_LIMIT} requests per hour. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    const budget = await checkDailyBudget(req.user.id);
    if (!budget.allowed) {
      return res.status(429).json({
        error: 'Daily token budget exceeded',
        message: `You have used ${budget.usedInput.toLocaleString()} input tokens and ${budget.usedOutput.toLocaleString()} output tokens today. Your daily budget is ${budget.budgetInput.toLocaleString()} input / ${budget.budgetOutput.toLocaleString()} output tokens. Please try again tomorrow.`,
        budget,
      });
    }

    const result = await aiService.translateText(text, sourceLocale, targetLocale);

    await logUsage(req.user.id, 'translate', result.inputTokens, result.outputTokens, result.costKes);

    res.json({
      translatedText: result.translatedText,
      cost: result.costKes,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      budget: { remainingInput: budget.remainingInput - result.inputTokens, remainingOutput: budget.remainingOutput - result.outputTokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/suggest-tags
 * Generate tag suggestions from content.
 */
const suggestTags = async (req, res, next) => {
  try {
    const { title, body, maxTags } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Validation error', message: 'Title is required.' });
    }

    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of ${RATE_LIMIT} requests per hour. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    const budget = await checkDailyBudget(req.user.id);
    if (!budget.allowed) {
      return res.status(429).json({
        error: 'Daily token budget exceeded',
        message: `You have used ${budget.usedInput.toLocaleString()} input tokens and ${budget.usedOutput.toLocaleString()} output tokens today. Your daily budget is ${budget.budgetInput.toLocaleString()} input / ${budget.budgetOutput.toLocaleString()} output tokens. Please try again tomorrow.`,
        budget,
      });
    }

    const result = await aiService.suggestTags(title, body || '', maxTags || 5);

    await logUsage(req.user.id, 'tags', result.inputTokens, result.outputTokens, result.costKes);

    res.json({
      tags: result.tags,
      cost: result.costKes,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      budget: { remainingInput: budget.remainingInput - result.inputTokens, remainingOutput: budget.remainingOutput - result.outputTokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/suggest-seo
 * Generate SEO metadata.
 */
const suggestSeo = async (req, res, next) => {
  try {
    const { title, body, locale } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Validation error', message: 'Title is required.' });
    }

    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of ${RATE_LIMIT} requests per hour. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    const budget = await checkDailyBudget(req.user.id);
    if (!budget.allowed) {
      return res.status(429).json({
        error: 'Daily token budget exceeded',
        message: `You have used ${budget.usedInput.toLocaleString()} input tokens and ${budget.usedOutput.toLocaleString()} output tokens today. Your daily budget is ${budget.budgetInput.toLocaleString()} input / ${budget.budgetOutput.toLocaleString()} output tokens. Please try again tomorrow.`,
        budget,
      });
    }

    const result = await aiService.suggestSeo(title, body || '', locale || 'en');

    await logUsage(req.user.id, 'seo', result.inputTokens, result.outputTokens, result.costKes);

    res.json({
      metaDescription: result.metaDescription,
      metaKeywords: result.metaKeywords,
      cost: result.costKes,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      budget: { remainingInput: budget.remainingInput - result.inputTokens, remainingOutput: budget.remainingOutput - result.outputTokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/generate-alt
 * Generate alt text for an image.
 */
const generateAltText = async (req, res, next) => {
  try {
    const { imageUrl, context } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'Validation error', message: 'imageUrl is required.' });
    }

    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of ${RATE_LIMIT} requests per hour. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    const budget = await checkDailyBudget(req.user.id);
    if (!budget.allowed) {
      return res.status(429).json({
        error: 'Daily token budget exceeded',
        message: `You have used ${budget.usedInput.toLocaleString()} input tokens and ${budget.usedOutput.toLocaleString()} output tokens today. Your daily budget is ${budget.budgetInput.toLocaleString()} input / ${budget.budgetOutput.toLocaleString()} output tokens. Please try again tomorrow.`,
        budget,
      });
    }

    const result = await aiService.generateAltText(imageUrl, context || '');

    await logUsage(req.user.id, 'alt', result.inputTokens, result.outputTokens, result.costKes);

    res.json({
      altText: result.altText,
      cost: result.costKes,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      budget: { remainingInput: budget.remainingInput - result.inputTokens, remainingOutput: budget.remainingOutput - result.outputTokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/improve-writing
 * Improve/rewrite text according to instruction.
 */
const improveWriting = async (req, res, next) => {
  try {
    const { text, instruction } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Validation error', message: 'Text is required.' });
    }
    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return res.status(400).json({ error: 'Validation error', message: 'Instruction is required.' });
    }

    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit of ${RATE_LIMIT} requests per hour. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    const budget = await checkDailyBudget(req.user.id);
    if (!budget.allowed) {
      return res.status(429).json({
        error: 'Daily token budget exceeded',
        message: `You have used ${budget.usedInput.toLocaleString()} input tokens and ${budget.usedOutput.toLocaleString()} output tokens today. Your daily budget is ${budget.budgetInput.toLocaleString()} input / ${budget.budgetOutput.toLocaleString()} output tokens. Please try again tomorrow.`,
        budget,
      });
    }

    const result = await aiService.improveWriting(text, instruction);

    await logUsage(req.user.id, 'improve', result.inputTokens, result.outputTokens, result.costKes);

    res.json({
      rewrittenText: result.rewrittenText,
      cost: result.costKes,
      usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      budget: { remainingInput: budget.remainingInput - result.inputTokens, remainingOutput: budget.remainingOutput - result.outputTokens },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkGrammar,
  translateText,
  suggestTags,
  suggestSeo,
  generateAltText,
  improveWriting,
};
