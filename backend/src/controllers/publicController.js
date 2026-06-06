const { Op } = require('sequelize');
const {
  Content,
  ContentTranslation,
  ContentMeta,
  Media,
  Taxonomy,
  Department,
  Person,
  Fact,
  HeroSlide,
  ContactMessage,
  NewsletterSubscriber,
  Menu,
  MenuItem,
} = require('../models');

/**
 * Public Controller - serves published content to the public website.
 * No authentication required for these endpoints.
 */

/**
 * Build visibility WHERE clause for public endpoints.
 * Business rules:
 * 1. Only published content is eligible (caller must add status: 'published')
 * 2. manually_hidden = true → excluded (overrides everything)
 * 3. visibility = 'public' → included
 * 4. visibility = 'private' → excluded
 * 5. visibility = 'scheduled' → included only if now is between visible_from and visible_to
 */
const visibilityWhere = () => {
  const now = new Date();
  return {
    manually_hidden: { [Op.ne]: true },
    [Op.or]: [
      { visibility: 'public' },
      {
        visibility: 'scheduled',
        visible_from: { [Op.lte]: now },
        visible_to: { [Op.gte]: now },
      },
    ],
  };
};

/**
 * GET /api/public/content - List published content
 * Supports ?type=news&limit=10&page=1&locale=en
 */
const getPublicContent = async (req, res, next) => {
  try {
    const { type, limit = 20, page = 1, locale = 'en' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'published', ...visibilityWhere() };

    if (type) where.type = type;

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          where: { locale },
          required: false,
          include: [
            {
              model: Media,
              as: 'featuredImage',
            },
          ],
        },
        {
          model: ContentMeta,
          as: 'meta',
        },
        {
          model: Taxonomy,
          as: 'taxonomies',
          through: { attributes: [] },
          required: false,
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['published_at', 'DESC']],
      distinct: true,
    });

    res.json({
      content: rows,
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
 * GET /api/public/content/:slug - Get single published content by slug
 */
const getPublicContentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { locale = 'en' } = req.query;

    const content = await Content.findOne({
      where: { slug, status: 'published', ...visibilityWhere() },
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          include: [
            {
              model: Media,
              as: 'featuredImage',
            },
          ],
        },
        {
          model: ContentMeta,
          as: 'meta',
        },
        {
          model: Media,
          as: 'media',
          through: { attributes: ['sort_order'] },
        },
        {
          model: Taxonomy,
          as: 'taxonomies',
          through: { attributes: [] },
        },
      ],
    });

    if (!content) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content not found or not published.',
      });
    }

    res.json({ content });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/public/events - List published events
 * Supports ?upcoming=true&limit=6&locale=en
 */
