// src/database/migrations/initial-setup.js
require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const logger = require('../../utils/errors/logger/logger');
const config = require('../../config/config');

const runMigration = async () => {
    try {
        logger.info('Starting database migration...');
        logger.info(`Attempting to connect to MongoDB Atlas...`);
        
        // Connessione al database usando la configurazione dal tuo config.js
        await mongoose.connect(config.mongodb.uri, {
            ...config.mongodb.options,
            // Opzioni specifiche per Atlas
            retryWrites: true,
            w: 'majority'
        });
        
        logger.info('Successfully connected to MongoDB Atlas');

        // Creazione delle collezioni
        const collections = ['users', 'schools', 'classes'];
        
        for (const collection of collections) {
            try {
                await mongoose.connection.createCollection(collection);
                logger.info(`Created collection: ${collection}`);
            } catch (error) {
                // Se la collezione esiste già, lo logghiamo e continuiamo
                if (error.code === 48) {
                    logger.warn(`Collection ${collection} already exists`);
                } else {
                    throw error;
                }
            }
        }

        // Creazione degli indici
        try {
            await mongoose.connection.collection('users').createIndex(
                { email: 1 }, 
                { unique: true }
            );
            logger.info('Created index on users.email');
        } catch (error) {
            if (error.code === 85) {
                logger.warn('Index on users.email already exists');
            } else {
                throw error;
            }
        }

        try {
            await mongoose.connection.collection('schools').createIndex(
                { name: 1 }, 
                { unique: true }
            );
            logger.info('Created index on schools.name');
        } catch (error) {
            if (error.code === 85) {
                logger.warn('Index on schools.name already exists');
            } else {
                throw error;
            }
        }

        logger.info('Migration completed successfully');
    } catch (error) {
        logger.error('Migration failed:', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        await mongoose.connection.close();
        logger.info('Database connection closed');
    }
};

runMigration();