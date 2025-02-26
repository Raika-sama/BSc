// src/middleware/index.js
const createAuthMiddleware = require('./authMiddleware');
const studentValidation = require('./studentValidation');
const services = require('../services');

// Creazione del middleware di autenticazione con tutti i servizi necessari
const authMiddleware = createAuthMiddleware(
    services.authService, 
    services.sessionService,
    services.permissionService,
    services.studentAuthService
);

module.exports = {
    authMiddleware,
    studentValidation
};