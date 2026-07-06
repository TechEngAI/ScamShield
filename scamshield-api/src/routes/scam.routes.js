const express = require('express');
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const scamController = require('../controllers/scam.controller');
const { scamCheckLimiter, historyLimiter } = require('../middleware/rateLimit.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = express.Router();

router.post(
  '/check',
  scamCheckLimiter,
  authMiddleware.optional,
  [
    body('message_text').notEmpty().withMessage('message_text is required').isLength({ max: 2000 }),
    body('source').optional().isIn(['web', 'whatsapp', 'sms', 'api']).withMessage('source must be web, whatsapp, sms, or api'),
  ],
  validate,
  scamController.checkScam
);

router.post(
  '/check-image',
  scamCheckLimiter,
  authMiddleware.optional,
  upload.single('image'),
  scamController.checkImageScam
);

router.post(
  '/check-bulk',
  authMiddleware.optional,
  scamCheckLimiter,
  [
    body('messages')
      .isArray({ min: 1, max: 5 })
      .withMessage('provide between 1 and 5 messages'),
    body('messages.*')
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('each message must be between 10 and 2000 characters'),
  ],
  validate,
  scamController.checkBulkScam
);

router.get(
  '/history',
  authMiddleware,
  historyLimiter,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('verdict').optional().isIn(['scam', 'safe', 'suspicious']),
  ],
  validate,
  scamController.getHistory
);

router.get('/patterns', authMiddleware, historyLimiter, scamController.getPatterns);

module.exports = router;
