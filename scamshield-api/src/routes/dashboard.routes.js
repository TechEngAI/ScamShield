const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);
router.get('/recent', dashboardController.getRecent);
router.get('/categories', dashboardController.getCategories);

module.exports = router;
