// src/routes/healthRoutes.js

/**
 * @file healthRoutes.js
 * @description Router per il monitoraggio dello stato dell'applicazione
 */

const express = require('express');
const router = express.Router();
const { isConnected } = require('../config/database');
const logger = require('../utils/logger/logger');

router.get('/', async (req, res) => {
    try {
        // Verifica connessione database
        const dbStatus = isConnected();
        
        // Controllo stato generale
        const status = {
            status: dbStatus ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            database: {
                connected: dbStatus
            },
            memory: {
                usage: process.memoryUsage(),
                free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
            }
        };

        // Log dello stato
        logger.info('Health check eseguito', { status });

        // Response
        res.status(dbStatus ? 200 : 503).json(status);
    } catch (error) {
        logger.error('Errore durante health check', { error });
        res.status(500).json({
            status: 'error',
            message: 'Errore durante health check',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;