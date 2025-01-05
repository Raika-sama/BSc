// src/config/database.js

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./config');

/**
 * Configurazione delle opzioni di connessione MongoDB
 * Include best practices per performance e sicurezza
 */
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,                 // Limite connessioni nel pool
    serverSelectionTimeoutMS: 5000,  // Timeout selezione server
    socketTimeoutMS: 45000,          // Timeout socket
    family: 4,                       // Forza IPv4
    retryWrites: true,              // Aggiunto per MongoDB Atlas
    w: 'majority',                  // Aggiunto per MongoDB Atlas
    connectTimeoutMS: 10000         // Aumentato per Atlas
};

/**
 * Gestione eventi di connessione MongoDB
 * @param {string} uri - URI di connessione MongoDB
 * @returns {Promise} Promise di connessione
 */
const connectDB = async (uri = config.mongodb.uri) => {
    try {
        // Sostituisci la password nell'URI
        const connectionString = uri.replace(
            '<password>',
            process.env.MONGODB_PASSWORD || 'H9Fm51BisUke4rPK'
        );

        // Connessione al database
        const conn = await mongoose.connect(connectionString, {
            ...mongooseOptions,
            dbName: config.mongodb.options.dbName
        });
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Gestione eventi di connessione
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose connected to MongoDB Atlas');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose connection disconnected');
        });

        // Gestione shutdown graceful
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('Mongoose connection closed through app termination');
                process.exit(0);
            } catch (err) {
                logger.error('Error during Mongoose disconnection:', err);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        logger.error('Error connecting to MongoDB Atlas:', error);
        // Implementa logica di retry se necessario
        if (!process.env.JEST_WORKER_ID) { // Non uscire se in modalità test
            process.exit(1);
        }
        throw error;
    }
};

/**
 * Funzione per verificare lo stato della connessione
 * @returns {boolean} Stato della connessione
 */
const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Funzione per chiudere la connessione
 * Utile per testing e shutdown controllato
 */
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        throw error;
    }
};

module.exports = {
    connectDB,
    isConnected,
    closeConnection,
    mongooseOptions // Esportato per testing
};