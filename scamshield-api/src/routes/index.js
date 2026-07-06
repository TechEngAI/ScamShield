
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const scamRoutes = require('./scam.routes');
const dashboardRoutes = require('./dashboard.routes');
const whatsappRoutes = require('./whatsapp.routes');

router.use('/auth', authRoutes);
router.use('/scam', scamRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;
