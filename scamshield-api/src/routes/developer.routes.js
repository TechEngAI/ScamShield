const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { generalLimiter, createRateLimiter } = require('../middleware/rateLimit.middleware');
const developerController = require('../controllers/developer.controller');

const router = express.Router();

const postLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

router.use(authMiddleware);
router.use(generalLimiter);

router.get('/keys', developerController.listKeys);
router.post('/keys', postLimiter, developerController.generateKey);
router.delete('/keys/:id', developerController.revokeKey);
router.get('/usage', developerController.getUsage);

module.exports = router;
