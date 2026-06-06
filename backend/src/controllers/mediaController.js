const { Op } = require('sequelize');
const Media = require('../models/Media');
const User = require('../models/User');
const mediaService = require('../services/mediaService');

/**
 * Media Controller - handles file upload, listing, and deletion.
 */

/**
 * POST /api/media/upload - Upload one or more files
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'At least one file is required.',
      });
    }

    const uploadedMedia = [];

    for (const file of req.files) {
      const fileInfo = await mediaService.saveFile(file);

      const media = await Media.create({
        filename: fileInfo.original_filename,
        disk_filename: fileInfo.disk_filename,
        mime_type: fileInfo.mime_type,
        size: fileInfo.size,
        uploaded_by: req.user.id,
      });

      uploadedMedia.push({
        ...media.toJSON(),
        url: mediaService.getFileUrl(fileInfo.storage_path),
      });
    }

    res.status(201).json({
      message: `${uploadedMedia.length} file(s) uploaded successfully.`,
      media: uploadedMedia,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/media - List media with pagination and filtering
 */
const listMedia = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 30,
      mime_type,
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (mime_type) {
      where.mime_type = { [Op.like]: `${mime_type}%` };
    }
    if (search) {
      where.filename = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Media.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [[sort_by, sort_order]],
    });

    res.json({
      media: rows,
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
 * DELETE /api/media/:id - Delete a media file
 */
const deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Media not found.',
      });
    }

    // Delete file from disk
    await mediaService.deleteFile(media.disk_filename);

    // Delete database record
    await media.destroy();

    res.json({
      message: 'Media deleted successfully.',
      media: { id: media.id, filename: media.filename },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/media/:id - Update a media record (e.g., alt_text)
 */
const updateMedia = async (req, res, next) => {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Media not found.',
      });
    }

    const { alt_text } = req.body;
    if (alt_text !== undefined) {
      media.alt_text = alt_text;
    }

    await media.save();

    res.json({
      message: 'Media updated successfully.',
      media,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  listMedia,
  deleteMedia,
  updateMedia,
};
