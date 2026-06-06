const { Op } = require('sequelize');
const {
  Content,
  ContentTranslation,
  ContentMeta,
  ContentWorkflowLog,
  ContentVersion,
  ContentMedia,
  ContentTaxonomy,
  Media,
  Taxonomy,
  User,
  LlmUsageLog,
} = require('../models');
const llmService = require('../services/llmService');

/**
 * Content Controller - handles CRUD operations and workflow actions
 * for the CMS content management system.
 */

// ============================================================
// Helper: Default includes for content queries
// ============================================================
const defaultIncludes = [
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
    model: User,
    as: 'author',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  {
    model: User,
    as: 'reviewer',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  {
    model: User,
    as: 'publisher',
    attributes: ['id', 'first_name', 'last_name', 'email'],
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
];

/**
 * Lean includes for list views — skips heavy JOINs and columns not needed in tables.
 * - Excludes translation body (large HTML), meta, media, taxonomies, reviewer/publisher
 * - Only includes author name + translation title/excerpt + featured image thumbnail
 */
const listIncludes = [
  {
    model: ContentTranslation,
    as: 'translations',
    attributes: ['id', 'locale', 'title', 'excerpt', 'featured_image_id', 'meta_description', 'meta_keywords'],
    include: [
      {
        model: Media,
        as: 'featuredImage',
        attributes: ['id', 'filename', 'disk_filename', 'mime_type', 'alt_text'],
      },
    ],
  },
  {
    model: User,
    as: 'author',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
];

// ============================================================
// Helper: Create a version snapshot
// ============================================================
const createVersionSnapshot = async (contentId, userId) => {
  // Fetch current state with translations and meta
  const content = await Content.findByPk(contentId, {
    include: [
      { model: ContentTranslation, as: 'translations' },
      { model: ContentMeta, as: 'meta' },
    ],
  });

  if (!content) return;

  // Get the latest version number
  const latestVersion = await ContentVersion.findOne({
    where: { content_id: contentId },
    order: [['version_number', 'DESC']],
  });

  const versionNumber = (latestVersion?.version_number || 0) + 1;

  // Create snapshot
  await ContentVersion.create({
    content_id: contentId,
    version_number: versionNumber,
    data: {
      type: content.type,
      slug: content.slug,
      status: content.status,
      translations: content.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        body: t.body,
        excerpt: t.excerpt,
        meta_description: t.meta_description,
        meta_keywords: t.meta_keywords,
      })),
      meta: content.meta.map((m) => ({
        meta_key: m.meta_key,
        meta_value: m.meta_value,
      })),
    },
    created_by: userId,
  });

  // Prune old versions (keep last 10)
  const versions = await ContentVersion.findAll({
    where: { content_id: contentId },
    order: [['version_number', 'DESC']],
    offset: 10,
  });

  for (const oldVersion of versions) {
    await oldVersion.destroy();
  }
};

// ============================================================
// Helper: Log workflow action
// ============================================================
const logWorkflow = async (contentId, fromStatus, toStatus, userId, comment = null) => {
  await ContentWorkflowLog.create({
    content_id: contentId,
    from_status: fromStatus,
    to_status: toStatus,
    user_id: userId,
    comment,
  });
};

// ============================================================
// CRUD Operations
// ============================================================

/**
 * GET /api/content - List all content with filtering and pagination
 */
const getContentList = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      search,
      author_id,
      visibility,
      sort_by = 'createdAt',
      sort_order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (author_id) where.author_id = author_id;
    if (visibility) where.visibility = visibility;

    // Search across translations
    if (search) {
      const translationIds = await ContentTranslation.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { body: { [Op.like]: `%${search}%` } },
          ],
        },
        attributes: ['content_id'],
      });
      where.id = {
        [Op.in]: [...new Set(translationIds.map((t) => t.content_id))],
      };
    }

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: listIncludes,
      offset,
      limit: parseInt(limit),
      order: [[sort_by, sort_order]],
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
 * POST /api/content - Create new content with translations
 */
