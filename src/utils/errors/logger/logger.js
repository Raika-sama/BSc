/**
 * @file logger.js
 * @description Sistema di logging centralizzato dell'applicazione.
 * Gestisce tutti i log dell'applicazione usando la configurazione centralizzata.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('winston-daily-rotate-file');
const config = require('../../config/config');
const loggerConfig = require('../../config/logger.config');

// Creazione directory logs se non esiste
if (!fs.existsSync(loggerConfig.directory)) {
    fs.mkdirSync(loggerConfig.directory);
}

/**
 * Crea il formato base per i log
 * Include timestamp e gestione errori
 */
const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: loggerConfig.timestampFormat }),
    winston.format.errors({ stack: loggerConfig.format.includeStack }),
    winston.format.splat()
);

/**
 * Formato per console (development)
 * Include colori e formattazione leggibile
 */
const consoleFormat = winston.format.combine(
    baseFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, requestId, ...metadata }) => {
        let log = `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ''}: ${message}`;
        
        if (loggerConfig.format.includeMeta && Object.keys(metadata).length > 0) {
            const metaString = JSON.stringify(metadata, null, 2);
            log += `\n${metaString}`;
        }
        
        return log;
    })
);

/**
 * Formato per file (production)
 * Output JSON strutturato
 */
const fileFormat = winston.format.combine(
    baseFormat,
    winston.format.json()
);

/**
 * Crea transport per un tipo specifico di log
 * @param {Object} fileConfig - Configurazione del file di log
 * @returns {Object} Winston transport configurato
 */
const createFileTransport = (fileConfig) => {
    return new winston.transports.DailyRotateFile({
        ...loggerConfig.rotation,
        filename: path.join(loggerConfig.directory, fileConfig.filename),
        symlinkName: fileConfig.symlink,
        level: fileConfig.level,
        format: fileFormat
    });
};

// Inizializzazione logger con livelli personalizzati
const logger = winston.createLogger({
    level: config.env === 'development' 
        ? loggerConfig.development.level 
        : loggerConfig.production.level,
    levels: loggerConfig.levels,
    transports: [
        createFileTransport(loggerConfig.files.error),
        createFileTransport(loggerConfig.files.combined),
        createFileTransport(loggerConfig.files.access)
    ]
});

// Aggiunta colori personalizzati
winston.addColors(loggerConfig.colors);

// In development, aggiungi output console
if (config.env === 'development' && loggerConfig.development.showConsole) {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

/**
 * Funzioni helper per logging con metadati opzionali
 * @type {Object}
 */
const log = {
    error: (message, metadata = {}) => {
        logger.error(message, { timestamp: new Date(), ...metadata });
    },
    warn: (message, metadata = {}) => {
        logger.warn(message, { timestamp: new Date(), ...metadata });
    },
    info: (message, metadata = {}) => {
        logger.info(message, { timestamp: new Date(), ...metadata });
    },
    http: (message, metadata = {}) => {
        logger.http(message, { timestamp: new Date(), ...metadata });
    },
    debug: (message, metadata = {}) => {
        logger.debug(message, { timestamp: new Date(), ...metadata });
    }
};

/**
 * Funzione di pulizia per shutdown graceful
 */
const cleanup = () => {
    logger.end();
    return new Promise((resolve) => {
        logger.on('finish', resolve);
    });
};

// Gestione shutdown graceful
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
    ...log,
    cleanup,
    logger // Esporta anche l'istanza logger per usi avanzati
};