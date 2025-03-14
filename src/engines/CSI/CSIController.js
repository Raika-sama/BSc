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
            // Debug #1 - Inizio verifica
            logger.debug('[DEBUG-CONTROLLER] Inizio verifica token:', { 
                token: token?.substring(0, 10) + '...',
                hasRepository: !!this.repository,
                hasQuestionService: !!this.questionService,
                timestamp: new Date().toISOString()
            });

            if (!token || token === "undefined") {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token mancante o non valido'
                );
            }
    
            // Debug #2 - Prima della ricerca test
            logger.debug('[DEBUG-CONTROLLER] Repository che verrà usato:', {
                type: this.repository?.constructor?.name,
                modelName: this.repository?.resultModel?.modelName,
                methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.repository))
            });
    
            // Cerca il test
            const test = await this.repository.findByToken(token);
            
            // Debug #3 - Dopo findByToken
            logger.debug('[DEBUG-CONTROLLER] Risultato findByToken:', {
                found: !!test,
                testId: test?._id,
                testToken: test?.token,
                expiresAt: test?.expiresAt,
                isExpired: test?.expiresAt ? test.expiresAt < new Date() : null,
                fields: test ? Object.keys(test) : []
            });
    
            if (!test) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o test non trovato'
                );
            }
    
            if (test.expiresAt && test.expiresAt < new Date()) {
                throw createError(
                    ErrorTypes.VALIDATION.EXPIRED_TOKEN,
                    'Il token è scaduto'
                );
            }

            // Debug #4 - Prima di caricare le domande
            logger.debug('[DEBUG-CONTROLLER] Carico domande del test:', {
                testId: test._id,
                questionService: {
                    type: this.questionService?.constructor?.name,
                    isAvailable: !!this.questionService
                }
            });

            // Carica le domande del test
            const questions = await this.questionService.getTestQuestions();

            // Debug #5 - Rispondi con successo
            logger.debug('[DEBUG-CONTROLLER] Invio risposta:', {
                testId: test._id,
                questionsCount: questions?.length,
                testValid: true
            });

            res.json({
                status: 'success',
                data: {
                    valid: true,
                    test: {
                        id: test._id,
                        token: test.token,
                        tipo: 'CSI',
                        expiresAt: test.expiresAt,
                        config: test.config
                    },
                    questions
                }
            });
            
        } catch (error) {
            // Debug #7 - In caso di errore
            logger.error('[DEBUG-CONTROLLER] Errore in verifyTestToken:', {
                error: error.message,
                code: error.code,
                type: error.type,
                name: error.name,
                stack: error.stack,
                token: token?.substring(0, 10) + '...',
                timestamp: new Date().toISOString()
            });
            
            res.status(error.statusCode || 400).json({
                status: 'error',
                error: {
                    message: error.message || 'Errore nella verifica del token',
                    code: error.code || error.type || 'VERIFY_TOKEN_ERROR'
                }
            });
        }
    };

    /**
     * Metodo interno per avviare un test CSI
     */
    async _startTest(token) {
        try {
            logger.debug('Starting CSI test internally:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
    
            if (!token) {
                throw new Error('Token is required to start test');
            }
    
            // Verifica il repository
            if (!this.repository) {
                throw new Error('Repository not initialized');
            }
    
            // Marca il token come usato
            const result = await this.repository.markTokenAsUsed(token);
            
            if (!result) {
                throw new Error('Failed to mark token as used');
            }
            
            // Carica domande e configurazione
            const [questions, config] = await Promise.all([
                this.questionService.getTestQuestions(),
                this.configModel.findOne({ active: true })
            ]);
    
            if (!config) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna configurazione CSI attiva trovata'
                );
            }
    
            logger.debug('Test started successfully:', {
                token: token.substring(0, 10) + '...',
                questionsCount: questions.length,
                configId: config._id
            });
    
            return {
                questions,
                config: {
                    timeLimit: config.validazione.tempoMassimoDomanda,
                    minQuestions: config.validazione.numeroMinimoDomande,
                    instructions: config.interfaccia.istruzioni
                }
            };
        } catch (error) {
            logger.error('Error in _startTest:', {
                error: error.message,
                stack: error.stack,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw error;
        }
    }

    /**
     * Route handler per avviare un test CSI
     */
    startTestWithToken = async (req, res) => {
        try {
            const { token } = req.params;
            const result = await this._startTest(token);

            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Error starting CSI test:', {
                error: error.message,
                token: req.params.token?.substring(0, 10) + '...'
            });
            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'START_TEST_ERROR'
                }
            });
        }
    }

    async initializeCSITest(studentId, testId = null) {
        try {
            logger.debug('Initializing CSI test for student:', { 
                studentId,
                existingTestId: testId 
            });
    
            // Verifica che il repository sia disponibile
            if (!this.repository) {
                throw new Error('Repository not initialized');
            }
    
            // 1. Verifica disponibilità (solo se non abbiamo un testId)
            if (!testId) {
                const availability = await this.repository.checkAvailability(studentId);
                if (!availability.available) {
                    throw createError(
                        ErrorTypes.VALIDATION.NOT_ALLOWED,
                        'Test CSI non disponibile al momento',
                        { nextAvailableDate: availability.nextAvailableDate }
                    );
                }
            }
    
            // 2. Recupera configurazione attiva
            const config = await this.configModel.findOne({ active: true });
            if (!config) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna configurazione CSI attiva trovata'
                );
            }
    
            // 3. Recupera il nome dello studente se disponibile (per il nome del test)
            let studentName = null;
            try {
                const student = await mongoose.model('Student').findById(studentId);
                if (student) {
                    studentName = `${student.firstName} ${student.lastName}`;
                }
            } catch (e) {
                logger.warn('Could not retrieve student name:', { error: e.message });
            }
    
            // 4. Prepara i dati del test
            const testData = {
                studentId,
                tipo: 'CSI',
                config: config._id,
                testId, // Passa l'ID del test esistente
                studentName // Aggiungi il nome dello studente
            };
    
            // 5. Genera il token usando il repository
            const tokenData = await this.repository.saveTestToken(testData);
            
            logger.debug('Test token generated:', {
                tokenId: tokenData.resultId,
                hasToken: !!tokenData.token,
                testId: tokenData.testId
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

        // 2. Recupera il test e le domande separatamente con lean() e no populate
        const [test, questions] = await Promise.all([
            mongoose.model('Test')
                .findById(result.testRef)
                .setOptions({ populateQuestions: false })
                .lean(),
            mongoose.model('CSIQuestion')
                .find({
                    id: { $in: result.risposte.map(r => r.questionId) }
                })
                .select('id categoria metadata')
                .lean()
        ]);

        logger.debug('Retrieved test and questions:', {
            testId: test?._id,
            testType: test?.tipo,
            questionsFound: questions.length,
            questionIds: questions.map(q => q.id),
            questionCategories: [...new Set(questions.map(q => q.categoria))]
        });

        if (!test) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Test di riferimento non trovato'
            );
        }

        // 3. Prepara le risposte nel formato richiesto da CSIScorer
        const risposteComplete = result.risposte.map(risposta => {
            const domanda = questions.find(q => q.id === risposta.questionId);

            if (!domanda) {
                logger.warn('Question not found for answer:', {
                    questionId: risposta.questionId,
                    availableIds: questions.map(q => q.id)
                });
                return null;
            }

            // Modifica qui: aggiungi l'oggetto domanda completo
            return {
                value: risposta.value,
                timeSpent: risposta.timeSpent,
                domanda: {  // Aggiungi questo campo
                    id: domanda.id,
                    categoria: domanda.categoria,
                    peso: domanda.metadata?.peso || 1,
                    polarity: domanda.metadata?.polarity || '+'
                },
                question: {  // Mantieni questo per retrocompatibilità
                    categoria: domanda.categoria,
                    peso: domanda.metadata?.peso || 1,
                    polarity: domanda.metadata?.polarity || '+'
                }
            };
        }).filter(r => r !== null);

        // 4. Verifica numero minimo di risposte
        const config = await this.configModel.findOne({ active: true }).lean();
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
        const updateData = {
            completato: true,
            dataCompletamento: new Date(),
            punteggiDimensioni: testResults.punteggiDimensioni,
            metadataCSI: metadataCompleto
        };
        
        logger.debug('Updating result document:', {
            resultId: result._id,
            isCompleted: true,
            hasScores: true
        });
        
        // Modifica qui: Aggiorna il result esistente invece di crearne uno nuovo
        const completedResult = await this.repository.update(token, updateData);

        // 8. IMPORTANTE: Aggiorna anche il modello Test per cambiare lo stato
        logger.debug('Updating test status to completed:', {
            testId: test._id,
            currentStatus: test.status
        });
        
        await mongoose.model('Test').findByIdAndUpdate(
            test._id,
            {
                status: 'completed',
                dataCompletamento: new Date()
            }
        );

        // 9. Prepara la risposta con i risultati elaborati
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
                    avvertimenti: testResults.metadataCSI.pattern?.warnings || []
                }
            }
        });

    } catch (error) {
        logger.error('Error completing test:', {
            error: error.message,
            token: token?.substring(0, 10) + '...',
            stack: error.stack,
            errorType: error.name,
            details: error.details || {}
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