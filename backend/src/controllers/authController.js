const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

/**
 * Authentication Controller
 * Handles login, registration, and current user retrieval.
 */

/**
 * POST /api/auth/login
 * Authenticates a user with email and password.
 * Returns a JWT token and user data (without password).
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required.',
      });
    }

    // Find user by email (include password_hash via scope)
    const user = await User.scope('withPassword').findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password.',
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password.',
      });
    }

    // Update last_login timestamp
    await user.update({ last_login: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Return user data (password_hash excluded by default scope)
    const userData = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
      ],
    });

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Creates a new user (admin only).
 * Sends a welcome email with password reset link.
 */
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, department_id, role_id } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role_id) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, first name, last name, and role are required.',
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

    // Create user (password will be hashed by the model hook)
    const user = await User.create({
      email,
      password_hash: password, // The model hook will hash this
      first_name,
      last_name,
      department_id: department_id || null,
      role_id,
    });

    // Generate a password reset token for welcome email
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send welcome email (non-blocking - don't await to avoid delaying response)
    const { sendWelcomeEmail } = require('../services/emailService');
    sendWelcomeEmail(user, resetToken).catch((err) => {
      console.error('Background email send failed:', err.message);
    });

    // Return created user (without password)
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
        },
      ],
    });

    res.status(201).json(createdUser);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by authenticate middleware
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions'],
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
 * POST /api/auth/reset-password
 * Resets a user's password using a valid reset token.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Token and new password are required.',
      });
    }

    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Invalid password reset token.',
      });
    }

    // Find user
    const user = await User.scope('withPassword').findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found.',
      });
    }

    // Update password (will be hashed by model hook)
    await user.update({ password_hash: password });

    res.json({
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Token expired',
        message: 'The reset link has expired. Please request a new one.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Invalid password reset token.',
      });
    }
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  resetPassword,
};