const createContent = async (req, res, next) => {
  try {
    const { type, slug, translations, meta, taxonomy_ids, media_ids, visibility, visible_from, visible_to, manually_hidden } = req.body;

    // Validate required fields
    if (!slug || !translations || !translations.length) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'slug and at least one translation are required.',
      });
    }

    // Check slug uniqueness within type
    const existing = await Content.findOne({ where: { type, slug } });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: `A ${type} with slug "${slug}" already exists.`,
      });
    }

    // Create content
    const content = await Content.create({
      type: type || 'page',
      slug,
      status: 'draft',
      author_id: req.user.id,
      visibility: visibility || 'public',
      visible_from: visible_from || null,
      visible_to: visible_to || null,
      manually_hidden: manually_hidden || false,
    });

    // Create translations
    for (const t of translations) {
      await ContentTranslation.create({
        content_id: content.id,
        locale: t.locale,
        title: t.title,
        body: t.body || null,
        excerpt: t.excerpt || null,
        featured_image_id: t.featured_image_id || null,
        meta_description: t.meta_description || null,
        meta_keywords: t.meta_keywords || null,
      });
    }

    // Create meta
    if (meta && meta.length) {
      for (const m of meta) {
        await ContentMeta.create({
          content_id: content.id,
          meta_key: m.meta_key,
          meta_value: m.meta_value,
        });
      }
    }

    // Attach taxonomies
    if (taxonomy_ids && taxonomy_ids.length) {
      const taxonomies = await Taxonomy.findAll({
        where: { id: { [Op.in]: taxonomy_ids } },
      });
      await content.setTaxonomies(taxonomies);
    }

    // Attach media
    if (media_ids && media_ids.length) {
      const mediaItems = await Media.findAll({
        where: { id: { [Op.in]: media_ids } },
      });
      await content.setMedia(mediaItems);
    }

    // Log initial workflow entry
    await logWorkflow(content.id, null, 'draft', req.user.id, 'Content created.');

    // Create initial version snapshot
    await createVersionSnapshot(content.id, req.user.id);

    // Fetch and return the full content
    const createdContent = await Content.findByPk(content.id, {
      include: defaultIncludes,
    });

    res.status(201).json({ content: createdContent });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/content/:id - Get single content with all relations
 */
const getContentById = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id, {
      include: defaultIncludes,
    });

    if (!content) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content not found.',
      });
    }

    res.json({ content });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/content/:id - Update content
 */
const updateContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content not found.',
      });
    }

    const { type, slug, translations, meta, taxonomy_ids, media_ids, visibility, visible_from, visible_to, manually_hidden } = req.body;

    // Create version snapshot before updating
    await createVersionSnapshot(content.id, req.user.id);

    // Update content fields
    const updateFields = {};
    if (type) updateFields.type = type;
    if (slug) updateFields.slug = slug;
    if (visibility !== undefined) updateFields.visibility = visibility;
    if (visible_from !== undefined) updateFields.visible_from = visible_from;
    if (visible_to !== undefined) updateFields.visible_to = visible_to;
    if (manually_hidden !== undefined) updateFields.manually_hidden = manually_hidden;
    if (Object.keys(updateFields).length > 0) {
      await content.update(updateFields);
    }

    // Update translations
    if (translations && translations.length) {
      for (const t of translations) {
        const existingTranslation = await ContentTranslation.findOne({
          where: { content_id: content.id, locale: t.locale },
        });

        if (existingTranslation) {
          await existingTranslation.update({
            title: t.title,
            body: t.body || null,
            excerpt: t.excerpt || null,
            featured_image_id: t.featured_image_id || null,
            meta_description: t.meta_description || null,
            meta_keywords: t.meta_keywords || null,
          });
        } else {
          await ContentTranslation.create({
            content_id: content.id,
            locale: t.locale,
            title: t.title,
            body: t.body || null,
            excerpt: t.excerpt || null,
            featured_image_id: t.featured_image_id || null,
            meta_description: t.meta_description || null,
            meta_keywords: t.meta_keywords || null,
          });
        }
      }
    }

    // Update meta (replace all)
    if (meta) {
      await ContentMeta.destroy({ where: { content_id: content.id } });
      for (const m of meta) {
        await ContentMeta.create({
          content_id: content.id,
          meta_key: m.meta_key,
          meta_value: m.meta_value,
        });
      }
    }

    // Update taxonomies
    if (taxonomy_ids) {
      const taxonomies = await Taxonomy.findAll({
        where: { id: { [Op.in]: taxonomy_ids } },
      });
      await content.setTaxonomies(taxonomies);
    }

    // Update media
    if (media_ids) {
      const mediaItems = await Media.findAll({
        where: { id: { [Op.in]: media_ids } },
      });
      await content.setMedia(mediaItems);
    }

    // Fetch and return updated content
    const updatedContent = await Content.findByPk(content.id, {
      include: defaultIncludes,
    });

    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/content/:id - Soft delete content
 */
const deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Content not found.',
      });
    }

    await content.destroy(); // Soft delete (paranoid)

    res.json({
      message: 'Content deleted successfully.',
      content: { id: content.id },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Workflow Actions
// ============================================================

/**
 * POST /api/content/:id/submit - Submit for review (draft -> pending_review)
 */
const submitContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (content.status !== 'draft') {
      return res.status(400).json({ error: 'Invalid status', message: 'Only draft content can be submitted for review.' });
    }

    await content.update({ status: 'pending_review' });
    await logWorkflow(content.id, 'draft', 'pending_review', req.user.id, req.body.comment);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/approve - Approve content (pending_review -> approved)
 */
const approveContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (content.status !== 'pending_review') {
      return res.status(400).json({ error: 'Invalid status', message: 'Only content pending review can be approved.' });
    }

    await content.update({
      status: 'approved',
      reviewer_id: req.user.id,
    });
    await logWorkflow(content.id, 'pending_review', 'approved', req.user.id, req.body.comment);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/reject - Reject content (pending_review -> draft)
 */
const rejectContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (content.status !== 'pending_review') {
      return res.status(400).json({ error: 'Invalid status', message: 'Only content pending review can be rejected.' });
    }
    if (!req.body.comment) {
      return res.status(400).json({ error: 'Validation error', message: 'A rejection comment is required.' });
    }

    await content.update({ status: 'draft' });
    await logWorkflow(content.id, 'pending_review', 'draft', req.user.id, req.body.comment);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/publish - Publish immediately (approved -> published)
 */
const publishContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (content.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid status', message: 'Only approved content can be published.' });
    }

    await content.update({
      status: 'published',
      publisher_id: req.user.id,
      published_at: new Date(),
      visibility: 'public',
    });
    await logWorkflow(content.id, 'approved', 'published', req.user.id, req.body.comment);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/schedule - Schedule content for publishing
 */
const scheduleContent = async (req, res, next) => {
  try {
    const { scheduled_at } = req.body;
    if (!scheduled_at) {
      return res.status(400).json({ error: 'Validation error', message: 'scheduled_at date is required.' });
    }

    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (content.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid status', message: 'Only approved content can be scheduled.' });
    }

    await content.update({
      status: 'scheduled',
      publisher_id: req.user.id,
      published_at: new Date(scheduled_at),
    });
    await logWorkflow(content.id, 'approved', 'scheduled', req.user.id, `Scheduled for ${scheduled_at}`);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/unschedule - Unschedule content (scheduled -> approved)
 */
const unscheduleContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (content.status !== 'scheduled') {
      return res.status(400).json({ error: 'Invalid status', message: 'Only scheduled content can be unscheduled.' });
    }

    await content.update({
      status: 'approved',
      published_at: null,
    });
    await logWorkflow(content.id, 'scheduled', 'approved', req.user.id, req.body.comment);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/archive - Archive content
 */
const archiveContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }
    if (!['published', 'scheduled'].includes(content.status)) {
      return res.status(400).json({ error: 'Invalid status', message: 'Only published or scheduled content can be archived.' });
    }

    await content.update({ status: 'archived' });
    await logWorkflow(content.id, content.status, 'archived', req.user.id, req.body.comment);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Version Management
// ============================================================

/**
 * GET /api/content/:id/versions - List all versions for content
 */
const getContentVersions = async (req, res, next) => {
  try {
    const versions = await ContentVersion.findAll({
      where: { content_id: req.params.id },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['version_number', 'DESC']],
    });

    res.json({ versions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/:id/restore/:versionId - Restore a previous version
 */
const restoreContentVersion = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }

    const version = await ContentVersion.findOne({
      where: { id: req.params.versionId, content_id: req.params.id },
    });
    if (!version) {
      return res.status(404).json({ error: 'Not found', message: 'Version not found.' });
    }

    // Create current snapshot before restoring
    await createVersionSnapshot(content.id, req.user.id);

    const data = version.data;

    // Restore translations
    if (data.translations) {
      for (const t of data.translations) {
        const existingTranslation = await ContentTranslation.findOne({
          where: { content_id: content.id, locale: t.locale },
        });
        if (existingTranslation) {
          await existingTranslation.update(t);
        } else {
          await ContentTranslation.create({ ...t, content_id: content.id });
        }
      }
    }

    // Restore meta
    if (data.meta) {
      await ContentMeta.destroy({ where: { content_id: content.id } });
      for (const m of data.meta) {
        await ContentMeta.create({ ...m, content_id: content.id });
      }
    }

    // Restore type and slug
    if (data.type) await content.update({ type: data.type });
    if (data.slug) await content.update({ slug: data.slug });

    await logWorkflow(content.id, content.status, content.status, req.user.id, `Restored to version ${version.version_number}`);

    const updatedContent = await Content.findByPk(content.id, { include: defaultIncludes });
    res.json({ content: updatedContent, message: `Restored to version ${version.version_number}.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// AI Summarisation
// ============================================================

/**
 * POST /api/content/:id/summarize - Generate AI summary for content
 */
const summarizeContent = async (req, res, next) => {
  try {
    const { locale = 'en' } = req.body;

    const content = await Content.findByPk(req.params.id, {
      include: [
        {
          model: ContentTranslation,
          as: 'translations',
        },
      ],
    });

    if (!content) {
      return res.status(404).json({ error: 'Not found', message: 'Content not found.' });
    }

    // Find the translation for the requested locale, fallback to first available
    let translation = content.translations.find((t) => t.locale === locale);
    if (!translation) {
      translation = content.translations[0];
    }

    if (!translation || !translation.body) {
      return res.status(400).json({
        error: 'No content',
        message: `No body content found for locale "${locale}".`,
      });
    }

    // Strip HTML tags for summarisation
    const plainText = translation.body.replace(/<[^>]*>/g, '');

    try {
      const result = await llmService.summarize(plainText, locale);

      // Log usage
      await LlmUsageLog.create({
        user_id: req.user.id,
        content_id: content.id,
        locale,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        cost_kes: result.costKes,
      });

      res.json({
        summary: result.summary,
        usage: {
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          cost_kes: result.costKes,
        },
      });
    } catch (llmError) {
      return res.status(502).json({
        error: 'AI service error',
        message: llmError.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/bulk/hide - Bulk hide published content
 * Sets manually_hidden = true for selected content IDs
 */
const bulkHideContent = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'An array of content IDs is required.',
      });
    }

    const [affectedCount] = await Content.update(
      { manually_hidden: true },
      {
        where: {
          id: { [Op.in]: ids },
          status: 'published',
        },
      }
    );

    res.json({
      message: `${affectedCount} content item(s) hidden.`,
      affected: affectedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/content/bulk/show - Bulk show hidden content
 * Sets manually_hidden = false for selected content IDs
 */
const bulkShowContent = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'An array of content IDs is required.',
      });
    }

    const [affectedCount] = await Content.update(
      { manually_hidden: false },
      {
        where: {
          id: { [Op.in]: ids },
          status: 'published',
        },
      }
    );

    res.json({
      message: `${affectedCount} content item(s) shown.`,
      affected: affectedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContentList,
  createContent,
  getContentById,
  updateContent,
  deleteContent,
  submitContent,
  approveContent,
  rejectContent,
  publishContent,
  scheduleContent,
  unscheduleContent,
  archiveContent,
  getContentVersions,
  restoreContentVersion,
  summarizeContent,
  bulkHideContent,
  bulkShowContent,
};
