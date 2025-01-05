/**
 * @file loggerMiddleware.js
 * @description Middleware per il logging delle richieste HTTP.
 * Registra dettagli delle richieste evitando dati sensibili.
 */

const logger = require('../utils/logger/logger');

/**
 * Pulisce i dati sensibili dalle richieste prima del logging
 * @param {Object} body - Body della richiesta
 * @returns {Object} Body pulito dai dati sensibili
 */
const sanitizeRequest = (body) => {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'authorization', 'cookie'];
    
    sensitiveFields.forEach(field => {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
};

/**
 * Genera un ID univoco per la richiesta
 * @returns {string} ID della richiesta
 */
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formatta la dimensione in bytes in formato leggibile
 * @param {number} bytes - Dimensione in bytes
 * @returns {string} Dimensione formattata
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Middleware principale per il logging delle richieste
 */
const requestLogger = (req, res, next) => {
    // Assegna un ID univoco alla richiesta
    req.requestId = generateRequestId();
    
    // Timestamp inizio richiesta
    const startTime = Date.now();

    // Log iniziale della richiesta
    logger.http('Richiesta ricevuta', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        body: sanitizeRequest(req.body),
        query: req.query
    });

    // Intercetta la fine della risposta
    res.on('finish', () => {
        // Calcola durata della richiesta
        const duration = Date.now() - startTime;
        
        // Determina il livello di log basato sullo status code
        const level = res.statusCode >= 400 ? 'warn' : 'http';
        
        // Log della risposta
        logger[level]('Risposta inviata', {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: formatBytes(parseInt(res.get('Content-Length') || 0)),
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
    });

    next();
};

/**
 * Middleware per il logging degli errori
 */
const errorLogger = (err, req, res, next) => {
    logger.error('Errore richiesta', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        error: {
            message: err.message,
            stack: err.stack,
            code: err.code
        },
        body: sanitizeRequest(req.body),
        query: req.query
    });

    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
};