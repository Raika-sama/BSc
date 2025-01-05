// src/routes/index.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/errors/logger/logger');

// Import dei router
const authRoutes = require('./authRoutes');
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
router.use('/health', healthRoutes);  // Prima route - health check
router.use('/auth', authRoutes);      // Seconda route - autenticazione
router.use('/schools', schoolRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/tests', testRoutes);

// 404 handler (ultima route)
router.use((req, res) => {
    logger.warn(`Route non trovata: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 'error',
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'Route non trovata'
        }
    });
});

module.exports = router;