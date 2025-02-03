// src/engines/CSI/controllers/CSIController.js

const CSIEngine = require('./engine/CSIEngine');
const Test = require('../../models/Test');
const Result = require('../../models/Result');
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const crypto = require('crypto');

class CSIController {
    constructor(dependencies) {
        if (!dependencies) {
            throw new Error('Dependencies object is required');
        }
        
        const { testRepository, studentRepository, classRepository, schoolRepository, userService } = dependencies;
        
        // Salva le dependencies
        this.testRepository = testRepository;
        this.studentRepository = studentRepository;
        this.classRepository = classRepository;
        this.schoolRepository = schoolRepository;
        this.userService = userService;

        // Inizializza l'engine con i modelli corretti
        this.engine = new CSIEngine(Test, Result);
    }

    /**
     * Verifica validità del token test
     */
    verifyTestToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Verifying test token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            const test = await this.engine.verifyToken(token);
            
            res.json({
                status: 'success',
                data: {
                    valid: true,
                    testType: test.test.tipo,
                    expiresAt: test.expiresAt
                }
            });
        } catch (error) {
            logger.error('Error verifying test token:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            res.status(400).json({
                status: 'error',
                error: {
                    message: 'Token non valido o scaduto',
                    code: error.code || 'INVALID_TOKEN'
                }
            });
        }
    };

    /**
     * Inizia il test con token
     */
    startTestWithToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Starting test with token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            // Verifica e recupera info test
            const result = await this.engine.verifyToken(token);
            
            logger.debug('Token verification result:', {
                studentId: result.studentId,
                testId: result.test._id,
                hasQuestions: result.test.domande ? result.test.domande.length : 0
            });

            if (result.used) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Questo test è già stato completato'
                );
            }

            // Marca il token come utilizzato
            // await this.engine.markTokenAsUsed(token);

            // Inizializza il test
            const testData = await this.engine.initializeTest({
                studentId: result.studentId,
                testId: result.test._id
            });

            logger.debug('Test initialized:', {
                testId: testData.test._id,
                hasQuestions: testData.test.domande ? testData.test.domande.length : 0,
                questions: testData.test.domande
            });
    

            res.json({
                status: 'success',
                data: {
                    testId: testData.test._id,
                    questions: testData.test.domande,
                    timeLimit: testData.test.configurazione.tempoLimite,
                    instructions: testData.test.configurazione.istruzioni
                }
            });
        } catch (error) {
            logger.error('Error starting test:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'START_TEST_ERROR'
                }
            });
        }
    };

    /**
     * Gestisce le risposte del test
     */
    submitAnswer = async (req, res) => {
        const { token } = req.params;
        const { questionIndex, value, timeSpent } = req.body;

        try {
            // Verifica token e recupera test
            const result = await this.engine.verifyToken(token);
            
            // Processa la risposta
            const updatedResult = await this.engine.processAnswer(result.test._id, {
                questionIndex,
                value: parseInt(value),
                timeSpent
            });

            res.json({
                status: 'success',
                data: {
                    answered: updatedResult.risposte.length,
                    total: result.test.domande.length
                }
            });
            } catch (error) {
                logger.error('Error submitting answer:', {
                    error: error.message,
                    token: token ? token.substring(0, 10) + '...' : 'undefined'
                });

                res.status(400).json({
                    status: 'error',
                    error: {
                        message: error.message,
                        code: error.code || 'SUBMIT_ANSWER_ERROR'
                    }
                });
            }
        };

    /**
     * Completa il test
     */
    completeTest = async (req, res) => {
        const { token } = req.params;
    
        try {
            // Verifica token e recupera test
            const result = await this.engine.verifyToken(token);
            
            // Passa sia testId che token
            const completedResult = await this.engine.completeTest(result.test._id, token);
     
            // Non serve più chiamare markTokenAsUsed qui perché lo faremo dentro completeTest
            // await this.engine.markTokenAsUsed(token);
    
            res.json({
                status: 'success',
                data: {
                    testCompleted: true,
                    resultId: completedResult._id
                }
            });
        } catch (error) {
            logger.error('Error completing test:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
    
            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'COMPLETE_TEST_ERROR'
                }
            });
        }
    };

    /**
 * Recupera tutti i test completati di uno studente
 */
getStudentResults = async (req, res) => {
    const { studentId } = req.params;

    try {
        logger.debug('Fetching student test results:', { studentId });

        const results = await Result.find({
            studentId,
            completato: true
        })
        .populate('test', 'tipo')
        .sort({ dataCompletamento: -1 });

        logger.debug('Found student results:', {
            count: results.length,
            studentId
        });

        res.json({
            status: 'success',
            data: results
        });
    } catch (error) {
        logger.error('Error fetching student results:', {
            error: error.message,
            studentId
        });

        res.status(500).json({
            status: 'error',
            error: {
                message: 'Errore nel recupero dei risultati',
                code: error.code || 'FETCH_RESULTS_ERROR'
            }
        });
    }
};

    /**
     * Genera un link univoco per il test
     */
    generateTestLink = async (req, res) => {
        try {
            const { studentId, testType, version } = req.body;
    
            // Carica le domande usando il nuovo sistema
            const questions = await this.engine._loadQuestions(version);
            
            // Crea il test con il nuovo formato delle domande
            const test = await Test.create({
                tipo: testType,
                domande: questions,
                versione: version || '1.0.0',
                configurazione: {
                    tempoLimite: 30,
                    tentativiMax: 1,
                    questionVersion: version || '1.0.0'
                }
            });
    
        } catch (error) {
            logger.error('Error generating test link:', {
                error: error.message,
                studentId: req.body.studentId
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

    // Aggiungi questi metodi alla classe CSIController

    /**
     * Recupera tutti i test
     */
    getAll = async (req, res) => {
        logger.debug('getAll called');
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Inizializza un nuovo test
     */
    initTest = async (req, res) => {
        logger.debug('initTest called');
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Recupera un test per ID
     */
    getById = async (req, res) => {
        const { testId } = req.params;
        logger.debug('getById called', { testId });
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Recupera il risultato di un test
     */
    getResult = async (req, res) => {
        const { testId } = req.params;
        logger.debug('getResult called', { testId });
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Recupera statistiche per classe
     */
    getClassStats = async (req, res) => {
        const { classId } = req.params;
        logger.debug('getClassStats called', { classId });
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Recupera statistiche per scuola
     */
    getSchoolStats = async (req, res) => {
        const { schoolId } = req.params;
        logger.debug('getSchoolStats called', { schoolId });
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Verifica disponibilità test
     */
    validateTestAvailability = async (req, res) => {
        const { testId } = req.params;
        logger.debug('validateTestAvailability called', { testId });
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };

    /**
     * Genera report PDF
     */
    generatePDFReport = async (req, res) => {
        const { testId } = req.params;
        logger.debug('generatePDFReport called', { testId });
        res.status(501).json({
            status: 'error',
            message: 'Not implemented yet'
        });
    };
    
}

// Esporta la classe
module.exports = CSIController;
