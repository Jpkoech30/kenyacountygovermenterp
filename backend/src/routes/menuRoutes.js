const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const menuController = require('../controllers/menuController');

/**
 * Menu Routes
 *
 * Public:
 *   GET  /api/public/menus/:location  — Get nested menu tree for header/footer
 *
 * Admin (all require authentication + admin role):
 *   GET    /api/admin/menus                        — List all menus
 *   POST   /api/admin/menus                        — Create a new menu
 *   PUT    /api/admin/menus/:id                    — Update a menu
 *   DELETE /api/admin/menus/:id                    — Delete a menu
 *
 *   GET    /api/admin/menus/lookup/published-pages — Published pages for linking
 *   GET    /api/admin/menus/lookup/categories      — Categories for linking
 *
 *   GET    /api/admin/menus/:menuId/items          — List items in a menu
 *   POST   /api/admin/menus/:menuId/items          — Create a menu item
 *   PUT    /api/admin/menus/:menuId/items/:itemId  — Update a menu item
 *   DELETE /api/admin/menus/:menuId/items/:itemId  — Delete a menu item
 *   PUT    /api/admin/menus/:menuId/reorder        — Reorder menu items
 */

// ============================================================
// Admin Routes
// ============================================================

// Lookup endpoints (must be defined BEFORE /:menuId routes to avoid param conflicts)
router.get(
  '/menus/lookup/published-pages',
  authenticate,
  authorize('admin'),
  menuController.getPublishedPages
);
router.get(
  '/menus/lookup/categories',
  authenticate,
  authorize('admin'),
  menuController.getCategories
);

// Menu CRUD
router.get('/menus', authenticate, authorize('admin'), menuController.listMenus);
router.post('/menus', authenticate, authorize('admin'), menuController.createMenu);
router.put('/menus/:id', authenticate, authorize('admin'), menuController.updateMenu);
router.delete('/menus/:id', authenticate, authorize('admin'), menuController.deleteMenu);

// Menu Item CRUD
router.get('/menus/:menuId/items', authenticate, authorize('admin'), menuController.listMenuItems);
router.post('/menus/:menuId/items', authenticate, authorize('admin'), menuController.createMenuItem);
router.put('/menus/:menuId/items/:itemId', authenticate, authorize('admin'), menuController.updateMenuItem);
router.delete('/menus/:menuId/items/:itemId', authenticate, authorize('admin'), menuController.deleteMenuItem);

// Reorder
router.put('/menus/:menuId/reorder', authenticate, authorize('admin'), menuController.reorderMenuItems);

module.exports = router;
