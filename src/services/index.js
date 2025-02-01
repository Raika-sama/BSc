// src/services/index.js
const AuthService = require('./AuthService');
const UserService = require('./UserService');
const SessionService = require('./SessionService');
const repositories = require('../repositories');

// Inizializza i servizi nell'ordine corretto
const sessionService = new SessionService(repositories.userRepository);  // userRepository invece di UserRepository
const authService = new AuthService(
    repositories.authRepository, 
    sessionService, 
    repositories.userRepository
);
const userService = new UserService(
    repositories.userRepository, 
    authService, 
    sessionService
);

module.exports = {
    authService,
    userService,
    sessionService
};