// src/controllers/index.js

/**
 * @file index.js
 * @description Export centralizzato dei controllers
 * @author Raika-sama
 * @date 2025-01-05
 */

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

const authController = require('./authController');
const schoolController = require('./schoolController');
const userController = require('./userController');
const classController = require('./classController');
const studentController = require('./studentController');
const testController = require('./testController');

// Definizione dei metodi richiesti per controller specifici
const requiredMethods = {
    'auth': ['register', 'login', 'logout', 'getMe', 'forgotPassword', 'resetPassword', 'updatePassword'],
    // Per gli altri controller, verifichiamo solo che esistano senza specificare i metodi richiesti
    'school': [],
    'user': [],
    'class': [],
    'student': [],
    'test': []
};

const controllers = {
    auth: authController,
    school: schoolController,
    user: userController,
    class: classController,
    student: studentController,
    test: testController
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