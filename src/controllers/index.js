// src/controllers/index.js

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

// Import dei models
const { User } = require('../models');

// Import dei Services
const SessionService = require('../services/SessionService');
const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const StudentAuthService = require('../services/StudentAuthService'); // Nuovo

// Import dei Controller
const AuthController = require('./authController');
const UserController = require('./userController');
const SchoolController = require('./schoolController');
const ClassController = require('./classController');
const StudentController = require('./studentController');
const TestController = require('./testController');
const StudentAuthController = require('./StudentAuthController'); // Nuovo



// Utilizziamo i repositories già istanziati
// Import dei repositories
const { 
    authRepository, 
    userRepository,
    classRepository,
    schoolRepository,
    studentRepository,
    testRepository,
    studentAuthRepository  // Nuovo
} = require('../repositories');

// Inizializzazione servizi con tutte le dipendenze necessarie
const sessionService = new SessionService(userRepository);
const authService = new AuthService(authRepository, sessionService, userRepository);
const userService = new UserService(userRepository, authService, sessionService);
const studentAuthService = new StudentAuthService(  // Nuovo
    studentAuthRepository,
    studentRepository,
    sessionService
);

// Inizializzazione controllers con le dipendenze corrette
const controllers = {
    auth: new AuthController(authService, userService, sessionService),
    user: new UserController(userService, sessionService),
    school: new SchoolController(schoolRepository, userService),
    class: new ClassController(classRepository, schoolRepository, userService),
    student: new StudentController(studentRepository, classRepository, schoolRepository),
    test: new TestController(testRepository, studentRepository, classRepository),
    studentAuth: new StudentAuthController(studentAuthService, studentRepository) // Nuovo
};

const requiredMethods = {
    'auth': ['login', 'logout', 'getMe', 'forgotPassword', 'resetPassword', 'updatePassword'],
    'school': [],
    'user': [],
    'class': [],
    'student': [],
    'test': [],
    'studentAuth': ['login', 'logout', 'handleFirstAccess', 'generateCredentials'] // Nuovo
};

// Funzione helper per verificare se un metodo esiste
const methodExists = (obj, method) => {
    return typeof obj[method] === 'function' || 
           (obj[method] && {}.toString.call(obj[method]) === '[object Function]') ||
           (obj[method] && {}.toString.call(obj[method]) === '[object AsyncFunction]');
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
                if (!methodExists(controller, method)) {
                    logger.error(`Metodo ${method} mancante nel controller ${name}`, {
                        controller: name,
                        method: method,
                        availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
                            .concat(Object.keys(controller))
                            .filter(key => methodExists(controller, key))
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
            methods: Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
                .concat(Object.keys(controller))
                .filter(key => methodExists(controller, key))
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