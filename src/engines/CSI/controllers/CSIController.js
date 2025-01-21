// src/engines/CSI/controllers/CSIController.js

const CSIEngine = require('../engine/CSIEngine');
const { Test, Result } = require('../../../models/Test');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');
const crypto = require('crypto');

class CSIController {
    constructor() {
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
            
            if (result.used) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Questo test è già stato completato'
                );
            }

            // Marca il token come utilizzato
            await this.engine.markTokenAsUsed(token);

            // Inizializza il test
            const testData = await this.engine.initializeTest({
                studentId: result.studentId,
                testId: result.test._id
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
            
            // Completa il test
            const completedResult = await this.engine.completeTest(result.test._id);

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
     * Genera un link univoco per il test
     */
    generateTestLink = async (req, res) => {
        try {
            const { studentId, testType } = req.body;
    
            logger.debug('Generating test link:', { studentId, testType });
    
            if (!studentId || !testType) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'studentId e testType sono richiesti'
                );
            }
    
            // Genera token sicuro
            const token = crypto
                .createHash('sha256')
                .update(`${studentId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
                .digest('hex');
    
            // Crea il test prima del result
            const test = await Test.create({
                tipo: testType,
                configurazione: {
                    tempoLimite: 30,
                    tentativiMax: 1
                }
            });
    
            // Crea il result usando solo studentId
            const result = await Result.create({
                studentId,
                test: test._id,
                token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                used: false,
                completato: false,
                risposte: []
            });
    
            logger.info('Test link generated successfully:', {
                testId: test._id,
                resultId: result._id,
                token: token.substring(0, 10) + '...'
            });
    
            res.json({
                status: 'success',
                data: {
                    token,
                    url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/csi/${token}`
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
}

// Esporta una singola istanza del controller
module.exports = new CSIController();