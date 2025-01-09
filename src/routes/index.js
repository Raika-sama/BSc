const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authRoutes = require('./authRoutes');
const classRoutes = require('./classRoutes');
const schoolRoutes = require('./schoolRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const testRoutes = require('./testRoutes');

const logger = require('../utils/errors/logger/logger');

// Route pubbliche (non richiedono autenticazione)
router.use('/auth', authRoutes);

// Middleware di protezione per tutte le altre route
router.use((req, res, next) => {
    logger.debug('Request details at router level:', {
        path: req.path,
        method: req.method,
        auth: req.headers.authorization ? 'Present' : 'Missing'
    });
    next();
});

// Applica il middleware di protezione a tutte le route eccetto /auth
router.use(['/classes', '/schools', '/users', '/students', '/tests'], protect);

// Monta le route protette
router.use('/classes', classRoutes);
router.use('/schools', schoolRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/tests', testRoutes);

// Log delle route registrate
logger.info('Routes caricate:', {
    public: ['/auth'],
    protected: ['/classes', '/schools', '/users', '/students', '/tests']
});

module.exports = router;