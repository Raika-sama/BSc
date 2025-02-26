// src/services/index.js
const AuthService = require('./AuthService');
const UserService = require('./UserService');
const SessionService = require('./SessionService');
const PermissionService = require('./PermissionService');
const StudentAuthService = require('./StudentAuthService');
const repositories = require('../repositories');

// Inizializza i servizi nell'ordine corretto
const sessionService = new SessionService(repositories.userRepository);
const permissionService = new PermissionService(repositories.userRepository);

const authService = new AuthService(
    repositories.authRepository, 
    sessionService, 
    repositories.userRepository
);

const userService = new UserService(
    repositories.userRepository, 
    authService, 
    sessionService,
    permissionService // Aggiungiamo il permissionService al UserService
);

const studentAuthService = new StudentAuthService(
    repositories.studentAuthRepository,
    repositories.studentRepository,
    repositories.emailService,
    sessionService
);

module.exports = {
    authService,
    userService,
    sessionService,
    permissionService,
    studentAuthService
};