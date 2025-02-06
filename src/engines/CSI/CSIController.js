// src/engines/CSI/CSIController.js

const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');

class CSIController {
    constructor(dependencies) {
        logger.debug('CSIController constructor called with dependencies:', {
            hasDependencies: !!dependencies,
            dependencyKeys: dependencies ? Object.keys(dependencies) : []
        });
        const { 
            testEngine,
            csiQuestionService,
            userService,
            csiConfig,
            validator,
            repository  // Aggiungiamo questa dipendenza!
        } = dependencies;

        logger.debug('Dependencies extracted:', {
            hasTestEngine: !!testEngine,
            hasQuestionService: !!csiQuestionService,
            hasRepository: !!repository,
            repositoryType: repository ? repository.constructor.name : 'undefined'
        });

        if (!testEngine || !csiQuestionService || !repository) {
            throw new Error('Required dependencies missing');
        }

        if (!csiQuestionService) {
            throw new Error('csiQuestionService is required');
        }
        
        this.engine = testEngine;       // Rinominato per chiarezza
        this.questionService = csiQuestionService;
        this.userService = userService;
        this.configModel = require('./models/CSIConfig');
        this.validator = validator;
        this.repository = repository;  // Salviamo il repository!


        logger.debug('CSIController initialized, repository methods:', {
            repositoryMethods: repository ? Object.getOwnPropertyNames(Object.getPrototypeOf(repository)) : []
        });
    }

