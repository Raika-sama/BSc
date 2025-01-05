/**
 * @file errorHandler.js
 * @description Middleware centrale per la gestione degli errori dell'applicazione.
 */
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const config = require('../config/config');

/**
 * Gestisce errori di MongoDB
 * @param {Error} err - Errore originale
 * @returns {Object} Errore formattato
 */
const handleMongoError = (err) => {
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return createError(
            ErrorTypes.RESOURCE.ALREADY_EXISTS,
            `Valore duplicato per il campo ${field}`,
            { field }
        );
    }
    return createError(
        ErrorTypes.DATABASE.QUERY_FAILED,
        'Errore del database',
        { originalError: err.message }
    );
};

/**
 * Gestisce errori di validazione Mongoose
 * @param {Error} err - Errore originale
 * @returns {Object} Errore formattato
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
    }));

    return createError(
        ErrorTypes.VALIDATION.INVALID_INPUT,
        'Errore di validazione',
        { errors }
    );
};

/**
 * Gestisce errori di JWT
 * @param {Error} err - Errore originale
 * @returns {Object} Errore formattato
 */
const handleJWTError = (err) => {
    if (err.name === 'TokenExpiredError') {
        return createError(
            ErrorTypes.AUTH.TOKEN_EXPIRED,
            'Token scaduto'
        );
    }
    return createError(
        ErrorTypes.AUTH.TOKEN_INVALID,
        'Token non valido'
    );
};

/**
 * Middleware principale per la gestione degli errori
 */
const errorHandler = (err, req, res, next) => {
    // Log dell'errore con il logger centralizzato
    logger.error('Error Handler', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });

    // Se l'errore è già strutturato (creato con createError)
    let error = err.code && err.status ? err : null;

    // Gestiamo i diversi tipi di errore
    if (!error) {
        if (err.name === 'ValidationError') {
            error = handleValidationError(err);
        } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
            error = handleMongoError(err);
        } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            error = handleJWTError(err);
        } else {
            // Errore generico di sistema
            error = createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Si è verificato un errore interno',
                { originalError: err.message }
            );
        }
    }

    // Prepariamo la risposta
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.code,
            status: error.status,
            ...(error.metadata && { metadata: error.metadata })
        }
    };

    // In development aggiungiamo info extra
    if (config.env === 'development') {
        response.error.stack = err.stack;
        if (err.originalError) {
            response.error.originalError = err.originalError;
        }
    }

    // Log della risposta di errore
    logger.debug('Error Response', { response });

    // Inviamo la risposta
    res.status(error.status).json(response);
};

module.exports = errorHandler;