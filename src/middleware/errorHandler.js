/**
 * @file errorHandler.js
 * @description Middleware centrale per la gestione degli errori dell'applicazione.
 * Gestisce sia errori operativi che errori di programmazione, con output
 * differenziato tra ambiente di sviluppo e produzione.
 */

const AppError = require('../utils/errors/AppError');
const { ErrorTypes } = require('../utils/errors/errorTypes');
const config = require('../config/config');

/**
 * Gestisce errori di MongoDB
 * @param {Error} err - Errore originale
 * @returns {AppError} Errore formattato
 */
const handleMongoError = (err) => {
    if (err.code === 11000) {
        // Gestione errori di duplicazione
        const field = Object.keys(err.keyPattern)[0];
        return new AppError(
            `Valore duplicato per il campo ${field}`,
            ErrorTypes.RESOURCE.ALREADY_EXISTS.status,
            ErrorTypes.RESOURCE.ALREADY_EXISTS.code,
            { field }
        );
    }
    // Altri errori MongoDB
    return new AppError(
        'Errore del database',
        ErrorTypes.DATABASE.QUERY_FAILED.status,
        ErrorTypes.DATABASE.QUERY_FAILED.code
    );
};

/**
 * Gestisce errori di validazione Mongoose
 * @param {Error} err - Errore originale
 * @returns {AppError} Errore formattato
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
    }));

    return new AppError(
        'Errore di validazione',
        ErrorTypes.VALIDATION.INVALID_INPUT.status,
        ErrorTypes.VALIDATION.INVALID_INPUT.code,
        { errors }
    );
};

/**
 * Gestisce errori di JWT
 * @param {Error} err - Errore originale
 * @returns {AppError} Errore formattato
 */
const handleJWTError = (err) => {
    if (err.name === 'TokenExpiredError') {
        return new AppError(
            'Token scaduto',
            ErrorTypes.AUTH.TOKEN_EXPIRED.status,
            ErrorTypes.AUTH.TOKEN_EXPIRED.code
        );
    }
    return new AppError(
        'Token non valido',
        ErrorTypes.AUTH.TOKEN_INVALID.status,
        ErrorTypes.AUTH.TOKEN_INVALID.code
    );
};

/**
 * Middleware principale per la gestione degli errori
 */
const errorHandler = (err, req, res, next) => {
    // Log dell'errore
    console.error('ERROR 💥:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });

    // Se l'errore è già un'istanza di AppError, lo usiamo direttamente
    let error = err instanceof AppError ? err : null;

    // Gestiamo i diversi tipi di errore
    if (!error) {
        if (err.name === 'ValidationError') {
            error = handleValidationError(err);
        } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
            error = handleMongoError(err);
        } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            error = handleJWTError(err);
        } else {
            // Errore generico
            error = new AppError(
                'Si è verificato un errore interno',
                ErrorTypes.SYSTEM.INTERNAL_ERROR.status,
                ErrorTypes.SYSTEM.INTERNAL_ERROR.code
            );
        }
    }

    // Prepariamo la risposta
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.errorCode,
            ...(error.metadata && { metadata: error.metadata })
        }
    };

    // In development aggiungiamo info extra
    if (config.env === 'development') {
        response.error.stack = err.stack;
        response.error.originalError = err.message;
    }

    // Inviamo la risposta
    res.status(error.statusCode).json(response);
};

module.exports = errorHandler;