const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

/**
 * Authentication Routes
 * Public: login
 * Protected: register (admin only), me (authenticated users)
 */

// POST /api/auth/login - Public: authenticate user
router.post('/login', authController.login);

// POST /api/auth/register - Protected: create new user (admin only)
router.post('/register', authenticate, authorize('admin'), authController.register);

// GET /api/auth/me - Protected: get current user profile
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/reset-password - Public: reset password using token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