const getPublicEvents = async (req, res, next) => {
  try {
    const { upcoming, limit = 20, page = 1, locale = 'en' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { type: 'event', status: 'published', ...visibilityWhere() };

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          where: { locale },
          required: false,
          include: [
            { model: Media, as: 'featuredImage' },
          ],
        },
        {
          model: ContentMeta,
          as: 'meta',
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['published_at', 'DESC']],
      distinct: true,
    });

    // Filter upcoming events (start_date >= today) if requested
    let events = rows;
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      events = rows.filter((event) => {
        const startMeta = event.meta?.find((m) => m.meta_key === 'start_date');
        return startMeta && new Date(startMeta.meta_value) >= today;
      });
    }

    res.json({
      events,
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
 * GET /api/public/tenders - List published open tenders
 * Only returns tenders where closing_date >= today
 */
const getPublicTenders = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, locale = 'en' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { type: 'tender', status: 'published', ...visibilityWhere() };

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          where: { locale },
          required: false,
        },
        {
          model: ContentMeta,
          as: 'meta',
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['published_at', 'DESC']],
      distinct: true,
    });

    // Filter open tenders (closing_date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const openTenders = rows.filter((tender) => {
      const closingMeta = tender.meta?.find((m) => m.meta_key === 'closing_date');
      return closingMeta && new Date(closingMeta.meta_value) >= today;
    });

    res.json({
      tenders: openTenders,
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
 * GET /api/public/vacancies - List published open vacancies
 */
const getPublicVacancies = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, locale = 'en' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { type: 'vacancy', status: 'published', ...visibilityWhere() };

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          where: { locale },
          required: false,
        },
        {
          model: ContentMeta,
          as: 'meta',
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['published_at', 'DESC']],
      distinct: true,
    });

    // Filter open vacancies (closing_date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const openVacancies = rows.filter((vacancy) => {
      const closingMeta = vacancy.meta?.find((m) => m.meta_key === 'closing_date');
      return closingMeta && new Date(closingMeta.meta_value) >= today;
    });

    res.json({
      vacancies: openVacancies,
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
 * GET /api/public/departments - List published departments
 */
const getPublicDepartments = async (req, res, next) => {
  try {
    const { locale = 'en' } = req.query;

    const departments = await Content.findAll({
      where: { type: 'department', status: 'published', ...visibilityWhere() },
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
          where: { locale },
          required: false,
        },
        {
          model: ContentMeta,
          as: 'meta',
        },
      ],
      order: [
        [{ model: ContentMeta, as: 'meta' }, 'meta_value', 'ASC'],
      ],
    });

    res.json({ departments });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/public/categories - List public categories
 */
const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Taxonomy.findAll({
      where: { type: 'category' },
      include: [
        {
          model: Taxonomy,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/public/facts - List active facts
 */
const getPublicFacts = async (req, res, next) => {
  try {
    const facts = await Fact.findAll({
      where: { active: true },
      order: [['sort_order', 'ASC']],
    });

    res.json({ facts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/public/persons - List persons (county leadership)
 * Supports ?title=governor to filter by title
 */
const getPublicPersons = async (req, res, next) => {
  try {
    const { title } = req.query;
    const where = {};

    if (title) {
      where.title = title;
    }

    const persons = await Person.findAll({
      where,
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
 * GET /api/public/hero-slides - List active hero slides
 */
const getPublicHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.findAll({
      where: { active: true },
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
 * POST /api/public/contact - Submit a contact form message
 */
const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, email, and message are required.',
      });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject: subject || 'General Inquiry',
      message,
    });

    res.status(201).json({
      message: 'Contact message submitted successfully.',
      contactMessage: {
        id: contactMessage.id,
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        created_at: contactMessage.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/public/subscribe - Subscribe to newsletter
 */
const subscribeEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email is required.',
      });
    }

    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({ where: { email } });

    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({
          error: 'Already subscribed',
          message: 'This email is already subscribed to our newsletter.',
        });
      }

      // Re-activate if previously unsubscribed
      await existing.update({
        is_active: true,
        subscribed_at: new Date(),
        unsubscribed_at: null,
      });

      return res.json({
        message: 'Subscription re-activated successfully.',
        subscriber: { id: existing.id, email: existing.email },
      });
    }

    const subscriber = await NewsletterSubscriber.create({ email });

    res.status(201).json({
      message: 'Successfully subscribed to newsletter.',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        subscribed_at: subscriber.subscribed_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUBLIC MENU ENDPOINT
// ============================================================

/**
 * Helper: build nested menu tree from flat list of MenuItems.
 */
function buildMenuTree(items, locale = 'en') {
  const map = {};
  const roots = [];

  items.forEach((item) => {
    const title =
      typeof item.title === 'object' && item.title !== null
        ? item.title[locale] || item.title.en || ''
        : item.title || '';
    map[item.id] = {
      id: item.id,
      parent_id: item.parent_id,
      title,
      type: item.type,
      target_id: item.target_id,
      target_slug: item.target_slug || null,
      url: item.url,
      sort_order: item.sort_order,
      is_active: item.is_active,
      children: [],
    };
  });

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

    // Resolve slugs for page and category targets
    const rawItems = menu.items || [];
    const pageIds = rawItems.filter((i) => i.type === 'page' && i.target_id).map((i) => i.target_id);
    const categoryIds = rawItems.filter((i) => i.type === 'category' && i.target_id).map((i) => i.target_id);

    let pageSlugMap = {};
    let categorySlugMap = {};

    if (pageIds.length > 0) {
      const pages = await Content.findAll({
        where: { id: pageIds },
        attributes: ['id', 'slug'],
      });
      pages.forEach((p) => { pageSlugMap[p.id] = p.slug; });
    }

    if (categoryIds.length > 0) {
      const categories = await Taxonomy.findAll({
        where: { id: categoryIds },
        attributes: ['id', 'slug'],
      });
      categories.forEach((c) => { categorySlugMap[c.id] = c.slug; });
    }

    // Attach target_slug to each item
    const itemsWithSlugs = rawItems.map((item) => {
      const itemData = item.toJSON ? item.toJSON() : { ...item };
      if (itemData.type === 'page' && pageSlugMap[itemData.target_id]) {
        itemData.target_slug = pageSlugMap[itemData.target_id];
      } else if (itemData.type === 'category' && categorySlugMap[itemData.target_id]) {
        itemData.target_slug = categorySlugMap[itemData.target_id];
      }
      return itemData;
    });

    // Build nested tree
    const items = buildMenuTree(itemsWithSlugs, locale);

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

module.exports = {
  getPublicContent,
  getPublicContentBySlug,
  getPublicEvents,
  getPublicTenders,
  getPublicVacancies,
  getPublicDepartments,
  getPublicCategories,
  getPublicFacts,
  getPublicPersons,
  getPublicHeroSlides,
  submitContact,
  subscribeEmail,
  getPublicMenus,
};
