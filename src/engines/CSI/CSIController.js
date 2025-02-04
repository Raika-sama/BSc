// src/engines/CSI/CSIController.js

const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');

class CSIController {
    constructor(dependencies) {
        const { 
            testEngine,      // Cambiato da testRepository
            csiQuestionService,
            userService,
            csiConfig       // Aggiunto csiConfig
        } = dependencies;

        if (!testEngine || !csiQuestionService || !csiConfig) {
            throw new Error('Required dependencies missing');
        }
        if (!csiQuestionService) {
            throw new Error('csiQuestionService is required');
        }
        if (!csiConfig) {
            throw new Error('csiConfig is required');
        }
        this.engine = testEngine;       // Rinominato per chiarezza
        this.questionService = csiQuestionService;
        this.userService = userService;
        this.config = csiConfig;

        logger.debug('CSIController initialized successfully');

    }

    /**
     * Verifica token test CSI
     */
    verifyTestToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Verifying CSI token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
    
            // Delega la verifica all'engine
            const result = await this.engine.verifyToken(token);
    
            res.status(200).json({
                status: 'success',
                data: {
                    valid: true,
                    questions: result.test.domande,
                    expiresAt: result.expiresAt,
                    testId: result._id
                }
            });
    
        } catch (error) {
            logger.error('Error verifying CSI token:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
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

            // Delega l'inizializzazione all'engine
            const result = await this.engine.startTest(token);
            
            // Ottieni la configurazione attiva
            const config = await this.config.getActiveConfig();

            res.json({
                status: 'success',
                data: {
                    questions: result.test.domande,
                    config,
                    testId: result._id
                }
            });
        } catch (error) {
            logger.error('Error starting CSI test:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
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

    /**
     * Processa risposta test CSI
     */
    submitAnswer = async (req, res) => {
        const { token } = req.params;
        const { questionId, value, timeSpent } = req.body;

        try {
            // Delega il processamento della risposta all'engine
            const result = await this.engine.processAnswer(token, {
                questionId,
                value,
                timeSpent
            });

            res.json({
                status: 'success',
                data: {
                    answered: result.risposte.length,
                    remaining: result.test.domande.length - result.risposte.length
                }
            });
        } catch (error) {
            logger.error('Error submitting CSI answer:', {
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
     * Completa test CSI
     */
    completeTest = async (req, res) => {
        const { token } = req.params;
    
        try {
            // Delega il completamento all'engine
            const result = await this.engine.completeTest(token);

            // Notifica completamento
            if (this.userService) {
                await this.userService.notifyTestComplete(result.studentId, 'CSI');
            }
    
            res.json({
                status: 'success',
                data: {
                    testCompleted: true,
                    resultId: result._id
                }
            });
        } catch (error) {
            logger.error('Error completing CSI test:', {
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
     * Genera link per test CSI
     */
    generateTestLink = async (req, res) => {
        try {
            const { studentId } = req.body;
    
            // Delega la generazione del link all'engine
            const result = await this.engine.generateTestLink(studentId);
    
            const testUrl = `${process.env.FRONTEND_URL}/test/csi/${result.token}`;
    
            res.json({
                status: 'success',
                data: {
                    token: result.token,
                    url: testUrl,
                    expiresAt: result.expiresAt
                }
            });
        } catch (error) {
            logger.error('Error generating CSI test link:', {
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
}

module.exports = CSIController;