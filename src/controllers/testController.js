// src/controllers/testController.js

const BaseController = require('./baseController');
const logger = require('../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');

class TestController extends BaseController {
    constructor(testRepository) {
        super(testRepository);
        this.repository = testRepository;
    }

    /**
     * Recupera tutti i test disponibili
     */
    async getAll(req, res) {
        try {
            logger.debug('Getting all tests');
            const tests = await this.repository.find({});
            
            this.sendResponse(res, { tests });
        } catch (error) {
            logger.error('Error getting all tests:', {
                error: error.message
            });
            this.sendError(res, error);
        }
    }

    /**
     * Avvia un nuovo test
     */
    async startTest(req, res) {
        try {
            const { studentId, testType } = req.body;
            
            logger.debug('Starting new test:', { studentId, testType });

            // Verifica disponibilità
            const availability = await this.repository.checkTestAvailability(studentId, testType);
            if (!availability.available) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Test non disponibile al momento',
                    code: 'TEST_NOT_AVAILABLE',
                    details: {
                        nextAvailableDate: availability.nextAvailableDate
                    }
                });
            }

            // Genera token per il test
            const token = await this.repository.saveTestToken({
                studentId,
                testType
            });

            logger.info('Test started successfully:', {
                testId: token._id,
                studentId,
                testType
            });

            this.sendResponse(res, { 
                token: token.token,
                expiresAt: token.expiresAt
            }, 201);
        } catch (error) {
            logger.error('Error starting test:', {
                error: error.message,
                studentId: req.body.studentId
            });
            this.sendError(res, error);
        }
    }

    /**
     * Recupera un test specifico
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            logger.debug('Getting test by id:', { id });

            const test = await this.repository.findById(id);
            if (!test) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Test non trovato',
                    code: 'TEST_NOT_FOUND'
                });
            }

            // Verifica autorizzazione
            if (req.user.role === 'student' && test.studentId.toString() !== req.user.id) {
                return this.sendError(res, {
                    statusCode: 403,
                    message: 'Non autorizzato',
                    code: 'TEST_UNAUTHORIZED'
                });
            }

            this.sendResponse(res, { test });
        } catch (error) {
            logger.error('Error getting test:', {
                error: error.message,
                testId: req.params.id
            });
            this.sendError(res, error);
        }
    }

    /**
     * Recupera statistiche del test
     */
    async getTestStats(req, res) {
        try {
            const { testId } = req.params;
            logger.debug('Getting test stats:', { testId });

            const stats = await this.repository.getBaseResults(testId);

            this.sendResponse(res, { stats });
        } catch (error) {
            logger.error('Error getting test stats:', {
                error: error.message,
                testId: req.params.testId
            });
            this.sendError(res, error);
        }
    }

    /**
     * Sottomette le risposte di un test
     */
    async submitTest(req, res) {
        try {
            const { testId } = req.params;
            const { answers } = req.body;

            logger.debug('Submitting test answers:', {
                testId,
                answersCount: answers?.length
            });

            // Verifica validità
            if (!answers || !Array.isArray(answers)) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Formato risposte non valido',
                    code: 'INVALID_ANSWERS_FORMAT'
                });
            }

            // Salva le risposte
            const result = await this.repository.saveTestResult(testId, {
                answers,
                completedAt: new Date()
            });

            this.sendResponse(res, { 
                result,
                message: 'Test completato con successo'
            });
        } catch (error) {
            logger.error('Error submitting test:', {
                error: error.message,
                testId: req.params.testId
            });
            this.sendError(res, error);
        }
    }

    /**
     * Helper per inviare risposte
     */
    sendResponse(res, data, status = 200) {
        res.status(status).json({
            status: 'success',
            data
        });
    }

    /**
     * Helper per inviare errori
     */
    sendError(res, error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'INTERNAL_SERVER_ERROR',
                details: error.details
            }
        });
    }
}

module.exports = TestController;