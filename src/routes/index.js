// src/routes/index.js
const express = require('express');
const logger = require('../utils/errors/logger/logger');

// Factory function per creare il router con le dipendenze
const createRouter = ({ authController, authService, userService, sessionService, authMiddleware }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    
    const router = express.Router();
    const { protect } = authMiddleware;
    
    // Importa le route con le dipendenze
    const authRoutes = require('./authRoutes')({ authController, authMiddleware });
    const classRoutes = require('./classRoutes')({ ...dependencies, protect });
    const schoolRoutes = require('./schoolRoutes')({ ...dependencies, protect });
    const userRoutes = require('./userRoutes')({ ...dependencies, protect });
    const studentRoutes = require('./studentRoutes')({ ...dependencies, protect });
    const testRoutes = require('./testRoutes')({ ...dependencies, protect });
    const csiRoutes = require('../engines/CSI/routes/csi.routes')({ ...dependencies, protect });

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

    // Route protette (usando il protect dal middleware iniettato)
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