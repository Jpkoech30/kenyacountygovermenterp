const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const authenticate = require('../middleware/authenticate');

/**
 * Lookup Routes
 * Protected: requires authentication
 * Provides dropdown data for roles and departments.
 */

// GET /api/roles - Get all roles
router.get('/roles', authenticate, lookupController.getRoles);

// GET /api/departments - Get all departments
router.get('/departments', authenticate, lookupController.getDepartments);

// GET /api/positions - Get all active positions
router.get('/positions', authenticate, lookupController.getPositions);

module.exports = router;
