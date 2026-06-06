const { generateFromUrl, generateFromFile } = require('../services/aiContentAssistantService');
const LlmUsageLog = require('../models/LlmUsageLog');
const Media = require('../models/Media');
const mediaService = require('../services/mediaService');
const path = require('path');
const fs = require('fs');

/**
 * AI Content Assistant Controller
 *
 * Handles requests to generate structured content drafts from:
 * - A URL (scrape + AI generate)
 * - An uploaded file (extract + AI generate)
 *
 * Includes:
 * - Input validation
 * - Rate limiting (shared with other AI features via checkAiAccess middleware)
 * - Usage logging
 * - Error handling
 */

/**
 * In-memory rate limiter: Map<userId, { count, resetAt }>
 * 10 requests per user per hour for content assistant (more generous since drafts are heavy)
 */
const rateLimits = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const checkRateLimit = (userId) => {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetMinutes = Math.ceil((entry.resetAt - now) / 60000);
    return { allowed: false, remaining: 0, resetMinutes };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
};

/**
 * Log AI usage to the database.
 */
const logUsage = async (userId, feature, inputTokens, outputTokens, costKes, contentId = null) => {
  await LlmUsageLog.create({
    user_id: userId,
    feature,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_kes: costKes,
    content_id: contentId,
    locale: 'en',
  });
};

/**
 * POST /api/ai/content-assistant/from-url
 * Generate a content draft from a URL.
 * Body: { url: string }
 */
const generateFromUrlHandler = async (req, res, next) => {
  try {
    const { url } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'A valid URL is required.',
      });
    }

    // Basic URL format validation
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid URL format. Must be a valid http or https URL.',
      });
    }

    // Rate limit check
    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Content assistant rate limit reached. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    // Generate draft
    const result = await generateFromUrl(url);

    // Log usage
    await logUsage(
      req.user.id,
      'content_assistant',
      result.inputTokens,
      result.outputTokens,
      result.costKes
    );

    res.json({
      draft: result.draft,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costKes: result.costKes,
        remaining: rateCheck.remaining,
      },
    });
  } catch (error) {
    if (
      error.message.includes('Could not extract') ||
      error.message.includes('DeepSeek API')
    ) {
      return res.status(422).json({
        error: 'Processing error',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/ai/content-assistant/from-file
 * Generate a content draft from an uploaded file.
 * Body: { media_id: number }
 * The file must already be uploaded to the media library.
 */
const generateFromFileHandler = async (req, res, next) => {
  try {
    const { media_id } = req.body;

    // Validate media_id
    if (!media_id || typeof media_id !== 'number') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'A valid media_id (number) is required.',
      });
    }

    // Fetch media record
    const media = await Media.findByPk(media_id);
    if (!media) {
      return res.status(404).json({
        error: 'Not found',
        message: `Media with id ${media_id} not found.`,
      });
    }

    // Determine file path
    const storagePath = process.env.STORAGE_PATH || path.join(__dirname, '../../storage/uploads');
    const filePath = path.join(storagePath, media.disk_filename);

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: `The file "${media.filename}" does not exist on disk. It may have been deleted.`,
      });
    }

    // Check if file type is supported for text extraction
    const supportedMimes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!supportedMimes.includes(media.mime_type)) {
      return res.status(400).json({
        error: 'Unsupported file type',
        message: `File type "${media.mime_type}" is not supported. Supported types: TXT, PDF, DOCX.`,
      });
    }

    // Rate limit check
    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Content assistant rate limit reached. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    // Generate draft
    const result = await generateFromFile(filePath, media.mime_type);

    // Log usage
    await logUsage(
      req.user.id,
      'content_assistant',
      result.inputTokens,
      result.outputTokens,
      result.costKes
    );

    res.json({
      draft: result.draft,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costKes: result.costKes,
        remaining: rateCheck.remaining,
      },
    });
  } catch (error) {
    if (
      error.message.includes('Could not extract') ||
      error.message.includes('DeepSeek API')
    ) {
      return res.status(422).json({
        error: 'Processing error',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/ai/content-assistant/from-file-upload
 * Upload a file directly from the user's computer and generate a content draft.
 * This is a multipart/form-data endpoint that accepts a file upload.
 * The file is saved to the media library, then processed for text extraction and AI generation.
 */
const generateFromFileUploadHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'A file is required.',
      });
    }

    const file = req.file;

    // Check if file type is supported for text extraction
    const supportedMimes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!supportedMimes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Unsupported file type',
        message: `File type "${file.mimetype}" is not supported. Supported types: TXT, PDF, DOCX.`,
      });
    }

    // Save file to media library using mediaService
    // mediaService.saveFile() saves to storage/media/YYYY/MM/ and returns storage_path
    const fileInfo = await mediaService.saveFile(file);
    const media = await Media.create({
      filename: fileInfo.original_filename,
      disk_filename: fileInfo.disk_filename,
      mime_type: fileInfo.mime_type,
      size: fileInfo.size,
      uploaded_by: req.user.id,
    });

    // Construct correct file path using MEDIA_ROOT + storage_path
    // mediaService.saveFile() saves to MEDIA_ROOT/YYYY/MM/uuid.ext
    // fileInfo.storage_path = "YYYY/MM/uuid.ext"
    const filePath = path.join(mediaService.MEDIA_ROOT, fileInfo.storage_path);

    // Rate limit check
    const rateCheck = checkRateLimit(req.user.id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Content assistant rate limit reached. Try again in ${rateCheck.resetMinutes} minutes.`,
      });
    }

    // Generate draft from file
    const result = await generateFromFile(filePath, media.mime_type);

    // Log usage
    await logUsage(
      req.user.id,
      'content_assistant',
      result.inputTokens,
      result.outputTokens,
      result.costKes
    );

    res.json({
      draft: result.draft,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costKes: result.costKes,
        remaining: rateCheck.remaining,
      },
      media: {
        id: media.id,
        filename: media.filename,
      },
    });
  } catch (error) {
    if (
      error.message.includes('Could not extract') ||
      error.message.includes('DeepSeek API')
    ) {
      return res.status(422).json({
        error: 'Processing error',
        message: error.message,
      });
    }
    next(error);
  }
};

module.exports = {
  generateFromUrl: generateFromUrlHandler,
  generateFromFile: generateFromFileHandler,
  generateFromFileUpload: generateFromFileUploadHandler,
};
