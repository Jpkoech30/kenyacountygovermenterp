const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const contentController = require('../controllers/contentController');

/**
 * Content Routes - CRUD and workflow management.
 * All routes require authentication.
 * Workflow actions are role-restricted.
 */

// CRUD - available to editors, reviewers, publishers, and admins
router.get('/', authenticate, contentController.getContentList);
router.post('/', authenticate, contentController.createContent);
router.get('/:id', authenticate, contentController.getContentById);
router.put('/:id', authenticate, contentController.updateContent);
router.delete('/:id', authenticate, contentController.deleteContent);

// Workflow actions
router.post('/:id/submit', authenticate, contentController.submitContent);
router.post('/:id/approve', authenticate, authorize('reviewer', 'publisher', 'admin'), contentController.approveContent);
router.post('/:id/reject', authenticate, authorize('reviewer', 'publisher', 'admin'), contentController.rejectContent);
router.post('/:id/publish', authenticate, authorize('publisher', 'admin'), contentController.publishContent);
router.post('/:id/schedule', authenticate, authorize('publisher', 'admin'), contentController.scheduleContent);
router.post('/:id/unschedule', authenticate, authorize('publisher', 'admin'), contentController.unscheduleContent);
router.post('/:id/archive', authenticate, authorize('publisher', 'admin'), contentController.archiveContent);

// Version management
router.get('/:id/versions', authenticate, contentController.getContentVersions);
router.post('/:id/restore/:versionId', authenticate, authorize('admin'), contentController.restoreContentVersion);

// AI summarisation
router.post('/:id/summarize', authenticate, contentController.summarizeContent);

// Bulk visibility actions
router.post('/bulk/hide', authenticate, authorize('publisher', 'admin'), contentController.bulkHideContent);
router.post('/bulk/show', authenticate, authorize('publisher', 'admin'), contentController.bulkShowContent);

module.exports = router;
