/**
 * @file config.js
 * @description Sistema centralizzato di configurazione dell'applicazione.
 * Gestisce il caricamento delle variabili d'ambiente e fornisce un'interfaccia
 * unificata per accedere alle configurazioni del sistema.
 */

const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || 'development'}`)
});

/**
 * Configurazione centralizzata dell'applicazione
 * @type {Object}
 */
const config = {
    // Ambiente dell'applicazione
    env: process.env.NODE_ENV || 'development',
    
    // Configurazione del server
    server: {
        port: parseInt(process.env.PORT, 10) || 5000,
        host: process.env.HOST || 'localhost'
    },
    
    // Configurazione MongoDB
    mongodb: {
        uri: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.DB_NAME || 'brainScannerDB'
        }
    },

    // Configurazione JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        cookieOptions: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 ore
        }
    },

    // Configurazione CORS
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Configurazione Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'app.log'
    },

    // Configurazione Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minuti
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
        message: 'Troppe richieste, riprova più tardi'
    }
};

/**
 * Validazione della configurazione
 * Verifica la presenza delle variabili d'ambiente richieste
 */
const requiredKeys = [
    'mongodb.uri',
    'jwt.secret'
];

/**
 * Funzione di validazione della configurazione
 * @param {Object} cfg - Oggetto di configurazione
 * @param {Array} keys - Array di chiavi richieste
 * @param {string} prefix - Prefisso per i messaggi di errore
 * @throws {Error} Se manca una configurazione richiesta
 */
const validateConfig = (cfg, keys, prefix = '') => {
    for (const key of keys) {
        const value = key.split('.').reduce((o, i) => o[i], cfg);
        if (!value) {
            throw new Error(`Configurazione mancante: ${prefix}${key}`);
        }
    }
};

// Esegue la validazione della configurazione
try {
    validateConfig(config, requiredKeys);
} catch (error) {
    console.error('Errore di configurazione:', error.message);
    process.exit(1);
}

module.exports = config;