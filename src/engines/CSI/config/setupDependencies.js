// src/engines/CSI/config/setupDependencies.js
const CSIQuestion = require('../models/CSIQuestion'); // Aggiungi questo import
const TestRepository = require('../../../repositories/TestRepository');
const CSIRepository = require('../CSIRepository');
const StudentRepository = require('../../../repositories/StudentRepository');
const UserService = require('../../../services/UserService');
const CSIQuestionService = require('../CSIQuestionService');
const CSIQuestionRepository = require('../CSIQuestionRepository');
const CSIQuestionValidator = require('../utils/CSIQuestionValidator');
const CSIConfig = require('../models/CSIConfig');
const CSIScorer = require('../engine/CSIScorer');
const CSIEngine = require('../engine/CSIEngine');
const CSIController = require('../CSIController');
const logger = require('../../../utils/errors/logger/logger');

/**
 * Inizializza la configurazione CSI
 * @private
 */
const initializeCSIConfig = () => {
    try {
        // Creiamo una configurazione di default
        const defaultConfig = {
            version: '1.0.0',
            active: true,
            scoring: {
                categorie: [
                    {
                        nome: 'Elaborazione',
                        pesoDefault: 1,
                        min: 1,
                        max: 5
                    },
                    // ... altre categorie
                ]
            }
        };

        return new CSIConfig(defaultConfig);
    } catch (error) {
        logger.error('Error initializing CSI config:', { error: error.message });
        throw new Error('CSI Config initialization failed');
    }
};

const setupCSIDependencies = () => {
    try {
        // Inizializza configurazione
        const csiConfig = initializeCSIConfig();

        // Inizializza validator
        const validator = CSIQuestionValidator;

        // Inizializza repositories con validator
        const testRepository = new TestRepository();
        const csiRepository = new CSIRepository();
        const studentRepository = new StudentRepository();
        const csiQuestionRepository = new CSIQuestionRepository(CSIQuestion, validator); // CORRETTO
        
        // Inizializza scorer con config
        const csiScorer = new CSIScorer(csiConfig);
        
        // Inizializza services con validator
        const userService = new UserService();
        const csiQuestionService = new CSIQuestionService(csiQuestionRepository, validator);

        // Inizializza engine con tutte le dipendenze
        const csiEngine = new CSIEngine({
            Test: testRepository,
            Result: csiRepository,
            scorer: csiScorer,
            config: csiConfig,
            repository: csiRepository,
            questionService: csiQuestionService,
            validator
        });

        // Inizializza controller con tutte le dipendenze
        const csiController = new CSIController({
            testEngine: csiEngine,
            csiQuestionService,
            userService,
            csiConfig,
            validator
        });

        if (!csiController) {
            throw new Error('CSI Controller initialization failed');
        }

        return {
            csiController,
            csiEngine,
            csiConfig,
            csiScorer,
            validator,
            userService,
            csiQuestionService,
            testRepository,
            csiRepository,
            studentRepository,
            csiQuestionRepository
        };
    } catch (error) {
        logger.error('Error in setupCSIDependencies:', { error: error.message });
        throw new Error('CSI Dependencies initialization failed');
    }
};

const createCSIController = (externalDeps = {}) => {
    try {
        // Inizializza le dipendenze di base
        const csiConfig = initializeCSIConfig();
        const validator = CSIQuestionValidator;
        const csiRepository = new CSIRepository();
        const csiQuestionRepository = new CSIQuestionRepository(CSIQuestion, validator); // CORRETTO
        const csiQuestionService = new CSIQuestionService(csiQuestionRepository, validator);
        const csiScorer = new CSIScorer(csiConfig);

        // Crea l'engine con le dipendenze aggiornate
        const csiEngine = new CSIEngine({
            Test: externalDeps.testRepository || new TestRepository(),
            Result: csiRepository,
            scorer: csiScorer,
            config: csiConfig,
            repository: csiRepository,
            questionService: csiQuestionService,
            validator
        });

        // Crea il controller con tutte le dipendenze necessarie
        const controller = new CSIController({
            testEngine: csiEngine,
            csiQuestionService,
            userService: externalDeps.userService,
            csiConfig,
            validator
        });

        if (!controller) {
            throw new Error('Controller initialization failed');
        }

        return {
            controller,
            dependencies: {
                csiEngine,
                csiConfig,
                csiScorer,
                validator,
                csiQuestionService,
                csiRepository,
                csiQuestionRepository
            }
        };
    } catch (error) {
        logger.error('Error creating CSI controller:', { error: error.message });
        throw new Error('CSI Controller creation failed');
    }
};

module.exports = {
    setupCSIDependencies,
    createCSIController
};