// src/controllers/testController.js

const BaseController = require('./baseController');
const mongoose = require('mongoose'); // Add this import
const logger = require('../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');

class TestController extends BaseController {
    constructor(testRepository) {
        super(testRepository);
        this.repository = testRepository;

        // Binding dei metodi
        this.assignTest = this.assignTest.bind(this);
        this.getAssignedTests = this.getAssignedTests.bind(this);
        this.revokeTest = this.revokeTest.bind(this);
        
        // Log repository details for debugging
        logger.debug('TestController initialized with repository:', {
            hasRepository: !!this.repository,
            repositoryType: this.repository?.constructor?.name,
            modelName: this.repository?.model?.modelName
        });
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
     * Assegna un test a uno studente
     * @route POST /tests/assign
     */
    async assignTest(req, res) {
        try {
            const { testType, config, studentId } = req.body;
            const assignedBy = req.user.id;
            
            logger.debug('Assigning test to student:', {
                testType,
                studentId,
                assignedBy,
                config: config ? 'present' : 'not present'
            });
            
            // Validazione input
            if (!testType || !studentId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'I campi testType e studentId sono obbligatori'
                );
            }
            
            // Controllo esistenza studente (potrebbe essere fatto nel repository)
            // questa è una validazione che potrebbe essere implementata
            
            // Assegna il test attraverso il repository
            const test = await this.repository.assignTestToStudent(
                {
                    tipo: testType,
                    configurazione: config || {}
                },
                studentId,
                assignedBy
            );
            
            logger.info('Test assigned successfully:', {
                testId: test._id,
                studentId,
                assignedBy
            });
    
            this.sendResponse(res, { test }, 201);
        } catch (error) {
            logger.error('Error in test assignment:', {
                error: error.message,
                stack: error.stack
            });
            this.sendError(res, error);
        }
    }
    
    /**
     * Recupera i test assegnati a uno studente
     * @route GET /tests/assigned/student/:studentId
     */
    async getAssignedTests(req, res) {
        try {
            const { studentId } = req.params;
            
            logger.debug('Getting assigned tests for student:', { 
                studentId,
                controllerHasRepository: !!this.repository,
                repositoryHasModel: !!this.repository?.model
            });
            
            if (!studentId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID studente non valido'
                );
            }
            
            // Verifica permessi (se l'utente è un docente, può vedere solo i test assegnati da lui)
            const isAdmin = req.user.role === 'admin';
            const assignedBy = isAdmin ? null : req.user.id;
            
            logger.debug('Permission check:', {
                isAdmin,
                assignedBy,
                userRole: req.user.role
            });
            
            try {
                const tests = await this.repository.getAssignedTests(studentId, assignedBy);
                
                logger.debug('Repository returned tests:', {
                    count: tests.length,
                    testsSample: tests.slice(0, 2).map(t => ({
                        id: t._id,
                        tipo: t.tipo,
                        status: t.status,
                        nome: t.nome
                    }))
                });
                
                // Invia una risposta semplificata
                const response = { 
                    status: 'success',
                    data: tests
                };
                
                logger.debug('Sending response:', {
                    responseStructure: {
                        hasStatus: !!response.status,
                        hasData: !!response.data,
                        dataIsArray: Array.isArray(response.data),
                        dataLength: response.data.length
                    }
                });
                
                this.sendResponse(res, response);
                
            } catch (error) {
                logger.error('Error in test retrieval:', {
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        } catch (error) {
            logger.error('Error getting assigned tests:', {
                error: error.message,
                studentId: req.params.studentId
            });
            this.sendError(res, error);
        }
    }
    
    /**
     * Revoca un test assegnato
     * @route POST /tests/:testId/revoke
     */
    async revokeTest(req, res) {
        try {
            const { testId } = req.params;
            
            logger.debug('Revoking test:', { testId, userId: req.user.id });
            
            if (!testId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID test non valido'
                );
            }
            
            // Recupera il test prima di revocarlo per verificare i permessi
            const test = await this.repository.findById(testId);
            
            if (!test) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Test non trovato'
                );
            }
            
            // Verifica permessi (solo chi ha assegnato il test o un admin può revocarlo)
            const isAdmin = req.user.role === 'admin';
            const isAssigner = test.assignedBy && test.assignedBy.toString() === req.user.id;
            
            if (!isAdmin && !isAssigner) {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non sei autorizzato a revocare questo test'
                );
            }
            
            // Revoca il test
            const result = await this.repository.revokeTest(testId);
            
            logger.info('Test revoked successfully:', {
                testId,
                userId: req.user.id
            });
            
            this.sendResponse(res, { 
                success: true,
                message: 'Test revocato con successo' 
            });
        } catch (error) {
            logger.error('Error revoking test:', {
                error: error.message,
                testId: req.params.testId
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
     * Sottomette les risposte di un test
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
     * Recupera i test completati di uno studente
     * @route GET /tests/student/:studentId/completed
     */
    async getCompletedTests(req, res) {
        try {
            const { studentId } = req.params;
            
            logger.debug('Getting completed tests for student:', { studentId });
            
            if (!studentId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID studente non valido'
                );
            }
            
            const tests = await this.repository.find({
                studentId,
                status: 'completed',
                active: true
            });
            
            logger.debug(`Found ${tests.length} completed tests for student ${studentId}`);
            
            this.sendResponse(res, { tests });
        } catch (error) {
            logger.error('Error getting completed tests:', {
                error: error.message,
                studentId: req.params.studentId
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