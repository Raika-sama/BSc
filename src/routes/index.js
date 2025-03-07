/**
 * @file index.js
 * @description Router principale dell'applicazione
 * @author Raika-sama
 * @date 2025-02-01 10:26:12
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');

/**
 * Factory function per creare il router principale con tutte le dipendenze
 * @param {Object} dependencies - Oggetto contenente tutte le dipendenze necessarie
 * @returns {express.Router} Router configurato con tutte le route
 */
const createRouter = (dependencies) => {
    // Validazione delle dipendenze richieste
    const requiredDependencies = [
        'authMiddleware',
        'authController',
        'classController',
        'schoolController',
        'userController',
        'studentController',
        'studentAuthController',
        'testController',
        'csiController',
        'testSystemController' // Aggiunta nuova dipendenza
    ];

    requiredDependencies.forEach(dep => {
        if (!dependencies[dep]) {
            throw new Error(`Dependency ${dep} is required`);
        }
    });

    const router = express.Router();
    const { protect } = dependencies.authMiddleware;

    // Importa le route con le dipendenze
    const authRoutes = require('./authRoutes')(dependencies);
    const studentAuthRoutes = require('./studentAuthRoutes')(dependencies);
    const classRoutes = require('./classRoutes')(dependencies);
    const schoolRoutes = require('./schoolRoutes')(dependencies);
    const userRoutes = require('./userRoutes')(dependencies);
    const studentRoutes = require('./studentRoutes')(dependencies);
    const testRoutes = require('./testRoutes')(dependencies);
    const csiRoutes = require('../engines/CSI/routes/csi.routes')(dependencies);
    
    // Importa e crea le rotte per i test di sistema
    const createTestSystemRouter = require('./testSystemRoutes');
    const testSystemRoutes = createTestSystemRouter({
        authMiddleware: dependencies.authMiddleware,
        testSystemController: dependencies.testSystemController
    });

    // Middleware di logging globale
    router.use((req, res, next) => {
        logger.debug('Request details at router level:', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            auth: req.headers.authorization ? 'Present' : 'Missing',
            timestamp: new Date().toISOString(),
            userAgent: req.get('user-agent')
        });
        next();
    });

    // Route pubbliche
    const publicRoutes = ['/auth', '/student-auth', '/tests/csi/public'];
    router.use('/auth', authRoutes);
    router.use('/student-auth', studentAuthRoutes);
    router.use('/tests/csi/public', csiRoutes.publicRoutes);


    // Route protette
    const protectedPaths = ['/classes', '/schools', '/users', '/students', '/tests', '/system-tests'];
    
    // Middleware di protezione per route protette
    router.use(protectedPaths, (req, res, next) => {
        logger.debug('Protected route accessed:', {
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });
        protect(req, res, next);
    });

    // Registrazione delle route protette
    router.use('/classes', classRoutes);
    router.use('/schools', schoolRoutes);
    router.use('/users', userRoutes);
    router.use('/students', studentRoutes);
    router.use('/tests', testRoutes);
    router.use('/tests/csi', csiRoutes.protectedRoutes);
    router.use('/system-tests', testSystemRoutes); // Aggiunte le rotte per i test di sistema

    // Log delle route caricate
    logger.info('Routes initialized:', {
        timestamp: new Date().toISOString(),
        public: publicRoutes,
        protected: protectedPaths,
        environment: process.env.NODE_ENV
    });

    // Gestione route non trovata
    router.use('*', (req, res) => {
        logger.warn('Route not found:', {
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        res.status(404).json({
            status: 'error',
            error: {
                code: 'ROUTE_NOT_FOUND',
                message: 'La route richiesta non esiste'
            }
        });
    });

    return router;
};

module.exports = createRouter;

/**
 * @summary Struttura delle Route
 * 
 * Route Pubbliche:
 * - /auth                   -> Autenticazione e gestione utenti
 * - /student-auth          -> Autenticazione studenti
 * - /tests/csi/public      -> Route pubbliche CSI
 * 
 * Route Protette:
 * - /classes               -> Gestione classi
 * - /schools               -> Gestione scuole
 * - /users                 -> Gestione utenti
 * - /students             -> Gestione studenti
 * - /tests                -> Gestione test
 * - /tests/csi            -> Route protette CSI
 * - /system-tests         -> Gestione dei test di sistema
 * 
 * Middleware:
 * - Logging globale per tutte le richieste
 * - Autenticazione per route protette
 * - Gestione route non trovate
 */