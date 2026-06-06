const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const personaController = require('../controllers/personaController');

/**
 * Persona Routes — staff wizard and directory management.
 * All routes require admin role.
 */

// GET /api/admin/persona/templates - Get persona templates and available roles
router.get('/templates', authenticate, authorize('admin'), personaController.getTemplates);

// POST /api/admin/persona/wizard - Create Person + optional Content + optional User
router.post('/wizard', authenticate, authorize('admin'), personaController.runWizard);

// GET /api/admin/persona/staff - List all staff with linked user accounts
router.get('/staff', authenticate, authorize('admin'), personaController.listStaff);

module.exports = router;
