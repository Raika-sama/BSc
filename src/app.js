// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose'); // Aggiungi questo import
const { connectDB } = require('./config/database');
const { requestLogger, errorLogger } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');
const logger = require('./utils/errors/logger/logger');
const { setupCSIDependencies, createCSIController } = require('./engines/CSI/config/setupDependencies');
const createCSIRoutes = require('./engines/CSI/routes/csi.routes');
const createTestRouter = require('./routes/testRoutes');
const createQuestionRoutes = require('./engines/CSI/routes/csi.question.routes');
const YearTransitionController = require('./controllers/yearTransitionController');
const testSystemController = require('./controllers/testSystemController'); // Importo il controller per i test di sistema
const createStudentAuthRouter = require('./routes/studentAuthRoutes'); // Added import statement
const repositories = require('./repositories');

// Importa e registra i modelli CSI
let models;

// Funzione per verificare la registrazione dei modelli
const ensureModelsRegistered = () => {
    const models = mongoose.modelNames();
    logger.debug('Registered mongoose models:', { models });
    
    const requiredModels = ['CSIConfig', 'CSIQuestion', 'Result', 'Test'];
    const missingModels = requiredModels.filter(model => !models.includes(model));
    
    if (missingModels.length > 0) {
        throw new Error(`Missing required models: ${missingModels.join(', ')}`);
    }
};

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
const StudentAuthRepository = require('./repositories/StudentAuthRepository');

// Import Services
const SessionService = require('./services/SessionService');
const AuthService = require('./services/AuthService');
const UserService = require('./services/UserService');
const StudentAuthService = require('./services/StudentAuthService'); // Import the singleton service
const PermissionService = require('./services/PermissionService');

// Import Controllers
const AuthController = require('./controllers/authController');
const CSIQuestionController = require('./engines/CSI/CSIQuestionController');
const UserController = require('./controllers/userController');
const SchoolController = require('./controllers/schoolController');
const ClassController = require('./controllers/classController');
const StudentController = require('./controllers/studentController');
const TestController = require('./controllers/testController');
const StudentBulkImportController = require('./controllers/studentBulkImportController');
const StudentAuthController = require('./controllers/StudentAuthController'); // Already instantiated singleton

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

// Aggiungi middleware per iniettare i repositories in ogni richiesta
app.use((req, res, next) => {
    // Aggiungi tutti i repository alla richiesta
    req.repositories = repositories;
    
    // Per compatibilità, aggiungi anche i singoli repository
    req.userRepository = repositories.userRepository;
    req.schoolRepository = repositories.schoolRepository;
    req.classRepository = repositories.classRepository;
    req.studentRepository = repositories.studentRepository;
    req.testRepository = repositories.testRepository;
    req.studentAuthRepository = repositories.studentAuthRepository;
    
    next();
});

// Inizializza Repositories
const authRepository = new AuthRepository(User);
const userRepository = new UserRepository(User);
const testRepository = new TestRepository(User);
const classRepository = new ClassRepository(User);
const schoolRepository = new SchoolRepository(User);
const studentRepository = new StudentRepository(User);
const studentBulkImportRepository = new StudentBulkImportRepository();
const studentAuthRepository = new StudentAuthRepository(mongoose.model('StudentAuth'));

// Inizializza Services (ordine corretto per evitare dipendenze circolari)
const sessionService = new SessionService(userRepository);
const authService = new AuthService(authRepository, sessionService, userRepository);
const permissionService = new PermissionService(userRepository);
const userService = new UserService(userRepository, authService, sessionService, permissionService);

// StudentAuthService è già esportato come singleton istanziato, lo usiamo direttamente
// Non va inizializzato con new
const studentAuthService = StudentAuthService; // Add this line to define studentAuthService
studentRepository.setStudentAuthService(StudentAuthService);

// Inizializza il middleware di autenticazione
const { 
    protect, 
    restrictTo, 
    loginLimiter, 
    protectStudent, 
    hasPermission, 
    hasTestAccess, 
    requireAdminAccess, 
    blacklistToken 
 } = createAuthMiddleware(
    authService, 
    sessionService,
    permissionService,
    StudentAuthService
    
);
const authMiddleware = { 
    protect, 
    restrictTo, 
    loginLimiter, 
    protectStudent, 
    hasPermission, 
    hasTestAccess, 
    requireAdminAccess, 
    blacklistToken 
};
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
// StudentAuthController is already instantiated as singleton, no need to create new instance

// Setup Student Auth Router with proper dependencies
const studentAuthRouter = createStudentAuthRouter({
    authMiddleware,
    studentAuthController: StudentAuthController // Use directly, already instantiated
});

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

