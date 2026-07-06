/**
 * Wrap an async route handler to catch errors and pass them to next().
 *
 * @param {Function} fn
 * @returns {Function}
 */
function asyncHandler(fn) {
  return function asyncUtilWrap(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
