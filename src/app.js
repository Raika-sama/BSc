// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { requestLogger, errorLogger } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const logger = require('./utils/errors/logger/logger');
const { setupCSIDependencies, createCSIController } = require('./engines/CSI/config/setupDependencies');
const createCSIRoutes = require('./engines/CSI/routes/csi.routes');
const createTestRouter = require('./routes/testRoutes');
const createQuestionRoutes = require('./engines/CSI/routes/csi.question.routes');


// Import Models
const User = require('./models/User');

// Import Repositories
const AuthRepository = require('./repositories/AuthRepository');
const UserRepository = require('./repositories/UserRepository');
const TestRepository = require('./repositories/TestRepository');
const ClassRepository = require('./repositories/ClassRepository');
const SchoolRepository = require('./repositories/SchoolRepository');
const StudentRepository = require('./repositories/StudentRepository');
const StudentBulkImportRepository = require('./repositories/StudentBulkImportRepository');

// Import Services
const SessionService = require('./services/SessionService');
const AuthService = require('./services/AuthService');
const UserService = require('./services/UserService');

// Import Controllers
const AuthController = require('./controllers/authController');
const CSIQuestionController = require('./engines/CSI/CSIQuestionController');
const UserController = require('./controllers/userController');
const SchoolController = require('./controllers/schoolController');
const ClassController = require('./controllers/classController');
const StudentController = require('./controllers/studentController');
const TestController = require('./controllers/testController');
const StudentBulkImportController = require('./controllers/studentBulkImportController');

// Import Routes
const routes = require('./routes');

// Import del middleware di auth
const createAuthMiddleware = require('./middleware/authMiddleware');

// Import del middleware per import massivo studenti
const BulkImportValidation = require('./middleware/bulkImportValidation');

// Inizializza express
const app = express();

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

// Inizializza Repositories
const authRepository = new AuthRepository(User);
const userRepository = new UserRepository(User);
const testRepository = new TestRepository(User);
const classRepository = new ClassRepository(User);
const schoolRepository = new SchoolRepository(User);
const studentRepository = new StudentRepository(User);
const studentBulkImportRepository = new StudentBulkImportRepository();

// Inizializza Services (ordine corretto per evitare dipendenze circolari)
const sessionService = new SessionService(userRepository);
const authService = new AuthService(authRepository, sessionService, userRepository);
const userService = new UserService(userRepository, authService, sessionService);

// Inizializza il middleware di autenticazione
const { protect, restrictTo, loginLimiter } = createAuthMiddleware(authService, sessionService);
const authMiddleware = { protect, restrictTo, loginLimiter };
const bulkImportValidation = new BulkImportValidation();

// Inizializza Controllers base
const authController = new AuthController(authService, userService, sessionService);
const userController = new UserController(userService, authService);
const schoolController = new SchoolController(schoolRepository, userService);
const classController = new ClassController(classRepository, schoolRepository, userService);
const studentController = new StudentController(studentRepository, classRepository, schoolRepository);
const testController = new TestController(testRepository, studentRepository, classRepository);
const studentBulkImportController = new StudentBulkImportController(
    studentBulkImportRepository,
    bulkImportValidation
);

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

// Inizializza le dipendenze CSI
logger.debug('Initializing CSI dependencies...');

// Setup iniziale CSI
const csiSetup = setupCSIDependencies();

// Inizializza CSIQuestionController con le sue dipendenze
const csiQuestionController = new CSIQuestionController(
    csiSetup.csiQuestionService // assicurati che questo venga restituito da setupCSIDependencies
);

// Verifica inizializzazione
logger.debug('CSIQuestionController initialization:', {
    hasController: !!csiQuestionController,
    controllerMethods: csiQuestionController ? Object.getOwnPropertyNames(Object.getPrototypeOf(csiQuestionController)) : []
});

// Crea il controller CSI con le dipendenze esterne
const { controller: csiController, dependencies: csiDependencies } = createCSIController({
    userService,
    testRepository,
    studentRepository,
    ...csiSetup // Includi le dipendenze base CSI
});

// Debug log per verificare l'inizializzazione del controller
logger.debug('CSI Controller initialization:', {
    hasController: !!csiController,
    controllerMethods: csiController ? Object.getOwnPropertyNames(Object.getPrototypeOf(csiController)) : []
});

// Crea oggetto con tutte le dipendenze
const dependencies = {
    // Controllers
    authController,
    userController,
    schoolController,
    classController,
    studentController,
    studentBulkImportController,
    testController,
    csiController,
    // CSI Dependencies
    ...csiDependencies,
    csiQuestionController,
    // Services
    authService,
    userService,
    sessionService,
    // Middleware
    authMiddleware,
    bulkImportValidation,
    // Repositories
    userRepository,
    classRepository,
    schoolRepository,
    studentRepository,
    studentBulkImportRepository,
    testRepository
};

// Verifica delle dipendenze prima delle routes
logger.debug('Dependencies check:', {
    hasAuthMiddleware: !!dependencies.authMiddleware,
    authMiddlewareMethods: dependencies.authMiddleware ? Object.keys(dependencies.authMiddleware) : [],
    hasProtect: !!dependencies.authMiddleware?.protect,
    hasRestrictTo: !!dependencies.authMiddleware?.restrictTo,
    hasLoginLimiter: !!dependencies.authMiddleware?.loginLimiter,
    hasCsiController: !!dependencies.csiController
});



// Verifica che sia tutto inizializzato correttamente
if (!csiController || !csiQuestionController) {
    throw new Error('CSI Controllers non inizializzati correttamente');
}

// Inizializza e monta le routes CSI
const csiRoutes = createCSIRoutes({
    authMiddleware,
    csiController
});

// Inizializza le routes delle domande CSI
const csiQuestionRoutes = createQuestionRoutes({
    authMiddleware,
    csiQuestionController  // passa il controller delle domande
});

if (!csiQuestionRoutes) {
    throw new Error('CSI Question Routes non inizializzate correttamente');
}

// Mount delle rotte CSI con logging
logger.debug('Mounting CSI routes...');

app.use('/api/v1/tests/csi', csiRoutes.publicRoutes);
app.use('/api/v1/tests/csi', csiRoutes.protectedRoutes);
app.use('/api/v1/tests/csi/questions', csiQuestionRoutes);

logger.debug('CSI routes mounted successfully');

// Monta le altre rotte dei test
const testRouter = createTestRouter({
    authMiddleware,
    testController
});

app.use('/api/v1/tests', testRouter);

// Altre routes con dipendenze iniettate
app.use('/api/v1', routes(dependencies));

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
        await connectDB();
        logger.info('Database connesso con successo');

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