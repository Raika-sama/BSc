// src/routes/index.js

const express = require('express');
const router = express.Router();
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

// Import dei router
const authRoutes = require('./authRoutes');
const schoolRoutes = require('./schoolRoutes');
const userRoutes = require('./userRoutes');
const classRoutes = require('./classRoutes');
const studentRoutes = require('./studentRoutes');
const testRoutes = require('./testRoutes');
const healthRoutes = require('./healthRoutes');

/**
 * Middleware per logging delle richieste
 */
router.use((req, res, next) => {
    const requestInfo = {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id'] || crypto.randomUUID()
    };

    // Aggiungi correlationId alla risposta
    res.setHeader('x-correlation-id', requestInfo.correlationId);
    
    logger.info('Route Called', requestInfo);
    next();
});

// Validazione dei router
try {
    const routes = {
        health: healthRoutes,
        auth: authRoutes,
        schools: schoolRoutes,
        users: userRoutes,
        classes: classRoutes,
        students: studentRoutes,
        tests: testRoutes
    };

    Object.entries(routes).forEach(([name, route]) => {
        if (!route || !route.stack) {
            logger.error(`Router non inizializzato correttamente`, { routeName: name });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                `Router ${name} non inizializzato correttamente`
            );
        }
    });

    logger.info('Routers inizializzati con successo', {
        routes: Object.keys(routes),
        timestamp: new Date().toISOString()
    });
} catch (error) {
    logger.error('Errore durante l\'inizializzazione dei router', { error });
    throw error;
}

// Definizione dei percorsi base API
router.use('/health', healthRoutes);  // Health check
router.use('/auth', authRoutes);      // Autenticazione
router.use('/schools', schoolRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/tests', testRoutes);

// 404 handler
router.use((req, res) => {
    const routeError = {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        timestamp: new Date().toISOString()
    };

    logger.warn('Route non trovata', routeError);

    res.status(404).json({
        status: 'error',
        error: createError(
            ErrorTypes.RESOURCE.NOT_FOUND,
            'Route non trovata',
            { path: req.originalUrl }
        )
    });
});

// Error handler globale
router.use((err, req, res, next) => {
    const errorInfo = {
        error: err,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        correlationId: req.headers['x-correlation-id'],
        timestamp: new Date().toISOString()
    };

    logger.error('Global Error Handler', errorInfo);

    // Se l'errore è già formattato, usalo
    if (err.code && err.status) {
        return res.status(err.status).json({
            status: 'error',
            error: err
        });
    }

    // Altrimenti, crea un errore standard
    const standardError = createError(
        ErrorTypes.SYSTEM.INTERNAL_ERROR,
        'Errore interno del server',
        { originalError: err.message }
    );

    res.status(standardError.status).json({
        status: 'error',
        error: standardError
    });
});

module.exports = router;