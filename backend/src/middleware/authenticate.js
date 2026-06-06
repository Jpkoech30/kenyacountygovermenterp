const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header (Bearer token).
 * Attaches the full user object (with role) to req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided. Please include a Bearer token in the Authorization header.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user with role (exclude password_hash via default scope)
    const user = await User.findByPk(decoded.id, {
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
        message: 'User not found.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid authentication token.',
      });
    }
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication.',
    });
  }
};

module.exports = authenticate;
