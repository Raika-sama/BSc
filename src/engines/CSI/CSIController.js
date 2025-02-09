// src/engines/CSI/CSIController.js

const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const CSIScorer = require('./engine/CSIScorer');  // Aggiungiamo questo import
const mongoose = require('mongoose');

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
            repository,
            scorer
        } = dependencies;

        logger.debug('Dependencies extracted:', {
            hasTestEngine: !!testEngine,
            hasQuestionService: !!csiQuestionService,
            hasRepository: !!repository,
            repositoryType: repository ? repository.constructor.name : 'undefined'
        });

         // Verifica del scorer
    if (!scorer) {
        throw new Error('Scorer is required in CSIController');
    }


        // Verifica che csiConfig sia un modello Mongoose
        if (!csiConfig || !csiConfig.findOne) {
            throw new Error('Invalid CSIConfig model provided to CSIController');
        }

        // Verifica le dipendenze obbligatorie
        if (!repository) {
            throw new Error('Repository is required in CSIController');
        }

        if (!testEngine || !csiQuestionService || !repository) {
            throw new Error('Required dependencies missing');
        }

        if (!csiQuestionService) {
            throw new Error('csiQuestionService is required');
        }
        
        this.engine = testEngine;       // Rinominato per chiarezza
        this.questionService = csiQuestionService;
        this.userService = userService;
        this.configModel = csiConfig; // Usa l'import diretto invece di require
        this.validator = validator;
        this.repository = repository;  // Salviamo il repository!
        this.scorer = scorer;          // Salviamo il scorer!

        logger.debug('CSIController initialized, repository methods:', {
            repositoryMethods: repository ? Object.getOwnPropertyNames(Object.getPrototypeOf(repository)) : []
        });

        
        logger.debug('CSIController initialized:', {
            hasScorer: !!this.scorer,
            scorerVersion: this.scorer.version,
            hasRepository: !!this.repository
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

            // Verifica che il repository sia disponibile
            if (!this.repository) {
                throw new Error('Repository not initialized');
            }

            // 1. Verifica disponibilità
            const availability = await this.repository.checkAvailability(studentId);
            if (!availability.available) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_ALLOWED,
                    'Test CSI non disponibile al momento',
                    { nextAvailableDate: availability.nextAvailableDate }
                );
            }

            // 2. Recupera configurazione attiva
            const config = await this.configModel.findOne({ active: true });
            if (!config) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna configurazione CSI attiva trovata'
                );
            }

            // 3. Prepara i dati del test
            const testData = {
                studentId,
                tipo: 'CSI',
                config: config._id
            };

            // 4. Genera il token usando il repository
            const tokenData = await this.repository.saveTestToken(testData);
            
            logger.debug('Test token generated:', {
                tokenId: tokenData._id,
                hasToken: !!tokenData.token
            });

            return {
                token: tokenData.token,
                expiresAt: tokenData.expiresAt,
                config: {
                    timeLimit: config.validazione.tempoMassimoDomanda,
                    minQuestions: config.validazione.numeroMinimoDomande,
                    instructions: config.interfaccia.istruzioni
                }
            };

        } catch (error) {
            logger.error('Error initializing CSI test:', {
                error: error.message,
                studentId,
                stack: error.stack
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
        logger.debug('Starting test completion:', { 
            token: token.substring(0, 10) + '...',
            hasRepository: !!this.repository,
            hasScorer: !!this.scorer
        });

        // 1. Verifica token e recupera risultato
        const result = await this.repository.findByToken(token);
        if (!result) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_TOKEN,
                'Token non valido o test non trovato'
            );
        }

        logger.debug('Found result:', {
            resultId: result._id,
            testRef: result.testRef,
            risposteCount: result.risposte?.length || 0
        });

        // 2. Recupera il test con le domande
        const Test = mongoose.model('Test');
        const test = await Test.findById(result.testRef)
            .populate({
                path: 'domande.questionRef',
                model: 'CSIQuestion',
                select: 'id categoria peso metadata testo'
            });

        if (!test) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Test di riferimento non trovato'
            );
        }

        // 3. Prepara le risposte nel formato richiesto da CSIScorer
        const risposteComplete = result.risposte.map(risposta => {
            const domanda = test.domande.find(d => 
                d.questionRef?.id === risposta.questionId
            );

            if (!domanda?.questionRef) {
                logger.warn('Question not found for answer:', {
                    questionId: risposta.questionId,
                    answerId: risposta._id
                });
                return null;
            }

            return {
                value: risposta.value,
                timeSpent: risposta.timeSpent,
                domanda: {
                    id: domanda.questionRef.id,
                    categoria: domanda.questionRef.categoria,
                    peso: domanda.questionRef.metadata?.peso || 1,
                    polarity: domanda.questionRef.metadata?.polarity || '+',
                    testo: domanda.questionRef.testo
                }
            };
        }).filter(r => r !== null);

        // 4. Verifica numero minimo di risposte
        const config = await this.configModel.findOne({ active: true });
        if (!config) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Configurazione CSI non trovata'
            );
        }

        if (risposteComplete.length < config.validazione.numeroMinimoDomande) {
            throw createError(
                ErrorTypes.VALIDATION.INCOMPLETE_TEST,
                `Numero di risposte insufficiente (minimo ${config.validazione.numeroMinimoDomande})`
            );
        }

        // 5. Calcola i risultati usando CSIScorer
        const testResults = this.scorer.calculateTestResult(risposteComplete);
        
        logger.debug('Test results calculated:', {
            dimensions: Object.keys(testResults.punteggiDimensioni),
            hasPattern: !!testResults.metadataCSI?.pattern,
            hasProfile: !!testResults.metadataCSI?.profiloCognitivo
        });

        // 6. Aggiungi metriche aggiuntive ai metadata
        const metadataCompleto = {
            ...testResults.metadataCSI,
            tempoTotaleDomande: risposteComplete.reduce((sum, r) => sum + r.timeSpent, 0),
            tempoMedioRisposta: risposteComplete.reduce((sum, r) => sum + r.timeSpent, 0) / risposteComplete.length,
            completamentoPercentuale: (risposteComplete.length / test.domande.length) * 100,
            sessioneTest: {
                iniziata: result.dataInizio,
                completata: new Date(),
                durataTotale: new Date() - result.dataInizio
            }
        };

        // 7. Aggiorna il risultato con i punteggi e metadata completi
        const completedResult = await this.repository.update(token, {
            completato: true,
            dataCompletamento: new Date(),
            punteggiDimensioni: testResults.punteggiDimensioni,
            metadataCSI: metadataCompleto
        });

        // 8. Prepara la risposta con i risultati elaborati
        res.json({
            status: 'success',
            data: {
                testCompleted: true,
                resultId: completedResult._id,
                scores: testResults.punteggiDimensioni,
                metadata: metadataCompleto,
                profilo: testResults.metadataCSI.profiloCognitivo,
                validita: {
                    pattern: testResults.metadataCSI.pattern,
                    avvertimenti: testResults.metadataCSI.pattern.warnings
                }
            }
        });

    } catch (error) {
        logger.error('Error completing test:', {
            error: error.message,
            token: token?.substring(0, 10) + '...',
            stack: error.stack
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
            hasRepository: !!this.repository
        });

        // Inizializza il test e ottieni il token
        const testInit = await this.initializeCSITest(studentId);
        
        if (!testInit || !testInit.token) {
            throw new Error('Failed to initialize test');
        }

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
            studentId: req.body.studentId,
            stack: error.stack
        });
        
        res.status(400).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'GENERATE_LINK_ERROR'
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