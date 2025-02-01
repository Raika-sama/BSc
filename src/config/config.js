/**
 * @file config.js
 * @description Sistema centralizzato di configurazione dell'applicazione.
 * Gestisce il caricamento delle variabili d'ambiente e fornisce un'interfaccia
 * unificata per accedere alle configurazioni del sistema.
 */

const path = require('path');

// Determina il file .env appropriato in base all'ambiente
const envFile = process.env.NODE_ENV === 'test' 
    ? '.env.test'
    : `.env.${process.env.NODE_ENV || 'development'}`;

// Carica le variabili d'ambiente
require('dotenv').config({
    path: path.join(__dirname, `../../${envFile}`)
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
            dbName: process.env.NODE_ENV === 'test' 
                ? 'brainscanner_test' 
                : (process.env.DB_NAME || 'brainScannerDB')
        }
    },

    // Configurazione JWT aggiornata
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, // Fallback al JWT_SECRET se non configurato
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '1', 10),
        cookieOptions: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
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
        level: process.env.NODE_ENV === 'test' ? 'error' : (process.env.LOG_LEVEL || 'info'),
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
    'jwt.secret',
    'jwt.refreshSecret' // Aggiunto refresh token secret come requisito
];

/**
 * Funzione di validazione della configurazione
 * @param {Object} cfg - Oggetto di configurazione
 * @param {Array} keys - Array di chiavi richieste
 * @param {string} prefix - Prefisso per i messaggi di errore
 * @throws {Error} Se manca una configurazione richiesta
 */
const validateConfig = (cfg, keys, prefix = '') => {
    const missing = [];
    
    for (const key of keys) {
        const value = key.split('.').reduce((o, i) => o?.[i], cfg);
        if (!value) {
            missing.push(`${prefix}${key}`);
        }
    }
    
    if (missing.length > 0) {
        throw new Error(`Configurazione mancante: ${missing.join(', ')}`);
    }
};

// Esegue la validazione della configurazione
try {
    validateConfig(config, requiredKeys);
    
    // Log della configurazione JWT (senza esporre i segreti)
    console.log('JWT Configuration loaded:', {
        hasSecret: !!config.jwt.secret,
        hasRefreshSecret: !!config.jwt.refreshSecret,
        expiresIn: config.jwt.expiresIn,
        refreshExpiresIn: config.jwt.refreshExpiresIn
    });
} catch (error) {
    if (process.env.NODE_ENV === 'test') {
        console.warn('Warning: Missing configuration in test environment:', error.message);
    } else {
        console.error('Errore di configurazione:', error.message);
        process.exit(1);
    }
}

module.exports = config;