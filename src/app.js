// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { requestLogger, errorLogger } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const logger = require('./utils/errors/logger/logger');
const routes = require('./routes');  // Importa il router principale

// Inizializza express
const app = express();

// Middleware di base
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Routes - Usa un unico punto di ingresso per tutte le route
app.use('/api/v1', routes);

// Gestione errori
app.use(errorLogger);
app.use(errorHandler);

// Gestione route non trovata
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        error: {
            message: 'Route non trovata',
            code: 'RES_001',
            metadata: {
                path: req.originalUrl
            }
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

module.exports = app;