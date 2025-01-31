// src/middleware/asyncHandler.js

/**
 * @file asyncHandler.js
 * @description Middleware per gestire le funzioni asincrone nelle routes
 * @author Raika-sama
 * @date 2025-01-31
 */

const logger = require('../utils/errors/logger/logger');

/**
 * Wrapper per gestire le funzioni asincrone nelle routes
 * Cattura automaticamente gli errori e li passa al middleware di gestione errori
 * 
 * @param {Function} fn - La funzione da wrappare
 * @returns {Function} Middleware function
 * 
 * @example
 * // Uso nelle routes
 * router.get('/path', asyncHandler(async (req, res) => {
 *   // Codice asincrono
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch((error) => {
            logger.error('Errore catturato da asyncHandler', {
                error,
                path: req.path,
                method: req.method
            });
            next(error);
        });
};

module.exports = {
    asyncHandler
};