    /**
     * Verifica token test CSI
     */
    verifyTestToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Verifying CSI token and searching test:', { 
                token: token.substring(0, 10) + '...'
            });
    
            // Cerca il test
            const test = await this.repository.findByToken(token);
            
            logger.debug('Test found:', {
                found: !!test,
                testId: test?._id,
                testToken: test?.token,
                expiresAt: test?.expiresAt,
                isExpired: test?.expiresAt < new Date()
            });
    
            if (!test) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o test non trovato'
                );
            }
    
            if (test.expiresAt < new Date()) {
                throw createError(
                    ErrorTypes.VALIDATION.EXPIRED_TOKEN,
                    'Il token è scaduto'
                );
            }
    
            if (test.completato) {
                throw createError(
                    ErrorTypes.VALIDATION.TEST_COMPLETED,
                    'Il test è già stato completato'
                );
            }
    
            // Carica le domande
            const questions = await this.questionService.getTestQuestions();
            
            // Carica la configurazione
            const config = await this.configModel.findOne({ active: true });
    
            res.status(200).json({
                status: 'success',
                data: {
                    valid: true,
                    test: {
                        id: test._id,
                        studentId: test.studentId,
                        risposte: test.risposte.length,
                        config: test.config
                    },
                    questions,
                    config
                }
            });
    
        } catch (error) {
            logger.error('Error verifying CSI token:', {
                error: error.message,
                token: token.substring(0, 10) + '...'
            });
            
            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'VERIFY_TOKEN_ERROR'
                }
            });
        }
    };

    /**
     * Inizia test CSI con token
     */
    startTestWithToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Starting CSI test with token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
    
            // Marca il token come usato
            const result = await this.repository.markTokenAsUsed(token);
            
            // Carica domande
            const questions = await this.questionService.getTestQuestions();
            
            // Carica configurazione attiva
            const config = await this.configModel.findOne({ active: true });
    
            if (!config) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna configurazione CSI attiva trovata'
                );
            }
    
            res.json({
                status: 'success',
                data: {
                    questions: questions,
                    config: config,
                    testId: result._id
                }
            });
        } catch (error) {
            logger.error('Error starting CSI test:', {
                error: error.message,
                token: token.substring(0, 10) + '...'
            });
            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'START_TEST_ERROR'
                }
            });
        }
    };

    async initializeCSITest(studentId) {
        try {
            logger.debug('Initializing CSI test for student:', { studentId });
    
            // 1. Recupera configurazione attiva
            const config = await this.configModel.getActiveConfig();
            if (!config) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna configurazione CSI attiva trovata'
                );
            }
    
            // 2. Imposta i dati del test con il tipo corretto
            const testData = {
                studentId,
                tipo: 'CSI',  // Questo è il campo richiesto
                config: {
                    timeLimit: config.validazione.tempoMassimoDomanda,
                    minQuestions: config.validazione.numeroMinimoDomande,
                    instructions: config.interfaccia.istruzioni,
                    showProgress: config.interfaccia.mostraProgressBar,
                    allowBack: config.interfaccia.permettiTornaIndietro
                }
            };
    
            // 3. Genera token tramite TestRepository
            const tokenData = await this.repository.saveTestToken(testData);
    
            logger.info('CSI test initialized:', {
                studentId,
                tokenId: tokenData._id,
                expiresAt: tokenData.expiresAt
            });
    
            return {
                token: tokenData.token,
                expiresAt: tokenData.expiresAt,
                config: testData.config
            };
    
        } catch (error) {
            logger.error('Error initializing CSI test:', {
                error: error.message,
                studentId
            });
            throw error;
        }
    }

    /**
     * Processa risposta test CSI
     */
    submitAnswer = async (req, res) => {
        const { token } = req.params;
        const { questionId, value, timeSpent, categoria, timestamp } = req.body;
    
        try {
            logger.debug('Submitting answer:', { 
                token: token.substring(0, 10) + '...',
                questionId, 
                value 
            });
    
            // Usa il metodo addAnswer del repository invece di updateByToken
            const result = await this.repository.addAnswer(token, {
                questionId,
                value,
                timeSpent,
                categoria,
                timestamp: timestamp || new Date()
            });
    
            if (!result) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato'
                );
            }
    
            // Calcola il progresso
            const progress = {
                answered: result.risposte.length,
                currentQuestion: result.risposte.length,
                total: result.test.domande.length,
                isComplete: result.risposte.length === result.test.domande.length
            };
    
            logger.debug('Answer submitted successfully:', { progress });
    
            res.json({
                status: 'success',
                data: progress
            });
    
        } catch (error) {
            logger.error('Error submitting answer:', {
                error: error.message,
                token: token.substring(0, 10) + '...'
            });
            
            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message || 'Errore durante il salvataggio della risposta',
                    code: error.code || 'SUBMIT_ANSWER_ERROR'
                }
            });
        }
    };

    /**
     * Completa test CSI
     */
    completeTest = async (req, res) => {
        const { token } = req.params;
    
        try {
            // 1. Verifica token e recupera risultato
            const result = await this.repository.findByToken(token);
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido'
                );
            }
    
            // 2. Verifica che tutte le domande siano state risposte
            const config = await this.configModel.findOne({ active: true });
            if (result.risposte.length < config.validazione.numeroMinimoDomande) {
                throw createError(
                    ErrorTypes.VALIDATION.INCOMPLETE_TEST,
                    'Numero di risposte insufficiente'
                );
            }
    
            // 3. Calcola risultati usando CSIScorer
            const scorer = new CSIScorer();
            const testResults = scorer.calculateTestResult(result.risposte);
    
            // 4. Aggiorna il risultato con i punteggi e metadata
            const completedResult = await this.repository.update(token, {
                completato: true,
                dataCompletamento: new Date(),
                punteggiDimensioni: testResults.punteggiDimensioni,
                metadataCSI: {
                    ...testResults.metadataCSI,
                    pattern: scorer.analyzeResponsePattern(result.risposte)
                },
                analytics: {
                    tempoTotale: this._calculateTotalTime(result.risposte),
                    domandePerse: this._calculateMissedQuestions(result),
                    pattern: scorer._calculateTimePattern(result.risposte)
                }
            });
    
            // 5. Notifica completamento se necessario
            if (this.userService) {
                await this.userService.notifyTestComplete(completedResult.studentId, 'CSI');
            }
    
            res.json({
                status: 'success',
                data: {
                    testCompleted: true,
                    resultId: completedResult._id,
                    scores: testResults.punteggiDimensioni,
                    analytics: completedResult.analytics
                }
            });
        } catch (error) {
            logger.error('Error completing CSI test:', {
                error: error.message,
                token: token.substring(0, 10) + '...'
            });
            res.status(error.statusCode || 400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'COMPLETE_TEST_ERROR'
                }
            });
        }
    };
    
    // Metodi di utility
    _calculateTotalTime(risposte) {
        return risposte.reduce((total, r) => total + (r.tempoRisposta || 0), 0);
    }
    
    _calculateMissedQuestions(result) {
        return result.test.domande.length - result.risposte.length;
    }

