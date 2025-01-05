// src/routes/authRoutes.js

/**
 * @file authRoutes.js
 * @description Router per la gestione dell'autenticazione
 * @author Raika-sama
 * @date 2025-01-05
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/errors/logger/logger');

// Middleware di logging
router.use((req, res, next) => {
    logger.info(`Auth Route Called: ${req.method} ${req.originalUrl}`);
    next();
});

// Routes pubbliche
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Routes protette
router.use(protect);
router.post('/logout', authController.logout.bind(authController));

module.exports = router;