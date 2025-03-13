// src/controllers/testController.js

const BaseController = require('./baseController');
const mongoose = require('mongoose'); // Add this import
const logger = require('../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');

class TestController extends BaseController {
    constructor(testRepository, csiController) {
        super(testRepository);
        this.repository = testRepository;
        this.csiController = csiController;

        if (!this.csiController) {
            throw new Error('CSIController is required for TestController');
        }

        // Binding dei metodi
        this.assignTest = this.assignTest.bind(this);
        this.getAssignedTests = this.getAssignedTests.bind(this);
        this.revokeTest = this.revokeTest.bind(this);
        this.assignTestToClass = this.assignTestToClass.bind(this);
        this.getAssignedTestsByClass = this.getAssignedTestsByClass.bind(this);
        this.revokeClassTests = this.revokeClassTests.bind(this);
        this.assignTest = this.assignTest.bind(this);
        this.startAssignedTest = this.startAssignedTest.bind(this);

        // Log repository details for debugging
        logger.debug('TestController initialized with repository:', {
            hasRepository: !!this.repository,
            repositoryType: this.repository?.constructor?.name,
            hasStudentRepository: !!this.studentRepository,
            hasClassRepository: !!this.classRepository,
            hasCsiController: !!this.csiController,
            modelName: this.repository?.model?.modelName
        });
    }

