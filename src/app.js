// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { requestLogger, errorLogger } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const logger = require('./utils/errors/logger/logger');

// Import Models
const User = require('./models/User');

// Import Repositories
const AuthRepository = require('./repositories/authRepository');

// Import Services
const AuthService = require('./services/AuthService');
const SessionService = require('./services/SessionService');
const UserService = require('./services/UserService');

// Import Controllers
const AuthController = require('./controllers/authController');

// Import Routes
const routes = require('./routes');
const { publicRoutes: csiPublicRoutes, protectedRoutes: csiProtectedRoutes } = require('./engines/CSI/routes/csi.routes');

// Inizializza express
const app = express();

// Inizializza Repositories
const authRepository = new AuthRepository(User);

// Inizializza Services
const sessionService = new SessionService(User);
const userService = new UserService(User);
const authService = new AuthService(authRepository, sessionService);

// Inizializza Controllers
const authController = new AuthController(authService, userService, sessionService);

// Middleware di base - DEVONO VENIRE PRIMA DELLE ROUTES
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aggiungi cookie parser se usi i cookie per i token
const cookieParser = require('cookie-parser');
app.use(cookieParser());

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

// Passa le istanze inizializzate alle routes
const initializeRoutes = (dependencies) => {
    // Routes pubbliche CSI (devono venire prima delle routes protette)
    app.use('/api/v1/tests/csi/public', csiPublicRoutes);

    // Routes protette CSI
    app.use('/api/v1/tests/csi', csiProtectedRoutes);

    // Altre routes con dipendenze iniettate
    app.use('/api/v1', routes(dependencies));
};

// Inizializza le routes con le dipendenze
initializeRoutes({
    authController,
    authService,
    userService,
    sessionService
});



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

// Gestione connessione DB e avvio server
const startServer = async () => {
    try {
        // Connessione al database
        await connectDB();
        logger.info('Database connesso con successo');

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

// Gestione interruzione processo
process.on('SIGTERM', () => {
    logger.info('SIGTERM ricevuto. Chiusura del server...');
    process.exit(0);
});

// Avvia il server
startServer();

module.exports = app;