// src/routes/index.js

/**
 * @file index.js
 * @description Router principale che gestisce tutti i sotto-router dell'applicazione
 * @author Raika-sama
 * @date 2025-01-05
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger/logger');

// Import dei router specifici (da implementare)
const schoolRoutes = require('./schoolRoutes');
const userRoutes = require('./userRoutes');
const classRoutes = require('./classRoutes');
const studentRoutes = require('./studentRoutes');
const testRoutes = require('./testRoutes');
const healthRoutes = require('./healthRoutes');

// Middleware per logging delle routes
router.use((req, res, next) => {
    logger.info(`Route chiamata: [${req.method}] ${req.originalUrl}`);
    next();
});

// Definizione dei percorsi base API
router.use('/schools', schoolRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/tests', testRoutes);
router.use('/health', healthRoutes);

// Route base API per health check
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API funzionanti',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;