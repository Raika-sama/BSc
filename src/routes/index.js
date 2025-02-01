// src/routes/index.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/errors/logger/logger');

// Factory function per creare il router con le dipendenze
const createRouter = (dependencies) => {
    const router = express.Router();
    
    // Importa le route con le dipendenze
    const authRoutes = require('./authRoutes')(dependencies);
    const classRoutes = require('./classRoutes')(dependencies);
    const schoolRoutes = require('./schoolRoutes')(dependencies);
    const userRoutes = require('./userRoutes')(dependencies);
    const studentRoutes = require('./studentRoutes')(dependencies);
    const testRoutes = require('./testRoutes')(dependencies);
    const csiRoutes = require('../engines/CSI/routes/csi.routes')(dependencies);

    // Middleware di logging
    router.use((req, res, next) => {
        logger.debug('Request details at router level:', {
            path: req.path,
            method: req.method,
            auth: req.headers.authorization ? 'Present' : 'Missing'
        });
        next();
    });

    // Route pubbliche
    router.use('/auth', authRoutes);
    router.use('/tests/csi/public', csiRoutes.publicRoutes);

    // Route protette
    router.use(['/classes', '/schools', '/users', '/students', '/tests'], protect);
    
    router.use('/classes', classRoutes);
    router.use('/schools', schoolRoutes);
    router.use('/users', userRoutes);
    router.use('/students', studentRoutes);
    router.use('/tests', testRoutes);
    router.use('/tests/csi', csiRoutes.protectedRoutes);

    logger.info('Routes caricate:', {
        public: ['/auth', '/tests/csi/public'],
        protected: ['/classes', '/schools', '/users', '/students', '/tests']
    });

    return router;
};

module.exports = createRouter;