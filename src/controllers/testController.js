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

    async assignTest(req, res) {
        try {
            const { testType, config, studentId } = req.body;
            const assignedBy = req.user.id;
    
            const test = await this.repository.assignTestToStudent(
                {
                    tipo: testType,
                    configurazione: config
                },
                studentId,
                assignedBy
            );
    
            this.sendResponse(res, { test }, 201);
        } catch (error) {
            logger.error('Error in test assignment:', {
                error: error.message
            });
            this.sendError(res, error);
        }
    }
    
    async getMyTests(req, res) {
        try {
            const studentId = req.student.id;
            const status = req.query.status;
            
            const tests = await this.repository.getStudentTests(studentId, status);
            
            this.sendResponse(res, { tests });
        } catch (error) {
            logger.error('Error getting student tests:', {
                error: error.message
            });
            this.sendError(res, error);
        }
    }

    

    /**
     * Avvia un nuovo test inviato tramite link
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
    
            let testData;
            // Se è un test CSI, usa il controller specifico
            if (testType === 'CSI') {
                testData = await this.csiController.initializeCSITest(studentId);
            } else {
                // Gestione altri tipi di test...
                throw new Error('Tipo test non supportato');
            }
    
            const testUrl = `${process.env.FRONTEND_URL}/test/${testType.toLowerCase()}/${testData.token}`;
    
            this.sendResponse(res, { 
                token: testData.token,
                url: testUrl,
                expiresAt: testData.expiresAt,
                config: testData.config
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
 * Avvia un test assegnato dal docente
 */
async startAssignedTest(req, res) {
    try {
        const { testId } = req.params;
        const studentId = req.student.id;

        const test = await this.repository.findById(testId);

        if (!test || test.studentId.toString() !== studentId) {
            throw createError(
                ErrorTypes.AUTH.FORBIDDEN,
                'Test non trovato o non autorizzato'
            );
        }

        // Verifica disponibilità
        const availability = await this.repository.checkTestAvailability(studentId, test.tipo);
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

        let testData;
        // Se è un test CSI, usa il controller specifico
        if (test.tipo === 'CSI') {
            testData = await this.csiController.initializeCSITest(studentId);
        } else {
            // Gestione altri tipi di test...
            throw new Error('Tipo test non supportato');
        }

        // Aggiorna lo stato del test
        await this.repository.updateTestStatus(
            testId,
            'in_progress',
            {
                attempts: test.attempts + 1,
                lastStarted: new Date()
            }
        );

        // Costruisci l'URL del test
        const testUrl = `${process.env.FRONTEND_URL}/test/${test.tipo.toLowerCase()}/${testData.token}`;

        this.sendResponse(res, { 
            token: testData.token,
            url: testUrl,
            expiresAt: testData.expiresAt,
            config: testData.config
        }, 201);

    } catch (error) {
        logger.error('Error starting assigned test:', {
            error: error.message,
            testId: req.params.testId,
            studentId: req.student.id
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