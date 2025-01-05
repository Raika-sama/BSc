// src/scripts/testConnection.js
require('dotenv').config({ path: '.env.development' });
const connectDB = require('../config/database');
const logger = require('../utils/errors/logger/logger');

const testConnection = async () => {
    try {
        const conn = await connectDB();
        logger.info('Test di connessione completato con successo');
        process.exit(0);
    } catch (error) {
        logger.error('Test di connessione fallito:', error);
        process.exit(1);
    }
};

testConnection();