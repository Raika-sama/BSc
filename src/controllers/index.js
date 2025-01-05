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

// Verifica che tutti i controller siano caricati correttamente
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
        if (!controller) {
            logger.error(`Controller non inizializzato`, { controllerName: name });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                `Controller ${name} non inizializzato correttamente`
            );
        }
    });

    logger.info('Controllers caricati con successo', {
        controllers: Object.keys(controllers),
        timestamp: new Date().toISOString()
    });

    // Congela l'oggetto controllers per prevenire modifiche accidentali
    Object.freeze(controllers);

} catch (error) {
    logger.error('Errore durante l\'inizializzazione dei controllers', { error });
    throw createError(
        ErrorTypes.SYSTEM.INTERNAL_ERROR,
        'Errore durante l\'inizializzazione dei controllers',
        { originalError: error.message }
    );
}

module.exports = controllers;