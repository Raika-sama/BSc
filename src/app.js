// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { requestLogger, errorLogger } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const logger = require('./utils/errors/logger/logger');
const routes = require('./routes');
const { publicRoutes: csiPublicRoutes, protectedRoutes: csiProtectedRoutes } = require('./engines/CSI/routes/csi.routes');

// Inizializza express
const app = express();

// Middleware di base - DEVONO VENIRE PRIMA DELLE ROUTES
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Debug middleware in development
if (config.env === 'development') {
    app.use((req, res, next) => {
        logger.debug('Incoming request:', {
            method: req.method,
            path: req.path,
            headers: {
                authorization: req.headers.authorization ? 'Present' : 'Not present',
                contentType: req.headers['content-type']
            },
            body: req.body
        });
        next();
    });
}

// Routes pubbliche CSI (devono venire prima delle routes protette)
app.use('/api/v1/tests/csi/public', csiPublicRoutes);

// Routes protette CSI
app.use('/api/v1/tests/csi', csiProtectedRoutes);

// Altre routes
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
        await connectDB();
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