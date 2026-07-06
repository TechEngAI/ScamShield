/**
 * Send a standardized success response.
 *
 * @param {import('express').Response} res
 * @param {Object} data
 * @param {string} message
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data, message, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a standardized error response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=400]
 * @param {Array|Object|null} [errors=null]
 */
function sendError(res, message, statusCode = 400, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
