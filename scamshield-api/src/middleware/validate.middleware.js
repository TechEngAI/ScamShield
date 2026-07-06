/**
 * Middleware to handle express-validator validation results.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, 'validation failed', 422, errors.array());
  }

  return next();
}

module.exports = validate;
