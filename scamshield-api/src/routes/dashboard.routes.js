const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const { dashboardLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// GET /api/dashboard/states — scam counts by Nigerian state (public)
router.get('/states', dashboardController.getScamsByState);

router.use(authMiddleware);
router.use(dashboardLimiter);

router.get('/stats', dashboardController.getStats);
router.get('/recent', dashboardController.getRecent);
router.get('/categories', dashboardController.getCategories);
router.get('/banks', dashboardController.getBankLeaderboard);
router.post('/complete-onboarding', dashboardController.completeOnboarding);
router.get('/protection-score', dashboardController.getProtectionScore);

module.exports = router;
