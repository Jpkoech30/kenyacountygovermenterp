/**
 * Global error handling middleware.
 * Catches all errors thrown in route handlers and returns
 * consistent JSON error responses.
 *
 * Enhanced with:
 * - JSON parsing error handling
 * - Payload too large handling
 * - Network/connection error handling
 * - Fallback for unexpected error shapes
 */
const errorHandler = (err, req, res, next) => {
  // Log full error details for debugging
  console.error('Error:', err.name || 'Error');
  console.error('Message:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // -----------------------------------------------------------------------
  // JSON parse errors (malformed request body)
  // -----------------------------------------------------------------------
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON. Please check your input.',
    });
  }

  // -----------------------------------------------------------------------
  // Payload too large
  // -----------------------------------------------------------------------
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request body exceeds the maximum allowed size (10MB).',
    });
  }

  // -----------------------------------------------------------------------
  // Sequelize validation errors
  // -----------------------------------------------------------------------
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      error: 'Validation error',
      message: messages.join(', '),
    });
  }

  // -----------------------------------------------------------------------
  // Sequelize unique constraint errors
  // -----------------------------------------------------------------------
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => `${e.path} must be unique`);
    return res.status(409).json({
      error: 'Duplicate entry',
      message: messages.join(', '),
    });
  }

  // -----------------------------------------------------------------------
  // Sequelize foreign key constraint errors
  // -----------------------------------------------------------------------
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist.',
    });
  }

  // -----------------------------------------------------------------------
  // Sequelize connection errors (database unavailable)
  // -----------------------------------------------------------------------
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'The database is currently unavailable. Please try again later.',
    });
  }

  // -----------------------------------------------------------------------
  // Sequelize timeout errors
  // -----------------------------------------------------------------------
  if (err.name === 'SequelizeConnectionAcquireTimeoutError' || err.name === 'SequelizeTimeoutError') {
    return res.status(503).json({
      error: 'Database timeout',
      message: 'The database request timed out. Please try again.',
    });
  }

  // -----------------------------------------------------------------------
  // Network / Axios errors (external API failures)
  // -----------------------------------------------------------------------
  if (err.name === 'AxiosError') {
    const statusCode = err.response?.status || 502;
    const externalMessage = err.response?.data?.error?.message
      || err.response?.data?.message
      || err.message
      || 'External service error';

    return res.status(statusCode >= 500 ? 502 : statusCode).json({
      error: 'External service error',
      message: externalMessage,
    });
  }

  // -----------------------------------------------------------------------
  // Default server error
  // -----------------------------------------------------------------------
  const statusCode = err.status || err.statusCode || 500;
  const errorName = err.name || 'Internal server error';
  const errorMessage = err.message || 'An unexpected error occurred.';

  // In production, don't leak internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }

  res.status(statusCode).json({
    error: errorName,
    message: errorMessage,
  });
};

module.exports = errorHandler;
