const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account with email + password
 * Triggers OTP email verification
 */
router.post(
  '/register',
  authLimiter,
  [
    body('first_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('first name must be 2-50 characters'),
    body('last_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('last name must be 2-50 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('valid email is required'),
    body('phone_number')
      .trim()
      .matches(/^(\+234|0)[789]\d{9}$/)
      .withMessage('phone number must be a valid Nigerian number'),
    body('username')
      .trim()
      .matches(/^[a-zA-Z0-9_]{3,20}$/)
      .withMessage('username must be 3-20 characters, letters, numbers, and underscores only'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validate,
  authController.register
);

/**
 * POST /api/auth/verify-email
 * Verify the OTP sent during registration
 */
router.post(
  '/verify-email',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('valid email is required'),
    body('token')
      .trim()
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('token must be a 6-digit code'),
  ],
  validate,
  authController.verifyEmail
);

/**
 * POST /api/auth/login
 * Login with email + password
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('valid email is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  validate,
  authController.login
);

/**
 * POST /api/auth/logout
 * Invalidate the current session
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, authController.me);

/**
 * POST /api/auth/resend-otp
 * Resend verification OTP to user's email
 */
router.post(
  '/resend-otp',
  authLimiter,
  [body('email').trim().isEmail().withMessage('valid email is required')],
  validate,
  authController.resendOtp
);

module.exports = router;
