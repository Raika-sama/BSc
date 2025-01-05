// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { requestLogger, errorLogger } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const logger = require('./utils/errors/logger/logger');
const apiRoutes = require('./routes');

// Inizializza express
const app = express();

// Middleware di base
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Routes (da implementare)
app.use('/api/v1', apiRoutes);
// app.use('/api/schools', require('./routes/schoolRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/classes', require('./routes/classRoutes'));
// app.use('/api/students', require('./routes/studentRoutes'));
// app.use('/api/tests', require('./routes/testRoutes'));

// Gestione errori
app.use(errorLogger);
app.use(errorHandler);

// Gestione route non trovata
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route non trovata',
            code: 'ROUTE_NOT_FOUND'
        }
    });
});

// Avvio server
const startServer = async () => {
    try {
        // Connessione al database
        await connectDB();
        
        // Avvio server
        app.listen(config.server.port, () => {
            logger.info(`Server in esecuzione su ${config.server.host}:${config.server.port}`);
            logger.info(`Ambiente: ${config.env}`);
        });
    } catch (error) {
        logger.error('Errore durante l\'avvio del server:', error);
        process.exit(1);
    }
};

// Gestione errori non catturati
process.on('unhandledRejection', (err) => {
    logger.error('Errore non gestito:', err);
    process.exit(1);
});

// Avvia il server
startServer();

module.exports = app; // Per testing