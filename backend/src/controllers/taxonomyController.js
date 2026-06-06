const { Op } = require('sequelize');
const Taxonomy = require('../models/Taxonomy');

/**
 * Taxonomy Controller - CRUD for categories and tags.
 */

/**
 * GET /api/taxonomies - List all taxonomies with optional type filter
 */
const listTaxonomies = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const where = {};
    if (type) where.type = type;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Taxonomy.findAndCountAll({
      where,
      include: [
        {
          model: Taxonomy,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Taxonomy,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['type', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      taxonomies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/taxonomies - Create a new taxonomy
 */
const createTaxonomy = async (req, res, next) => {
  try {
    const { name, type, slug, parent_id } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'name and slug are required.',
      });
    }

    // Check slug uniqueness within type
    const existing = await Taxonomy.findOne({ where: { type: type || 'category', slug } });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: `A ${type || 'category'} with slug "${slug}" already exists.`,
      });
    }

    const taxonomy = await Taxonomy.create({
      name,
      type: type || 'category',
      slug,
      parent_id: parent_id || null,
    });

    const created = await Taxonomy.findByPk(taxonomy.id, {
      include: [
        { model: Taxonomy, as: 'parent', attributes: ['id', 'name', 'slug'] },
      ],
    });

    res.status(201).json({ taxonomy: created });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/taxonomies/:id - Get single taxonomy
 */
const getTaxonomyById = async (req, res, next) => {
  try {
    const taxonomy = await Taxonomy.findByPk(req.params.id, {
      include: [
        { model: Taxonomy, as: 'parent', attributes: ['id', 'name', 'slug'] },
        { model: Taxonomy, as: 'children', attributes: ['id', 'name', 'slug'] },
      ],
    });

    if (!taxonomy) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Taxonomy not found.',
      });
    }

    res.json({ taxonomy });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/taxonomies/:id - Update taxonomy
 */
const updateTaxonomy = async (req, res, next) => {
  try {
    const taxonomy = await Taxonomy.findByPk(req.params.id);
    if (!taxonomy) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Taxonomy not found.',
      });
    }

    const { name, slug, parent_id } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (slug) updateFields.slug = slug;
    if (parent_id !== undefined) updateFields.parent_id = parent_id;

    await taxonomy.update(updateFields);

    const updated = await Taxonomy.findByPk(taxonomy.id, {
      include: [
        { model: Taxonomy, as: 'parent', attributes: ['id', 'name', 'slug'] },
        { model: Taxonomy, as: 'children', attributes: ['id', 'name', 'slug'] },
      ],
    });

    res.json({ taxonomy: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/taxonomies/:id - Delete taxonomy
 */
const deleteTaxonomy = async (req, res, next) => {
  try {
    const taxonomy = await Taxonomy.findByPk(req.params.id);
    if (!taxonomy) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Taxonomy not found.',
      });
    }

    // Check if taxonomy has children
    const childrenCount = await Taxonomy.count({ where: { parent_id: taxonomy.id } });
    if (childrenCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete',
        message: `This ${taxonomy.type} has ${childrenCount} sub-item(s). Remove them first.`,
      });
    }

    await taxonomy.destroy();

    res.json({
      message: 'Taxonomy deleted successfully.',
      taxonomy: { id: taxonomy.id, name: taxonomy.name },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTaxonomies,
  createTaxonomy,
  getTaxonomyById,
  updateTaxonomy,
  deleteTaxonomy,
};
