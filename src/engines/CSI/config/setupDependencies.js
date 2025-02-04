// src/engines/CSI/config/setupDependencies.js

const TestRepository = require('../../../repositories/TestRepository');
const CSIRepository = require('../CSIRepository');
const StudentRepository = require('../../../repositories/StudentRepository');
const UserService = require('../../../services/UserService');
const CSIQuestionService = require('../CSIQuestionService');
const CSIQuestionRepository = require('../CSIQuestionRepository');
const CSIConfig = require('../models/CSIConfig');
const CSIScorer = require('../engine/CSIScorer');
const CSIEngine = require('../engine/CSIEngine');
const CSIController = require('../CSIController');

const setupCSIDependencies = () => {
    // Inizializza configurazione
    const csiConfig = new CSIConfig();

    // Inizializza repositories
    const testRepository = new TestRepository();
    const csiRepository = new CSIRepository();
    const studentRepository = new StudentRepository();
    const csiQuestionRepository = new CSIQuestionRepository();
    
    // Inizializza scorer
    const csiScorer = new CSIScorer(csiConfig);
    
    // Inizializza services
    const userService = new UserService();
    const csiQuestionService = new CSIQuestionService(csiQuestionRepository);

    // Inizializza engine
    const csiEngine = new CSIEngine({
        Test: testRepository,     // Per compatibilità con BaseEngine
        Result: csiRepository,    // Per compatibilità con BaseEngine
        scorer: csiScorer,
        config: csiConfig,
        repository: csiRepository,
        questionService: csiQuestionService
    });

        // Inizializza controller
        const csiController = new CSIController({
            testEngine: csiEngine,
            csiQuestionService,
            userService,
            csiConfig
        });

    return {
        //controller Principale
        csiController,
        // Core components
        csiEngine,
        csiConfig,
        csiScorer,
        
        // Services
        userService,
        csiQuestionService,
        
        // Repositories (se necessari per altri componenti)
        testRepository,
        csiRepository,
        studentRepository,
        csiQuestionRepository
    };
};

// Funzione di utility per creare il controller
const createCSIController = (dependencies = {}) => {
    const deps = setupCSIDependencies();
    
    return {
        controller: new CSIController({
            testEngine: deps.csiEngine,
            csiQuestionService: deps.csiQuestionService,
            userService: deps.userService,
            csiConfig: deps.csiConfig
        }),
        dependencies: deps
    };
};

module.exports = {
    setupCSIDependencies,
    createCSIController: (customDeps = {}) => {
        const deps = setupCSIDependencies();
        return {
            ...deps,
            ...customDeps
        };
    }
};