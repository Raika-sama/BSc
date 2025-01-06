// src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const classRoutes = require('./classRoutes');
const schoolRoutes = require('./schoolRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const testRoutes = require('./testRoutes');

// Log delle route caricate
const logger = require('../utils/errors/logger/logger');

// Monta tutte le route sotto i loro rispettivi prefissi
router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/schools', schoolRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/tests', testRoutes);

// Log delle route registrate
logger.info('Routes caricate:', {
    routes: [
        '/auth',
        '/classes',
        '/schools',
        '/users',
        '/students',
        '/tests'
    ]
});

module.exports = router;