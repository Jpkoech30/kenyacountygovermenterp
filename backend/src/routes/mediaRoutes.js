const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const mediaController = require('../controllers/mediaController');

/**
 * Media Routes - file upload and management.
 * Uses multer for file upload handling.
 * Max file size: 10MB per file.
 */

// Configure multer for memory storage (files will be written to disk by mediaService)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common image and document types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
    }
  },
});

// Routes
router.post('/upload', authenticate, upload.array('files', 10), mediaController.uploadMedia);
router.get('/', authenticate, mediaController.listMedia);
router.put('/:id', authenticate, mediaController.updateMedia);
router.delete('/:id', authenticate, mediaController.deleteMedia);

module.exports = router;
