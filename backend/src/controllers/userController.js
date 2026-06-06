const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { User, Role, Department } = require('../models');
const { sendWelcomeEmail } = require('../services/emailService');

/**
 * User Management Controller
 * All routes require admin role (enforced by router middleware).
 */

/**
 * GET /api/users
 * Paginated list of users with optional filters.
 * Query params: page, limit, role, department, is_active, search
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = {};

    if (req.query.role) {
      where.role_id = req.query.role;
    }

    if (req.query.department) {
      where.department_id = req.query.department;
    }

    if (req.query.is_active !== undefined) {
      where.is_active = req.query.is_active === 'true';
    }

    // Search by name or email
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: searchTerm } },
        { last_name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Create a new user. Sends welcome email with password reset link.
 */
const createUser = async (req, res, next) => {
  try {
    const { email, first_name, last_name, department_id, role_id, send_email } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name || !role_id) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, first name, last name, and role are required.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A user with this email already exists.',
      });
    }

    // Generate a temporary random password
    const tempPassword = require('crypto').randomBytes(16).toString('hex');

    // Create user
    const user = await User.create({
      email,
      password_hash: tempPassword,
      first_name,
      last_name,
      department_id: department_id || null,
      role_id,
    });

    // Send welcome email if requested (default: true)
    if (send_email !== false) {
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, purpose: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      sendWelcomeEmail(user, resetToken).catch((err) => {
        console.error('Background email send failed:', err.message);
      });
    }

    // Return created user
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    res.status(201).json(createdUser);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found.',
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Update a user's details.
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found.',
      });
    }

    const { email, first_name, last_name, department_id, role_id, is_active, allow_ai_assist } = req.body;

    // Build update payload (only include provided fields)
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (department_id !== undefined) updateData.department_id = department_id;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (allow_ai_assist !== undefined) updateData.allow_ai_assist = allow_ai_assist;

    await user.update(updateData);

    // Return updated user
    const updatedUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Soft delete a user (set is_active = false).
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found.',
      });
    }

    // Soft delete - deactivate the user
    await user.update({ is_active: false });

    res.json({
      message: 'User deactivated successfully.',
      user: {
        id: user.id,
        email: user.email,
        is_active: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/me/guide
 * Update the current user's guide preferences.
 * Merges provided fields into the existing guide_seen JSON.
 */
const updateMyGuide = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found.',
      });
    }

    const { guide_enabled, guide_seen_partial } = req.body;

    const updateData = {};

    if (guide_enabled !== undefined) {
      updateData.guide_enabled = guide_enabled;
    }

    if (guide_seen_partial) {
      // Merge partial guide_seen into existing
      const currentGuideSeen = user.guide_seen || {};
      updateData.guide_seen = { ...currentGuideSeen, ...guide_seen_partial };
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
      ],
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/reset-guide
 * Admin-only: Reset a user's guide_seen to empty object.
 */
const resetGuide = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found.',
      });
    }

    await user.update({ guide_seen: {} });

    res.json({
      message: 'Guide progress reset successfully.',
      user: {
        id: user.id,
        email: user.email,
        guide_seen: {},
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateMyGuide,
  resetGuide,
};
