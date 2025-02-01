// src/middleware/index.js
const createAuthMiddleware = require('./authMiddleware');
const { authService, sessionService } = require('../services');

// Inizializza il middleware di autenticazione
const authMiddleware = createAuthMiddleware(authService, sessionService);

module.exports = {
    protect: authMiddleware.protect,
    restrictTo: authMiddleware.restrictTo,
    loginLimiter: authMiddleware.loginLimiter
};