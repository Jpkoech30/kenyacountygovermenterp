const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const taxonomyController = require('../controllers/taxonomyController');

/**
 * Taxonomy Routes - CRUD for categories and tags.
 * Read operations available to all authenticated users.
 * Write operations restricted to editors and above.
 */

router.get('/', authenticate, taxonomyController.listTaxonomies);
router.post('/', authenticate, authorize('editor', 'reviewer', 'publisher', 'admin'), taxonomyController.createTaxonomy);
router.get('/:id', authenticate, taxonomyController.getTaxonomyById);
router.put('/:id', authenticate, authorize('editor', 'reviewer', 'publisher', 'admin'), taxonomyController.updateTaxonomy);
router.delete('/:id', authenticate, authorize('admin'), taxonomyController.deleteTaxonomy);

module.exports = router;
