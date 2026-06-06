const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const checkAiAccess = require('../middleware/checkAiAccess');
const aiController = require('../controllers/aiController');
const aiContentAssistantController = require('../controllers/aiContentAssistantController');

// Multer config for file upload (memory storage, 10MB limit, TXT/PDF/DOCX only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Supported types: TXT, PDF, DOCX.`), false);
    }
  },
});

/**
 * AI Assist Routes
 * All routes require authentication + AI access check.
 * Mounted at: /api/ai
 */

// Grammar check
router.post('/grammar', authenticate, checkAiAccess, aiController.checkGrammar);

// Translate text
router.post('/translate', authenticate, checkAiAccess, aiController.translateText);

// Suggest tags
router.post('/suggest-tags', authenticate, checkAiAccess, aiController.suggestTags);

// Suggest SEO metadata
router.post('/suggest-seo', authenticate, checkAiAccess, aiController.suggestSeo);

// Generate alt text for images
router.post('/generate-alt', authenticate, checkAiAccess, aiController.generateAltText);

// Improve writing
router.post('/improve-writing', authenticate, checkAiAccess, aiController.improveWriting);

// AI Content Assistant - Generate draft from URL
router.post('/content-assistant/from-url', authenticate, checkAiAccess, aiContentAssistantController.generateFromUrl);

// AI Content Assistant - Generate draft from file (media library)
router.post('/content-assistant/from-file', authenticate, checkAiAccess, aiContentAssistantController.generateFromFile);

// AI Content Assistant - Generate draft from direct file upload (from user's computer)
router.post(
  '/content-assistant/from-file-upload',
  authenticate,
  checkAiAccess,
  upload.single('file'),
  aiContentAssistantController.generateFromFileUpload
);

module.exports = router;
