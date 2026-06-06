const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

/**
 * User Management Routes
 * All routes require authentication.
 * Admin-only routes are protected by authorize('admin') middleware.
 */

// PATCH /api/users/me/guide - Update current user's guide preferences
router.patch('/me/guide', authenticate, userController.updateMyGuide);

// GET /api/users - Admin: list all users (paginated, filterable)
router.get('/', authenticate, authorize('admin'), userController.getUsers);

// POST /api/users - Admin: create new user
router.post('/', authenticate, authorize('admin'), userController.createUser);

// GET /api/users/:id - Admin: get user by ID
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);

// PUT /api/users/:id - Admin: update user
router.put('/:id', authenticate, authorize('admin'), userController.updateUser);

// DELETE /api/users/:id - Admin: soft delete user
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

// POST /api/users/:id/reset-guide - Admin: reset user's guide progress
router.post('/:id/reset-guide', authenticate, authorize('admin'), userController.resetGuide);

module.exports = router;
