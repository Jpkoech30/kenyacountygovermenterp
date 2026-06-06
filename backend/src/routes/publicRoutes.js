const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

/**
 * Public Routes - no authentication required.
 * Serves published content to the public-facing website.
 */

// Content routes
router.get('/content', publicController.getPublicContent);
router.get('/content/:slug', publicController.getPublicContentBySlug);
router.get('/events', publicController.getPublicEvents);
router.get('/tenders', publicController.getPublicTenders);
router.get('/vacancies', publicController.getPublicVacancies);
router.get('/departments', publicController.getPublicDepartments);
router.get('/categories', publicController.getPublicCategories);
router.get('/facts', publicController.getPublicFacts);
router.get('/persons', publicController.getPublicPersons);
router.get('/hero-slides', publicController.getPublicHeroSlides);

// Menu routes
router.get('/menus/:location', publicController.getPublicMenus);

// Contact & Newsletter routes
router.post('/contact', publicController.submitContact);
router.post('/subscribe', publicController.subscribeEmail);

module.exports = router;
