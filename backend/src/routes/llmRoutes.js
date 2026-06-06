const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const llmController = require('../controllers/llmController');

/**
 * LLM Routes - standalone AI summarisation.
 * Available to all authenticated users.
 */

router.post('/summarize', authenticate, llmController.summarizeText);

module.exports = router;
