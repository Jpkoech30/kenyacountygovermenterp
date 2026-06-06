/**
 * Authorization middleware factory.
 * Returns middleware that checks if the authenticated user's role
 * matches one of the allowed role names.
 *
 * @param  {...string} allowedRoles - One or more role names permitted to access the route
 * @returns {Function} Express middleware
 *
 * @example
 * // Only admin can access
 * router.get('/users', authenticate, authorize('admin'), handler);
 *
 * @example
 * // Multiple roles
 * router.get('/reports', authenticate, authorize('admin', 'hr_officer'), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure authenticate middleware has run first
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before authorization check.',
      });
    }

    const userRole = req.user.role.name;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