/**
 * Genera link per test CSI
 */
generateTestLink = async (req, res) => {
    try {
        const { studentId } = req.body;
        
        logger.debug('Generating CSI test link:', { 
            studentId,
            hasRepository: !!this.repository,
            repositoryType: this.repository ? this.repository.constructor.name : 'undefined'
        });

        if (!this.repository) {
            throw new Error('Repository not initialized in CSIController');
        }

        // Verifica disponibilità
        const availability = await this.repository.checkAvailability(studentId);
        if (!availability.available) {
            throw createError(
                ErrorTypes.VALIDATION.NOT_ALLOWED,
                'Test CSI non disponibile al momento',
                {
                    nextAvailableDate: availability.nextAvailableDate,
                    lastTestDate: availability.lastTestDate
                }
            );
        }

        // Inizializza il test
        const testInit = await this.initializeCSITest(studentId);

        // Costruisci l'URL del test
        const testUrl = `${process.env.FRONTEND_URL}/test/csi/${testInit.token}`;

        res.json({
            status: 'success',
            data: {
                token: testInit.token,
                url: testUrl,
                expiresAt: testInit.expiresAt,
                config: testInit.config
            }
        });

    } catch (error) {
        logger.error('Error generating CSI test link:', {
            error: error.message,
            errorStack: error.stack,
            studentId: req.body.studentId,
            controllerState: {
                hasRepository: !!this.repository
            }
        });
        
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'GENERATE_LINK_ERROR',
                details: error.details || {}
            }
        });
    }
};

/**
 * Recupera la configurazione attiva
 */
async getActiveConfiguration() {
    try {
        logger.debug('Getting active CSI configuration');
        
        const config = await this.configModel.findOne({ active: true });
        
        if (!config) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Nessuna configurazione CSI attiva trovata'
            );
        }

        return config;
    } catch (error) {
        logger.error('Error getting configuration:', {
            error: error.message
        });
        throw error;
    }
}
    // Aggiungiamo questi metodi

getConfiguration = async (req, res) => {
        try {
            logger.debug('Getting CSI configuration');
            
            // Usiamo il modello direttamente
            let config = await this.configModel.findOne({ active: true });
            
            if (!config) {
                // Se non esiste una configurazione, ne creiamo una di default
                logger.debug('No active configuration found, creating default');
                const defaultConfig = new this.configModel({
                    version: '1.0.0',
                    active: true,
                    scoring: {
                        tempoLimite: 30,
                        tentativiMax: 1,
                        cooldownPeriod: 168,
                    },
                    validazione: {
                        tempoMinimoDomanda: 2000,
                        tempoMassimoDomanda: 300000,
                        numeroMinimoDomande: 20,
                        sogliaRisposteVeloci: 5
                    },
                    interfaccia: {
                        randomizzaDomande: true,
                        mostraProgressBar: true,
                        permettiTornaIndietro: false,
                        mostraRisultatiImmediati: false,
                        istruzioni: 'Rispondi alle seguenti domande selezionando un valore da 1 a 5'
                    }
                });
                config = await defaultConfig.save();
            }
            
            res.json({
                status: 'success',
                data: config
            });
        } catch (error) {
            logger.error('Error getting CSI configuration:', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(500).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'GET_CONFIG_ERROR'
                }
            });
        }
    };
    
    updateConfiguration = async (req, res) => {
        try {
            logger.debug('Updating CSI configuration');
            
            const configData = req.body;
            // Usiamo il modello direttamente
            const updatedConfig = await this.configModel.findOneAndUpdate(
                { active: true },
                configData,
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            
            res.json({
                status: 'success',
                data: updatedConfig
            });
        } catch (error) {
            logger.error('Error updating CSI configuration:', {
                error: error.message,
                data: req.body
            });
            
            res.status(error.statusCode || 400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'UPDATE_CONFIG_ERROR'
                }
            });
        }
    };

}

module.exports = CSIController;