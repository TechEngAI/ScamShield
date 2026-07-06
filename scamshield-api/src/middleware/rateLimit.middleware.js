/**
 * Rate limiting middleware factory.
 *
 * @param {Object} options
 * @returns {import('express').RequestHandler}
 */
const rateLimit = require('express-rate-limit');

function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'too many requests, please try again later' },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'too many requests, please try again later',
      });
    },
  });
}

const generalLimiter = createRateLimiter();

// Auth limiter — for OTP send and verify endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'too many auth attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Scam check limiter — for the main classifier endpoint
const scamCheckLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: 'scam check limit reached, please try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  scamCheckLimiter,
};
