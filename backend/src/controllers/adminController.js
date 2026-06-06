const { Op, fn, col } = require('sequelize');
const Setting = require('../models/Setting');
const Person = require('../models/Person');
const Media = require('../models/Media');
const Fact = require('../models/Fact');
const HeroSlide = require('../models/HeroSlide');
const LlmUsageLog = require('../models/LlmUsageLog');
const User = require('../models/User');

/**
 * Admin Controller - settings management, persons, facts, and usage stats.
 */

// ============================================================
// Settings
// ============================================================

/**
 * GET /api/admin/settings - Get all settings
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.findAll();
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    res.json({ settings: settingsMap });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/settings - Update settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body.settings;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'settings object is required.',
      });
    }

    for (const [key, value] of Object.entries(updates)) {
      await Setting.upsert({
        key,
        value: String(value),
      });
    }

    // Return updated settings
    const settings = await Setting.findAll();
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    res.json({
      message: 'Settings updated successfully.',
      settings: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Persons
// ============================================================

/**
 * GET /api/admin/persons - List all persons
 */
const listPersons = async (req, res, next) => {
  try {
    const persons = await Person.findAll({
      include: [
        {
          model: Media,
          as: 'photo',
          attributes: ['id', 'filename', 'disk_filename', 'mime_type'],
        },
      ],
      order: [['sort_order', 'ASC']],
    });

    res.json({ persons });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/persons - Create a person
 */
const createPerson = async (req, res, next) => {
  try {
    const { name, title, photo_id, bio_en, bio_sw, bio_pok, sort_order, social_links } = req.body;

    if (!name || !title) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'name and title are required.',
      });
    }

    const person = await Person.create({
      name,
      title,
      photo_id: photo_id || null,
      bio_en: bio_en || null,
      bio_sw: bio_sw || null,
      bio_pok: bio_pok || null,
      sort_order: sort_order || 0,
      social_links: social_links || null,
    });

    const created = await Person.findByPk(person.id, {
      include: [
        { model: Media, as: 'photo', attributes: ['id', 'filename', 'disk_filename', 'mime_type'] },
      ],
    });

    res.status(201).json({ person: created });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/persons/:id - Update a person
 */
const updatePerson = async (req, res, next) => {
  try {
    const person = await Person.findByPk(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Not found', message: 'Person not found.' });
    }

    const { name, title, photo_id, bio_en, bio_sw, bio_pok, sort_order, social_links } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (title) updateFields.title = title;
    if (photo_id !== undefined) updateFields.photo_id = photo_id;
    if (bio_en !== undefined) updateFields.bio_en = bio_en;
    if (bio_sw !== undefined) updateFields.bio_sw = bio_sw;
    if (bio_pok !== undefined) updateFields.bio_pok = bio_pok;
    if (sort_order !== undefined) updateFields.sort_order = sort_order;
    if (social_links !== undefined) updateFields.social_links = social_links;

    await person.update(updateFields);

    const updated = await Person.findByPk(person.id, {
      include: [
        { model: Media, as: 'photo', attributes: ['id', 'filename', 'disk_filename', 'mime_type'] },
      ],
    });

    res.json({ person: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/persons/:id - Delete a person
 */
const deletePerson = async (req, res, next) => {
  try {
    const person = await Person.findByPk(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Not found', message: 'Person not found.' });
    }

    await person.destroy();
    res.json({ message: 'Person deleted successfully.', person: { id: person.id, name: person.name } });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Facts
// ============================================================

/**
 * GET /api/admin/facts - List all facts
 */
const listFacts = async (req, res, next) => {
  try {
    const facts = await Fact.findAll({ order: [['sort_order', 'ASC']] });
    res.json({ facts });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/facts - Create a fact
 */
const createFact = async (req, res, next) => {
  try {
    const { text_en, text_sw, text_pok, active, sort_order } = req.body;

    if (!text_en) {
      return res.status(400).json({ error: 'Validation error', message: 'text_en is required.' });
    }

    const fact = await Fact.create({
      text_en,
      text_sw: text_sw || null,
      text_pok: text_pok || null,
      active: active !== undefined ? active : true,
      sort_order: sort_order || 0,
    });

    res.status(201).json({ fact });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/facts/:id - Update a fact
 */
const updateFact = async (req, res, next) => {
  try {
    const fact = await Fact.findByPk(req.params.id);
    if (!fact) {
      return res.status(404).json({ error: 'Not found', message: 'Fact not found.' });
    }

    const { text_en, text_sw, text_pok, active, sort_order } = req.body;
    const updateFields = {};
    if (text_en) updateFields.text_en = text_en;
    if (text_sw !== undefined) updateFields.text_sw = text_sw;
    if (text_pok !== undefined) updateFields.text_pok = text_pok;
    if (active !== undefined) updateFields.active = active;
    if (sort_order !== undefined) updateFields.sort_order = sort_order;

    await fact.update(updateFields);
    res.json({ fact });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/facts/:id - Delete a fact
 */
const deleteFact = async (req, res, next) => {
  try {
    const fact = await Fact.findByPk(req.params.id);
    if (!fact) {
      return res.status(404).json({ error: 'Not found', message: 'Fact not found.' });
    }

    await fact.destroy();
    res.json({ message: 'Fact deleted successfully.', fact: { id: fact.id } });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LLM Usage Stats
// ============================================================

/**
 * GET /api/admin/llm-usage - Get LLM usage statistics
 */
const getLlmUsage = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await LlmUsageLog.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    // Calculate totals
    const totals = await LlmUsageLog.findAll({
      attributes: [
        [fn('SUM', col('input_tokens')), 'total_input_tokens'],
        [fn('SUM', col('output_tokens')), 'total_output_tokens'],
        [fn('SUM', col('cost_kes')), 'total_cost_kes'],
      ],
    });

    res.json({
      usage: rows,
      totals: totals[0] || { total_input_tokens: 0, total_output_tokens: 0, total_cost_kes: 0 },
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

// ============================================================
// Hero Slides
// ============================================================

/**
 * GET /api/admin/hero-slides - List all hero slides
 */
const listHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.findAll({
      include: [
        {
          model: Media,
          as: 'image',
          attributes: ['id', 'filename', 'disk_filename', 'mime_type'],
        },
      ],
      order: [['sort_order', 'ASC']],
    });

    res.json({ slides });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/hero-slides - Create a hero slide
 */
const createHeroSlide = async (req, res, next) => {
  try {
    const { image_id, link_url, sort_order, active } = req.body;

    if (!image_id) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'image_id is required.',
      });
    }

    const slide = await HeroSlide.create({
      image_id,
      link_url: link_url || null,
      sort_order: sort_order || 0,
      active: active !== undefined ? active : true,
    });

    const created = await HeroSlide.findByPk(slide.id, {
      include: [
        { model: Media, as: 'image', attributes: ['id', 'filename', 'disk_filename', 'mime_type'] },
      ],
    });

    res.status(201).json({ slide: created });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/hero-slides/:id - Update a hero slide
 */
const updateHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: 'Not found', message: 'Hero slide not found.' });
    }

    const { image_id, link_url, sort_order, active } = req.body;
    const updateFields = {};
    if (image_id) updateFields.image_id = image_id;
    if (link_url !== undefined) updateFields.link_url = link_url;
    if (sort_order !== undefined) updateFields.sort_order = sort_order;
    if (active !== undefined) updateFields.active = active;

    await slide.update(updateFields);

    const updated = await HeroSlide.findByPk(slide.id, {
      include: [
        { model: Media, as: 'image', attributes: ['id', 'filename', 'disk_filename', 'mime_type'] },
      ],
    });

    res.json({ slide: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/hero-slides/:id - Delete a hero slide
 */
const deleteHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: 'Not found', message: 'Hero slide not found.' });
    }

    await slide.destroy();
    res.json({ message: 'Hero slide deleted successfully.', slide: { id: slide.id } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  listPersons,
  createPerson,
  updatePerson,
  deletePerson,
  listFacts,
  createFact,
  updateFact,
  deleteFact,
  listHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getLlmUsage,
};
