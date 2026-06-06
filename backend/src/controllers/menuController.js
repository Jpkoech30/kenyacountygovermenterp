const { Op } = require('sequelize');
const Menu = require('../models/Menu');
const MenuItem = require('../models/MenuItem');
const Content = require('../models/Content');
const ContentTranslation = require('../models/ContentTranslation');
const Taxonomy = require('../models/Taxonomy');

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================

/**
 * GET /api/public/menus/:location
 * Returns a nested menu tree for a given location (header/footer).
 * Query params: locale (en|sw|pok) — defaults to 'en'
 */
const getPublicMenus = async (req, res, next) => {
  try {
    const { location } = req.params;
    const locale = req.query.locale || 'en';

    if (!['header', 'footer'].includes(location)) {
      return res.status(400).json({ error: 'Invalid menu location. Must be "header" or "footer".' });
    }

    const menu = await Menu.findOne({
      where: { location },
      include: [
        {
          model: MenuItem,
          as: 'items',
          where: { is_active: true },
          required: false,
          order: [['sort_order', 'ASC']],
        },
      ],
    });

    if (!menu) {
      return res.json({ menu: null, items: [] });
    }

    // Build nested tree
    const items = buildMenuTree(menu.items || [], locale);

    res.json({
      menu: {
        id: menu.id,
        name: menu.name,
        location: menu.location,
      },
      items,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN ENDPOINTS — Menus CRUD
// ============================================================

/**
 * GET /api/admin/menus
 * List all menus with item counts.
 */
const listMenus = async (req, res, next) => {
  try {
    const menus = await Menu.findAll({
      include: [
        {
          model: MenuItem,
          as: 'items',
          attributes: [],
          required: false,
        },
      ],
      attributes: {
        include: [
          [
            require('sequelize').fn('COUNT', require('sequelize').col('items.id')),
            'itemCount',
          ],
        ],
      },
      group: ['Menu.id'],
      order: [['location', 'ASC']],
    });

    res.json({ menus });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/menus
 * Create a new menu (e.g., "Main Header Menu", "Footer Menu").
 */
const createMenu = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required.' });
    }

    if (!['header', 'footer'].includes(location)) {
      return res.status(400).json({ error: 'Location must be "header" or "footer".' });
    }

    // Check uniqueness of location
    const existing = await Menu.findOne({ where: { location } });
    if (existing) {
      return res.status(409).json({ error: `A menu for location "${location}" already exists.` });
    }

    const menu = await Menu.create({ name, location });
    res.status(201).json({ menu });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/menus/:id
 * Update a menu (name only, location cannot be changed).
 */
const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found.' });
    }

    if (name) menu.name = name;
    await menu.save();

    res.json({ menu });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/menus/:id
 * Delete a menu and all its items (CASCADE).
 */
const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found.' });
    }

    await menu.destroy();
    res.json({ message: 'Menu deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN ENDPOINTS — Menu Items CRUD
// ============================================================

/**
 * GET /api/admin/menus/:menuId/items
 * Get all items for a menu as a flat list (for the editor).
 */
const listMenuItems = async (req, res, next) => {
  try {
    const { menuId } = req.params;

    const menu = await Menu.findByPk(menuId);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found.' });
    }

    const items = await MenuItem.findAll({
      where: { menu_id: menuId },
      order: [['sort_order', 'ASC']],
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/menus/:menuId/items
 * Create a new menu item.
 */
const createMenuItem = async (req, res, next) => {
  try {
    const { menuId } = req.params;
    const { parent_id, title, type, target_id, url, sort_order, is_active } = req.body;

    const menu = await Menu.findByPk(menuId);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found.' });
    }

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required.' });
    }

    if (!['page', 'category', 'custom_url', 'external_link'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be page, category, custom_url, or external_link.' });
    }

    // Validate parent_id if provided
    if (parent_id) {
      const parent = await MenuItem.findOne({ where: { id: parent_id, menu_id: menuId } });
      if (!parent) {
        return res.status(400).json({ error: 'Parent item not found in this menu.' });
      }
    }

    // Get next sort_order if not provided
    let nextOrder = sort_order;
    if (nextOrder === undefined || nextOrder === null) {
      const lastItem = await MenuItem.findOne({
        where: { menu_id: menuId },
        order: [['sort_order', 'DESC']],
      });
      nextOrder = lastItem ? lastItem.sort_order + 1 : 0;
    }

    const item = await MenuItem.create({
      menu_id: parseInt(menuId),
      parent_id: parent_id || null,
      title: typeof title === 'string' ? { en: title } : title,
      type,
      target_id: target_id || null,
      url: url || null,
      sort_order: nextOrder,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/menus/:menuId/items/:itemId
 * Update a menu item.
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const { menuId, itemId } = req.params;
    const { parent_id, title, type, target_id, url, sort_order, is_active } = req.body;

    const item = await MenuItem.findOne({ where: { id: itemId, menu_id: menuId } });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    if (title !== undefined) {
      item.title = typeof title === 'string' ? { en: title } : title;
    }
    if (type !== undefined) {
      if (!['page', 'category', 'custom_url', 'external_link'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type.' });
      }
      item.type = type;
    }
    if (parent_id !== undefined) item.parent_id = parent_id || null;
    if (target_id !== undefined) item.target_id = target_id || null;
    if (url !== undefined) item.url = url || null;
    if (sort_order !== undefined) item.sort_order = sort_order;
    if (is_active !== undefined) item.is_active = is_active;

    await item.save();
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/menus/:menuId/items/:itemId
 * Delete a menu item (children's parent_id set to null).
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const { menuId, itemId } = req.params;

    const item = await MenuItem.findOne({ where: { id: itemId, menu_id: menuId } });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    // Orphan children
    await MenuItem.update(
      { parent_id: null },
      { where: { parent_id: itemId } }
    );

    await item.destroy();
    res.json({ message: 'Menu item deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/menus/:menuId/reorder
 * Reorder menu items. Expects body: { items: [{ id, sort_order, parent_id }] }
 */
const reorderMenuItems = async (req, res, next) => {
  try {
    const { menuId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required.' });
    }

    const menu = await Menu.findByPk(menuId);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found.' });
    }

    for (const item of items) {
      await MenuItem.update(
        {
          sort_order: item.sort_order,
          parent_id: item.parent_id !== undefined ? item.parent_id : null,
        },
        { where: { id: item.id, menu_id: menuId } }
      );
    }

    const updatedItems = await MenuItem.findAll({
      where: { menu_id: menuId },
      order: [['sort_order', 'ASC']],
    });

    res.json({ items: updatedItems });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN ENDPOINTS — Lookup data for menu item forms
// ============================================================

/**
 * GET /api/admin/menus/lookup/published-pages
 * Returns published pages (id, slug, title per locale) for linking.
 */
const getPublishedPages = async (req, res, next) => {
  try {
    const pages = await Content.findAll({
      where: {
        type: 'page',
        status: 'published',
      },
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          attributes: ['locale', 'title'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const result = pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      translations: p.translations.reduce((acc, t) => {
        acc[t.locale] = t.title;
        return acc;
      }, {}),
    }));

    res.json({ pages: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/menus/lookup/categories
 * Returns all categories for linking.
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Taxonomy.findAll({
      where: { type: 'category' },
      order: [['name', 'ASC']],
    });

    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Build a nested tree from a flat list of menu items.
 */
function buildMenuTree(items, locale) {
  const map = {};
  const roots = [];

  // First pass: create map
  items.forEach((item) => {
    const title = item.title && item.title[locale] ? item.title[locale] : (item.title?.en || 'Untitled');
    map[item.id] = {
      id: item.id,
      parent_id: item.parent_id,
      title,
      type: item.type,
      target_id: item.target_id,
      url: item.url,
      sort_order: item.sort_order,
      is_active: item.is_active,
      children: [],
    };
  });

  // Second pass: link children to parents
  items.forEach((item) => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    } else if (!item.parent_id) {
      roots.push(map[item.id]);
    }
  });

  // Sort children recursively
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

module.exports = {
  // Public
  getPublicMenus,
  // Admin — Menus
  listMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  // Admin — Menu Items
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  // Admin — Lookup
  getPublishedPages,
  getCategories,
};
