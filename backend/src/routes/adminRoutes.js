const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');
const personaRoutes = require('./personaRoutes');

/**
 * Admin Routes - settings, persons, facts, hero slides, LLM usage stats, and persona wizard.
 * All routes require admin role.
 */

// Settings
router.get('/settings', authenticate, authorize('admin'), adminController.getSettings);
router.put('/settings', authenticate, authorize('admin'), adminController.updateSettings);

// Persons
router.get('/persons', authenticate, authorize('admin'), adminController.listPersons);
router.post('/persons', authenticate, authorize('admin'), adminController.createPerson);
router.put('/persons/:id', authenticate, authorize('admin'), adminController.updatePerson);
router.delete('/persons/:id', authenticate, authorize('admin'), adminController.deletePerson);

// Facts
router.get('/facts', authenticate, authorize('admin'), adminController.listFacts);
router.post('/facts', authenticate, authorize('admin'), adminController.createFact);
router.put('/facts/:id', authenticate, authorize('admin'), adminController.updateFact);
router.delete('/facts/:id', authenticate, authorize('admin'), adminController.deleteFact);

// Hero Slides
router.get('/hero-slides', authenticate, authorize('admin'), adminController.listHeroSlides);
router.post('/hero-slides', authenticate, authorize('admin'), adminController.createHeroSlide);
router.put('/hero-slides/:id', authenticate, authorize('admin'), adminController.updateHeroSlide);
router.delete('/hero-slides/:id', authenticate, authorize('admin'), adminController.deleteHeroSlide);

// LLM Usage
router.get('/llm-usage', authenticate, authorize('admin'), adminController.getLlmUsage);

// Persona Wizard & Staff Directory
router.use('/persona', personaRoutes);

module.exports = router;