    /**
     * Recupera tutti i test disponibili
     * @route GET /tests/all
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
     * Assegna un test a tutti gli studenti di una classe
     * @route POST /tests/assign-to-class
     */
    async assignTestToClass(req, res) {
        try {
            const { testType, config, classId } = req.body;
            const assignedBy = req.user.id;
            
            logger.debug('Assigning test to class:', {
                testType,
                classId,
                assignedBy,
                config: config ? 'present' : 'not present'
            });
            
            // Validazione input
            if (!testType || !classId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'I campi testType e classId sono obbligatori'
                );
            }
            
            // Verifica permessi
            if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato ad assegnare test a una classe'
                );
            }
            
            // Assegna il test attraverso il repository
            const result = await this.repository.assignTestToClass(
                {
                    tipo: testType,
                    configurazione: config || {}
                },
                classId,
                assignedBy
            );
            
            logger.info('Tests assigned successfully to class:', {
                classId,
                testsCount: result.testsAssigned,
                assignedBy
            });
    
            this.sendResponse(res, { 
                success: true,
                message: `${result.testsAssigned} test assegnati agli studenti della classe`,
                data: result
            }, 201);
        } catch (error) {
            logger.error('Error in class test assignment:', {
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
     * Recupera i test assegnati agli studenti di una classe
     * @route GET /tests/assigned/class/:classId
     */
    async getAssignedTestsByClass(req, res) {
        try {
            const { classId } = req.params;
            
            logger.debug('Getting assigned tests for class:', { 
                classId,
                userId: req.user.id
            });
            
            if (!classId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID classe non valido'
                );
            }
            
            // Verifica permessi
            const isAdmin = req.user.role === 'admin';
            const assignedBy = isAdmin ? null : req.user.id;
            
            const testsByStudent = await this.repository.getAssignedTestsByClass(classId, assignedBy);
            
            logger.debug('Tests by class retrieved:', {
                classId,
                studentsCount: testsByStudent.length
            });
            
            this.sendResponse(res, { 
                studentsWithTests: testsByStudent
            });
        } catch (error) {
            logger.error('Error getting class tests:', {
                error: error.message,
                classId: req.params.classId
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
            
            logger.debug('Revoking test:', { 
                testId, 
                userId: req.user.id,
                path: req.path,
                method: req.method
            });
            
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
            
            // Gli admin possono revocare qualsiasi test
            const isAdmin = req.user.role === 'admin';
            
            // Gli insegnanti possono revocare solo i test che hanno assegnato
            const isAssigner = test.assignedBy && test.assignedBy.toString() === req.user.id;
            
            if (!isAdmin && !isAssigner) {
                logger.error('Unauthorized test revocation attempt:', {
                    testId,
                    userId: req.user.id,
                    userRole: req.user.role,
                    assignedBy: test.assignedBy?.toString()
                });
                
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non sei autorizzato a revocare questo test'
                );
            }
            
            // Revoca il test
            const result = await this.repository.revokeTest(testId);
            
            logger.info('Test revoked successfully:', {
                testId,
                userId: req.user.id,
                userRole: req.user.role
            });
            
            this.sendResponse(res, { 
                success: true,
                message: 'Test revocato con successo',
                data: {
                    testId,
                    modifiedCount: result.modifiedCount
                }
            });
        } catch (error) {
            logger.error('Error revoking test:', {
                error: error.message,
                stack: error.stack,
                testId: req.params.testId,
                userId: req.user?.id,
                path: req.path
            });
            this.sendError(res, error);
        }
    }
    
    /**
     * Revoca tutti i test assegnati agli studenti di una classe
     * @route POST /tests/class/:classId/revoke
     */
    async revokeClassTests(req, res) {
        try {
            const { classId } = req.params;
            const { testType } = req.body; // Parametro opzionale
            
            logger.debug('Revoking tests for class:', { 
                classId, 
                testType: testType || 'all',
                userId: req.user.id 
            });
            
            if (!classId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID classe non valido'
                );
            }
            
            // Verifica permessi
            if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato a revocare test di classe'
                );
            }
            
            // Revoca i test
            const result = await this.repository.revokeClassTests(classId, testType);
            
            logger.info('Class tests revoked successfully:', {
                classId,
                modifiedCount: result.modifiedCount,
                userId: req.user.id
            });
            
            this.sendResponse(res, { 
                success: true,
                message: `${result.modifiedCount} test revocati con successo` 
            });
        } catch (error) {
            logger.error('Error revoking class tests:', {
                error: error.message,
                classId: req.params.classId
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

            // Per i test CSI, deleghiamo al CSIController
            if (testType === 'CSI') {
                const testInit = await this.csiController.initializeCSITest(studentId);
                const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/csi/${testInit.token}`;
                
                return this.sendResponse(res, {
                    token: testInit.token,
                    url: testUrl,
                    expiresAt: testInit.expiresAt,
                    config: testInit.config,
                    testType
                }, 201);
            }
    
            // Per altri tipi di test, usa la logica esistente
            // Verifica disponibilità
            const availability = await this.repository.checkTestAvailability(studentId, testType);
            if (!availability.available) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Test non disponibile al momento',
                    code: 'TEST_NOT_AVAILABLE',
                    details: {
                        nextAvailableDate: availability.nextAvailableDate,
                        reason: availability.reason
                    }
                });
            }
    
            let testData;
            
            // Inizializzazione diretta invece di usare un controller specifico
            // Tutti i test usano la stessa struttura di risposta
            const test = await this.repository.assignTestToStudent(
                {
                    tipo: testType,
                    configurazione: {
                        tempoLimite: 30,
                        questionVersion: '1.0.0'
                    }
                },
                studentId,
                null // nessun assegnatore, è auto-iniziato
            );
            
            // Imposta lo stato a in_progress
            await this.repository.updateTestStatus(
                test._id,
                'in_progress',
                {
                    attempts: 1,
                    lastStarted: new Date()
                }
            );
            
            // Prepara la risposta
            testData = {
                token: test._id,
                expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 ore di validità
                config: test.configurazione || {}
            };
    
            const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/${testType.toLowerCase()}/${testData.token}`;
    
            this.sendResponse(res, { 
                token: testData.token,
                url: testUrl,
                expiresAt: testData.expiresAt,
                config: testData.config,
                testType
            }, 201);
    
        } catch (error) {
            logger.error('Error starting test:', {
                error: error.message,
                studentId: req.body?.studentId
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
    
            logger.debug('Starting assigned test:', {
                testId,
                studentId
            });
    
            const test = await this.repository.findById(testId);
    
            if (!test || test.studentId.toString() !== studentId) {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Test non trovato o non autorizzato'
                );
            }

            // Per i test CSI, verifichiamo e avviamo il test
            if (test.tipo === 'CSI') {
                // Prima di avviare il test, verifichiamo la disponibilità
                const availability = await this.repository.checkTestAvailability(
                    studentId,
                    'CSI'
                );

                if (!availability.available) {
                    logger.debug('CSI test non disponibile:', {
                        studentId,
                        testId,
                        reason: availability.reason,
                        nextAvailableDate: availability.nextAvailableDate
                    });
                    
                    return this.sendError(res, {
                        statusCode: 400,
                        message: 'Test CSI non disponibile al momento',
                        code: 'TEST_NOT_AVAILABLE',
                        details: {
                            reason: availability.reason,
                            nextAvailableDate: availability.nextAvailableDate,
                            cooldownPeriod: availability.cooldownPeriod
                        }
                    });
                }

                // Aggiorna lo stato del test
                await this.repository.updateTestStatus(
                    testId,
                    'in_progress',
                    {
                        attempts: (test.attempts || 0) + 1,
                        lastStarted: new Date()
                    }
                );

                // Recupera la configurazione CSI attiva
                const CSIConfig = mongoose.model('CSIConfig');
                const config = await CSIConfig.findOne({ active: true });
                
                if (!config) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        'Nessuna configurazione CSI attiva trovata'
                    );
                }

                // Prepara il testUrl
                const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/csi/${testId}`;

                return this.sendResponse(res, {
                    token: testId,
                    url: testUrl,
                    testType: 'CSI',
                    config: {
                        timeLimit: config.validazione.tempoMassimoDomanda,
                        minQuestions: config.validazione.numeroMinimoDomande,
                        instructions: config.interfaccia.istruzioni
                    }
                }, 201);
            }
    
            // Per altri tipi di test, usa la logica esistente
            // Verifica disponibilità
            const availability = await this.repository.checkTestAvailability(studentId, test.tipo);
            logger.debug('Test availability check result:', JSON.stringify(availability, null, 2));
    
            if (!availability.available) {
                logger.debug('Test non disponibile:', {
                    studentId,
                    testId: testId,
                    reason: availability.reason,
                    nextAvailableDate: availability.nextAvailableDate
                });
                
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Test non disponibile al momento',
                    code: 'TEST_NOT_AVAILABLE',
                    details: {
                        reason: availability.reason,
                        nextAvailableDate: availability.nextAvailableDate,
                        cooldownPeriod: availability.cooldownPeriod
                    }
                });
            }
    
            // Aggiorna lo stato del test a "in_progress"
            await this.repository.updateTestStatus(
                testId,
                'in_progress',
                {
                    attempts: test.attempts + 1,
                    lastStarted: new Date()
                }
            );
    
            // Per i test CSI, recuperiamo eventuali configurazioni specifiche
            let config = {
                tempoLimite: test.configurazione?.tempoLimite || 30,
                questionVersion: test.configurazione?.questionVersion || '1.0.0'
            };
    
            // Costruisci l'URL del test (ora possiamo usare direttamente l'ID del test)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const testUrl = `${frontendUrl}/test/${test.tipo.toLowerCase()}/${testId}`;
    
            logger.info('Test started successfully:', {
                testId,
                studentId
            });
    
            // Invia una risposta semplificata con l'URL del test e la configurazione
            this.sendResponse(res, { 
                token: testId, // Utilizziamo l'ID del test come token
                url: testUrl,
                testType: test.tipo,
                config
            }, 201);
    
        } catch (error) {
            logger.error('Error starting assigned test:', {
                error: error.message,
                stack: error.stack,
                testId: req.params.testId,
                studentId: req.student?.id
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