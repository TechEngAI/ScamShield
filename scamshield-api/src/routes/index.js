
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const scamRoutes = require('./scam.routes');
const dashboardRoutes = require('./dashboard.routes');
const whatsappRoutes = require('./whatsapp.routes');
const developerRoutes = require('./developer.routes');

router.use('/auth', authRoutes);
router.use('/scam', scamRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/developer', developerRoutes);

module.exports = router;
