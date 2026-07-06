/**
 * Global error handling middleware.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  const logger = require('../utils/logger');
  logger.error(err);

  let statusCode = 500;
  let message = 'internal server error';
  let errors = null;

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = err.message || 'validation failed';
  } else if (err.name === 'AuthError') {
    statusCode = 401;
    message = err.message || 'unauthorized';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message || 'not found';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message || message;
  }

  if (res.headersSent) {
    return next(err);
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
