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
const initializeCSIConfig = async () => {
    try {
        // Cerca prima una configurazione attiva
        let config = await CSIConfig.findOne({ active: true });
        
        if (!config) {
            // Creiamo una configurazione di default completa
            const defaultConfig = {
                version: '1.0.0',
                active: true,
                scoring: {
                    categorie: [
                        {
                            nome: 'Elaborazione',
                            pesoDefault: 1,
                            min: 1,
                            max: 5,
                            interpretazioni: []
                        },
                        {
                            nome: 'Creatività',
                            pesoDefault: 1,
                            min: 1,
                            max: 5,
                            interpretazioni: []
                        },
                        {
                            nome: 'Preferenza Visiva',
                            pesoDefault: 1,
                            min: 1,
                            max: 5,
                            interpretazioni: []
                        },
                        {
                            nome: 'Decisione',
                            pesoDefault: 1,
                            min: 1,
                            max: 5,
                            interpretazioni: []
                        },
                        {
                            nome: 'Autonomia',
                            pesoDefault: 1,
                            min: 1,
                            max: 5,
                            interpretazioni: []
                        }
                    ],
                    algoritmo: {
                        version: '1.0.0',
                        parametri: new Map([
                            ['pesoTempoRisposta', 0.3],
                            ['sogliaConsistenza', 0.7]
                        ])
                    }
                },
                validazione: {
                    tempoMinimoDomanda: 2000,
                    tempoMassimoDomanda: 300000,
                    numeroMinimoDomande: 20,
                    sogliaRisposteVeloci: 5
                },
                interfaccia: {
                    istruzioni: 'Rispondi alle seguenti domande selezionando un valore da 1 a 5',
                    mostraProgressBar: true,
                    permettiTornaIndietro: false
                }
            };

            config = await CSIConfig.create(defaultConfig);
            logger.info('Created default CSI configuration:', { configId: config._id });
        }

        return config;
    } catch (error) {
        logger.error('Error initializing CSI config:', { error: error.message });
        throw new Error('CSI Config initialization failed');
    }
};


const setupCSIDependencies = () => {
    try {
        logger.debug('Initializing CSI dependencies...');

        // Inizializza configurazione
        const csiConfig = initializeCSIConfig();

        // Inizializza validator
        const validator = CSIQuestionValidator;

        // Inizializza repositories con validator
        const testRepository = new TestRepository();
        const csiRepository = new CSIRepository();
        const studentRepository = new StudentRepository();
        const csiQuestionRepository = new CSIQuestionRepository(CSIQuestion, validator); // CORRETTO
        
          
        logger.debug('Repositories initialized:', {
            hasTestRepository: !!testRepository,
            hasCsiRepository: !!csiRepository
        });

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

        logger.debug('Creating CSI repository...', {
            repositoryMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(csiRepository))
        });

        logger.debug('Creating CSI controller with dependencies...', {
            hasEngine: !!csiEngine,
            hasRepository: !!csiRepository,
            hasQuestionService: !!csiQuestionService
        });


        // Inizializza controller con tutte le dipendenze
        const csiController = new CSIController({
            repository: csiRepository, // Passa il repository corretto
            testEngine: csiEngine,
            csiQuestionService,
            userService,
            csiConfig,
            validator
        });

  logger.debug('CSI controller initialized:', {
            hasController: !!csiController,
            hasRepository: !!csiController.repository,
            repositoryType: csiController.repository?.constructor?.name
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
        logger.error('Error in setupCSIDependencies:', { 
            error: error.message,
            stack: error.stack 
        });
        throw new Error('CSI Dependencies initialization failed');
    }
};

const createCSIController = async (externalDeps = {}) => {
    try {
        // Inizializza le dipendenze di base
        const csiConfig = await initializeCSIConfig();
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
            validator,
            repository: csiRepository
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