// src/controllers/index.js

/**
 * @file index.js
 * @description Export centralizzato dei controllers
 * @author Raika-sama
 * @date 2025-01-31
 */

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

// Import delle classi Controller
const AuthController = require('./AuthController');
const UserController = require('./UserController');
const SchoolController = require('./SchoolController');
const ClassController = require('./ClassController');
const StudentController = require('./studentController');
const TestController = require('./TestController');

// Import dei servizi
const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const SessionService = require('../services/SessionService');

// Import dei repository
const UserRepository = require('../repositories/UserRepository');
const AuthRepository = require('../repositories/authRepository');

// Import dei models
const { User } = require('../models');

// Inizializzazione repositories
const userRepository = new UserRepository(User);
const authRepository = new AuthRepository(User);

// Inizializzazione servizi
const sessionService = new SessionService(userRepository);
const authService = new AuthService(authRepository, sessionService);
const userService = new UserService(userRepository, authService, sessionService);

// Inizializzazione controllers
const controllers = {
    auth: new AuthController(authService, userService, sessionService),
    user: new UserController(userService, sessionService),
    school: new SchoolController(),
    class: new ClassController(),
    student: new StudentController(),
    test: new TestController()
};

// Il resto del tuo codice di validazione rimane identico
const requiredMethods = {
    'auth': ['register', 'login', 'logout', 'getMe', 'forgotPassword', 'resetPassword', 'updatePassword'],
    'school': [],
    'user': [],
    'class': [],
    'student': [],
    'test': []
};


// Validazione dei controller
try {
    Object.entries(controllers).forEach(([name, controller]) => {
        // Verifica base del controller
        if (!controller) {
            logger.error(`Controller non inizializzato`, { controllerName: name });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                `Controller ${name} non inizializzato correttamente`
            );
        }

        // Verifica metodi specifici solo per i controller che li richiedono
        if (requiredMethods[name] && requiredMethods[name].length > 0) {
            requiredMethods[name].forEach(method => {
                if (typeof controller[method] !== 'function') {
                    logger.error(`Metodo ${method} mancante nel controller ${name}`, {
                        controller: name,
                        method: method,
                        availableMethods: Object.keys(controller)
                    });
                    throw createError(
                        ErrorTypes.SYSTEM.INTERNAL_ERROR,
                        `Metodo ${method} mancante nel controller ${name}`
                    );
                }
            });
        }

        // Log dei metodi disponibili per ogni controller
        logger.debug(`Metodi disponibili per ${name} controller:`, {
            controller: name,
            methods: Object.keys(controller).filter(key => typeof controller[key] === 'function')
        });
    });

    logger.info('Controllers caricati con successo', {
        controllers: Object.keys(controllers)
    });

    // Congela l'oggetto controllers per prevenire modifiche accidentali
    Object.freeze(controllers);

} catch (error) {
    logger.error('Errore durante l\'inizializzazione dei controllers', { error });
    throw error;
}

module.exports = controllers;