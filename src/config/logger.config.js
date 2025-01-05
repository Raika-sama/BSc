/**
 * @file logger.config.js
 * @description Configurazione centralizzata del sistema di logging.
 * Definisce tutti i parametri configurabili del sistema di logging.
 */

const path = require('path');

const config = {
    // Directory base per i log
    directory: 'logs',

    // Configurazione file di log
    files: {
        error: {
            filename: 'error-%DATE%.log',
            symlink: 'error.log',
            level: 'error'
        },
        combined: {
            filename: 'combined-%DATE%.log',
            symlink: 'combined.log',
            level: 'info'
        },
        access: {
            filename: 'access-%DATE%.log',
            symlink: 'access.log',
            level: 'http'
        }
    },

    // Configurazione rotazione file
    rotation: {
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        createSymlink: true
    },

    // Livelli di log personalizzati
    levels: {
        error: 0,    // Errori critici
        warn: 1,     // Warning
        info: 2,     // Informazioni generali
        http: 3,     // Richieste HTTP
        debug: 4     // Debug dettagliato
    },

    // Colori per output console
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue'
    },

    // Campi da nascondere nei log per privacy/sicurezza
    sensitiveFields: [
        'password',
        'token',
        'authorization',
        'cookie',
        'secret',
        'password_confirmation'
    ],

    // Formato timestamp
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',

    // Configurazioni specifiche per ambiente
    development: {
        level: 'debug',
        showConsole: true
    },
    
    production: {
        level: 'info',
        showConsole: false
    },

    // Funzioni helper per i path dei file
    getLogPath: (filename) => path.join(config.directory, filename),
    
    // Configurazione formato output
    format: {
        // Dettagli da includere nei log
        includeMeta: true,
        includeTimestamp: true,
        includeRequestId: true,
        includeStack: true
    }
};

module.exports = config;