// Funzione di inizializzazione delle dipendenze CSI
const initializeCSIDependencies = async () => {
    try {
        logger.debug('Initializing CSI dependencies...');
        
        const result = await createCSIController({
            userService,
            testRepository,
            studentRepository
        });
        
        const csiController = result.controller;
        const csiDependencies = result.dependencies;

        if (!csiController?.engine) {
            throw new Error('CSI Controller engine not initialized correctly');
        }

        // Inizializza CSIQuestionController
        const csiQuestionController = new CSIQuestionController(
            csiDependencies.csiQuestionService
        );

        logger.debug('CSI Dependencies initialized:', {
            hasController: !!csiController,
            hasScorer: !!csiDependencies.csiScorer,
            scorerVersion: csiDependencies.csiScorer?.version
        });

        // Inizializza e monta le routes CSI
        const csiRoutes = createCSIRoutes({
            authMiddleware,
            csiController
        });

        // Inizializza le routes delle domande CSI
        const csiQuestionRoutes = createQuestionRoutes({
            authMiddleware,
            csiQuestionController
        });

        if (!csiQuestionRoutes) {
            throw new Error('CSI Question Routes non inizializzate correttamente');
        }

        // Mount delle rotte CSI
        logger.debug('Mounting CSI routes...');
        app.use('/api/v1/tests/csi', csiRoutes.publicRoutes);
        app.use('/api/v1/tests/csi', csiRoutes.protectedRoutes);
        app.use('/api/v1/tests/csi/questions', csiQuestionRoutes);
        logger.debug('CSI routes mounted successfully');

        return {
            csiController,
            csiQuestionController,
            csiDependencies,
            csiScorer: csiDependencies.csiScorer  // Lo esportiamo esplicitamente
        };
    } catch (error) {
        logger.error('Failed to initialize CSI dependencies:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Gestione connessione DB e avvio server
const startServer = async () => {
    try {
        // Connetti al database
        await connectDB();
        logger.info('Database connesso con successo');

        // Carica i modelli solo dopo che la connessione è stata stabilita
        models = require('./models');

        // Verifica che i modelli siano registrati
        ensureModelsRegistered();
        logger.info('Tutti i modelli richiesti sono registrati correttamente');

        // Inizializza le dipendenze CSI
        const { csiController, csiQuestionController, csiDependencies } = 
            await initializeCSIDependencies();
        // Crea oggetto con tutte le dipendenze
        const dependencies = {
            // Controllers
            authController,
            userController,
            schoolController,
            classController,
            studentController,
            studentAuthController: StudentAuthController, // Changed: use the singleton instance directly
            studentBulkImportController,
            testController,
            csiController,
            yearTransitionController: YearTransitionController,
            testSystemController, // Aggiungo il controller per i test di sistema
            // CSI Dependencies
            ...csiDependencies,
            csiScorer: csiDependencies.csiScorer,  // Lo aggiungiamo esplicitamente
            csiQuestionController,
            // Services
            authService,
            userService,
            sessionService,
            studentAuthService,     // aggiungi qui
            permissionService,
            // Middleware
            authMiddleware,
            bulkImportValidation,
            // Repositories
            userRepository,
            classRepository,
            schoolRepository,
            studentRepository,
            studentBulkImportRepository,
            studentAuthRepository,  // aggiungi qui
            testRepository
        };

        // Verifica delle dipendenze prima delle routes
        logger.debug('Dependencies check:', {
            hasAuthMiddleware: !!dependencies.authMiddleware,
            authMiddlewareMethods: dependencies.authMiddleware ? Object.keys(dependencies.authMiddleware) : [],
            hasProtect: !!dependencies.authMiddleware?.protect,
            hasRestrictTo: !!dependencies.authMiddleware?.restrictTo,
            hasLoginLimiter: !!dependencies.authMiddleware?.loginLimiter,
            hasCsiController: !!dependencies.csiController,
            hasStudentAuthController: !!dependencies.studentAuthController,
            hasStudentAuthService: !!dependencies.studentAuthService,
            hasPermission: !!dependencies.authMiddleware?.hasPermission,  // Aggiungi questo
    hasPermissionService: !!dependencies.permissionService,       // Aggiungi questo
            hasProtectStudent: !!dependencies.authMiddleware?.protectStudent
        });

        // Monta le altre rotte dei test
        const testRouter = createTestRouter({
            authMiddleware,
            testController
        });

        app.use((req, res, next) => {
            logger.debug('Registered mongoose models:', {
                models: mongoose.modelNames(),
                hasCSIQuestion: !!mongoose.models.CSIQuestion,
                hasTest: !!mongoose.models.Test
            });
            next();
        });

        app.use('/api/v1/tests', testRouter);

        // Altre routes con dipendenze iniettate
        app.use('/api/v1/student-auth', studentAuthRouter);
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

        // Avvia il server
        app.listen(config.server.port, () => {
            logger.info(`Server in esecuzione su ${config.server.host}:${config.server.port}`);
            logger.info(`Ambiente: ${config.env}`);
        });
    } catch (error) {
        logger.error('Errore durante l\'avvio del server:', {
            error: error.message,
            stack: error.stack
        });
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