// src/repositories/testRepository.js

const mongoose = require('mongoose');
const Test = require('../models/Test');
const Student = require('../models/Student');
const { getModels } = require('../models/Result');
const logger = require('../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');

class TestRepository {
    constructor() {
        this.models = getModels();
        this.model = Test; // This line fixes the initialization error
    }

    /**
     * Trova un test per ID
     * @param {string} id - ID del test
     * @returns {Promise<Object>} Il test trovato
     */
    async findById(id) {
        try {
            const test = await Test.findById(id);
            
            if (test && test.tipo === 'CSI') {
                // Get active version from config
                const CSIConfig = mongoose.model('CSIConfig');
                const activeConfig = await CSIConfig.findOne({ active: true });
                
                if (!activeConfig) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        'Nessuna configurazione CSI attiva trovata'
                    );
                }

                // Get questions for the active version
                const CSIQuestion = mongoose.model('CSIQuestion');
                const questions = await CSIQuestion.find({ 
                    active: true,
                    version: activeConfig.version
                }).lean();

                // Assign questions to test
                test.domande = questions.map((q, index) => ({
                    questionRef: q._id,
                    questionModel: 'CSIQuestion',
                    originalQuestion: q,
                    order: index + 1,
                    version: q.version
                }));

                await test.save();
            }

            return test;
        } catch (error) {
            return handleRepositoryError(
                error,
                'findById',
                { testId: id },
                'TestRepository'
            );
        }
    }

    /**
     * Trova test con filtri
     * @param {Object} filters - Filtri di ricerca
     * @returns {Promise<Array>} Lista dei test trovati
     */
    async find(filters = {}) {
        try {
            const tests = await Test.find(filters);
            return tests;
        } catch (error) {
            return handleRepositoryError(
                error,
                'find',
                { filters },
                'TestRepository'
            );
        }
    }

    /**
     * Assegna un test a uno studente
     * @param {Object} testData - Dati del test da assegnare
     * @param {string} studentId - ID dello studente
     * @param {string} assignedBy - ID dell'utente che assegna il test
     * @returns {Promise<Object>} Il test assegnato
     */
    async assignTestToStudent(testData, studentId, assignedBy) {
        try {
            // Verifica esistenza studente
            const student = await Student.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // Verifica tipo di test supportato
            if (testData.tipo !== 'CSI') {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Tipo di test non supportato'
                );
            }

            // NUOVA VERIFICA: Controlla se lo studente ha già un test non completato dello stesso tipo
            const existingTests = await Test.find({
                studentId,
                tipo: testData.tipo,
                status: { $ne: 'completed' }, // Qualsiasi stato diverso da completed
                active: true
            });

            if (existingTests.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_OPERATION,
                    `Lo studente ha già un test ${testData.tipo} assegnato che non è ancora stato completato`,
                    { 
                        existingTestId: existingTests[0]._id,
                        existingTestStatus: existingTests[0].status 
                    }
                );
            }

            // Per i test CSI, recupera la configurazione attiva
            let csiConfigId = null;
            if (testData.tipo === 'CSI') {
                const CSIConfig = mongoose.model('CSIConfig');
                const activeConfig = await CSIConfig.findOne({ active: true });
                
                if (!activeConfig) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        'Nessuna configurazione CSI attiva trovata'
                    );
                }
                
                csiConfigId = activeConfig._id;
                
                logger.debug('Retrieved active CSI config for test:', {
                    configId: csiConfigId,
                    configVersion: activeConfig.version
                });
            }

            // Creazione test
            const test = new Test({
                nome: `Test ${testData.tipo} per ${student.firstName} ${student.lastName}`,
                tipo: testData.tipo,
                descrizione: `Test ${testData.tipo} assegnato a ${student.firstName} ${student.lastName}`,
                configurazione: {
                    ...testData.configurazione,
                    questionVersion: '1.0.0' // Usa la versione più recente
                },
                studentId,
                assignedBy,
                assignedAt: new Date(),
                status: 'pending',
                attempts: 0,
                active: true,
                csiConfig: csiConfigId // Aggiunto il riferimento alla configurazione CSI
            });

            // Salva il test
            await test.save();

            // Log dell'operazione
            logger.info('Test assigned to student:', {
                testId: test._id,
                studentId,
                assignedBy,
                testType: test.tipo,
                csiConfigId
            });

            return test;
        } catch (error) {
            return handleRepositoryError(
                error,
                'assignTestToStudent',
                { testData, studentId, assignedBy },
                'TestRepository'
            );
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
            
            // Verifica se ci sono stati errori parziali di assegnazione
            if (result.failedAssignments && result.failedAssignments.length > 0) {
                logger.warn('Some test assignments failed:', {
                    classId,
                    failedCount: result.failedAssignments.length,
                    totalStudents: result.testsAssigned + result.failedAssignments.length
                });
                
                // Invia una risposta di successo parziale con dettagli sugli errori
                return this.sendResponse(res, { 
                    success: result.testsAssigned > 0,
                    message: `Test assegnati a ${result.testsAssigned} studenti. ${result.failedAssignments.length} assegnazioni fallite.`,
                    data: {
                        testsAssigned: result.testsAssigned,
                        failedAssignments: result.failedAssignments,
                        students: result.students
                    }
                }, 207); // 207 Multi-Status
            }
            
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
     * @param {string} studentId - ID dello studente
     * @param {string} assignedBy - Filtra per assegnatore (opzionale)
     * @returns {Promise<Array>} Lista dei test assegnati
     */
async getAssignedTests(studentId, assignedBy = null) {
    try {
        const filters = {
            studentId,
            active: true
        };

        // Se è specificato l'assegnatore, filtra solo i suoi test
        if (assignedBy) {
            filters.assignedBy = assignedBy;
        }

        logger.debug('Fetching tests with filters:', {
            filters,
            modelName: Test.modelName,
            collectionName: Test.collection.name
        });

        // Query estesa per recuperare tutti i campi necessari all'interfaccia
        // Aggiunta l'opzione di populate specifica per assignedBy
        const tests = await Test.find(filters)
            .populate('assignedBy', 'fullName username email role') // Popolare più campi
            .lean({ virtuals: true });

        // Recuperiamo le informazioni sullo studente per arricchire i dati
        const student = await Student.findById(studentId).select('firstName lastName email').lean();
        
        // Integriamo i dati dello studente in ogni test
        const enrichedTests = tests.map(test => ({
            ...test,
            studentFullName: student ? `${student.firstName} ${student.lastName}` : 'Nome non disponibile',
            studentEmail: student ? student.email : 'Email non disponibile'
        }));

        // Log dettagliato per debug
        enrichedTests.forEach((test, index) => {
            logger.debug(`Test ${index + 1}:`, {
                id: test._id,
                tipo: test.tipo,
                status: test.status,
                nome: test.nome,
                assignedBy: test.assignedBy ? (
                    typeof test.assignedBy === 'object' ?
                    {
                        id: test.assignedBy._id,
                        fullName: test.assignedBy.fullName,
                        username: test.assignedBy.username
                    } : test.assignedBy
                ) : 'Not set'
            });
        });

        return enrichedTests;
    } catch (error) {
        return handleRepositoryError(
            error,
            'getAssignedTests',
            { studentId, assignedBy },
            'TestRepository'
        );
    }
}

    /**
     * Recupera i test assegnati a tutti gli studenti di una classe
     * @param {string} classId - ID della classe
     * @param {string} assignedBy - Filtra per assegnatore (opzionale)
     * @returns {Promise<Array>} Lista dei test assegnati raggruppati per studente
     */
    async getAssignedTestsByClass(classId, assignedBy = null) {
        try {
            // 1. Recupera gli studenti della classe
            const students = await Student.find({ 
                classId: classId,
                status: 'active',
                isActive: true
            }).select('_id firstName lastName');
            
            if (!students.length) {
                return [];
            }
            
            // 2. Costruisci i filtri
            const studentIds = students.map(s => s._id);
            const filters = {
                studentId: { $in: studentIds },
                active: true
            };
            
            // Se è specificato l'assegnatore, filtra solo i suoi test
            if (assignedBy) {
                filters.assignedBy = assignedBy;
            }
            
            // 3. Recupera i test
            const tests = await Test.find(filters)
                .select({
                    studentId: 1,
                    tipo: 1,
                    status: 1,
                    'configurazione.questionVersion': 1,
                    versione: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    nome: 1,
                    descrizione: 1,
                    assignedAt: 1
                })
                .lean();
            
            // 4. Organizza i test per studente
            const studentMap = new Map();
            students.forEach(student => {
                studentMap.set(student._id.toString(), {
                    student: {
                        id: student._id,
                        firstName: student.firstName,
                        lastName: student.lastName
                    },
                    tests: []
                });
            });
            
            tests.forEach(test => {
                const studentId = test.studentId.toString();
                if (studentMap.has(studentId)) {
                    studentMap.get(studentId).tests.push(test);
                }
            });
            
            // 5. Converti la Map in array
            const result = Array.from(studentMap.values());
            
            logger.debug('Tests by class retrieved:', {
                classId,
                studentsCount: result.length,
                totalTests: tests.length
            });
            
            return result;
        } catch (error) {
            return handleRepositoryError(
                error,
                'getAssignedTestsByClass',
                { classId, assignedBy },
                'TestRepository'
            );
        }
    }

    /**
     * Revoca un test assegnato
     * @param {string} testId - ID del test da revocare
     * @returns {Promise<Object>} Risultato dell'operazione
     */
    async revokeTest(testId) {
        try {
            // Verifica esistenza del test
            const test = await Test.findById(testId);
            if (!test) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato'
                );
            }

            // Controlla se il test è già completato
            if (test.status === 'completed') {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Impossibile revocare un test già completato'
                );
            }

            // Aggiorna il test impostando active a false
            const result = await Test.updateOne(
                { _id: testId },
                { 
                    active: false,
                    revokedAt: new Date()
                }
            );

            // Log dell'operazione
            logger.info('Test revoked:', {
                testId,
                result: result.modifiedCount > 0 ? 'success' : 'no changes'
            });

            return {
                success: result.modifiedCount > 0,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            return handleRepositoryError(
                error,
                'revokeTest',
                { testId },
                'TestRepository'
            );
        }
    }

    /**
     * Revoca tutti i test assegnati agli studenti di una classe
     * @param {string} classId - ID della classe
     * @param {string} testType - Tipo di test da revocare (opzionale)
     * @returns {Promise<Object>} Risultato dell'operazione
     */
    async revokeClassTests(classId, testType = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // 1. Recupera gli ID degli studenti nella classe
            const students = await Student.find({
                classId: classId,
                status: 'active',
                isActive: true
            }).select('_id').session(session);
            
            if (!students.length) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuno studente trovato nella classe'
                );
            }
            
            const studentIds = students.map(s => s._id);
            
            // 2. Costruisci il filtro per i test
            const filter = {
                studentId: { $in: studentIds },
                active: true,
                status: { $ne: 'completed' } // Escludiamo i test già completati
            };
            
            // Se specificato, filtriamo per tipo di test
            if (testType) {
                filter.tipo = testType;
            }
            
            // 3. Revoca i test
            const result = await Test.updateMany(
                filter,
                {
                    active: false,
                    revokedAt: new Date()
                },
                { session }
            );
            
            // 4. Commit della transazione
            await session.commitTransaction();
            
            // 5. Log dell'operazione
            logger.info('Class tests revoked:', {
                classId,
                testType: testType || 'all',
                modifiedCount: result.modifiedCount
            });
            
            return {
                success: true,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'revokeClassTests',
                { classId, testType },
                'TestRepository'
            );
        } finally {
            session.endSession();
        }
    }

    /**
     * Recupera i test di uno studente
     * @param {string} studentId - ID dello studente
     * @param {string} status - Filtra per stato (opzionale)
     * @returns {Promise<Array>} Lista dei test dello studente
     */
    async getStudentTests(studentId, status = null) {
        try {
            const filters = {
                studentId,
                active: true
            };

            // Se specificato, filtra per stato
            if (status) {
                filters.status = status;
            }

            const tests = await Test.find(filters)
                .sort({ assignedAt: -1 });

            return tests;
        } catch (error) {
            return handleRepositoryError(
                error,
                'getStudentTests',
                { studentId, status },
                'TestRepository'
            );
        }
    }

    /**
 * Verifica la disponibilità di un test per uno studente
 * @param {string} studentId - ID dello studente
 * @param {string} testType - Tipo di test
 * @returns {Promise<Object>} Stato di disponibilità
 */
async checkTestAvailability(studentId, testType) {
    try {
        // Verifica se ci sono test attivi dello stesso tipo
        const activeTests = await Test.find({
            studentId,
            tipo: testType,
            status: 'in_progress',  // Solo in_progress
            active: true
        });

        if (activeTests.length > 0) {
            return {
                available: false,
                reason: 'ACTIVE_TEST_EXISTS',
                activeTest: activeTests[0]._id
            };
        }

        // Verifica il cooldown period
        const latestCompletedTest = await Test.findOne({
            studentId,
            tipo: testType,
            status: 'completed',
            active: true
        }).sort({ 'dataCompletamento': -1 });

        if (latestCompletedTest) {
            // Recupera la configurazione del cooldown period
            const cooldownPeriod = latestCompletedTest.configurazione?.cooldownPeriod || 0; // in giorni
            
            if (cooldownPeriod > 0) {
                const completionDate = new Date(latestCompletedTest.dataCompletamento);
                const cooldownEndDate = new Date(completionDate);
                cooldownEndDate.setDate(cooldownEndDate.getDate() + cooldownPeriod);
                
                if (cooldownEndDate > new Date()) {
                    return {
                        available: false,
                        reason: 'COOLDOWN_PERIOD',
                        nextAvailableDate: cooldownEndDate,
                        cooldownPeriod: cooldownPeriod
                    };
                }
            }
        }

        // Verifiche sui tentativi massimi
        // Nota: qui non facciamo più riferimento a un testId specifico
        const pendingTests = await Test.find({
            studentId,
            tipo: testType,
            status: 'pending',
            active: true
        });

        if (pendingTests.length > 0) {
            const test = pendingTests[0];
            if (test.configurazione?.tentativiMax && test.attempts >= test.configurazione.tentativiMax) {
                return {
                    available: false,
                    reason: 'MAX_ATTEMPTS_REACHED',
                    maxAttempts: test.configurazione.tentativiMax,
                    currentAttempts: test.attempts
                };
            }
        }

        return {
            available: true
        };
    } catch (error) {
        logger.error('Error checking test availability:', {
            error: error.message,
            studentId, 
            testType
        });
        throw error;
    }
}

    /**
     * Aggiorna lo stato di un test
     * @param {string} testId - ID del test
     * @param {string} status - Nuovo stato
     * @param {Object} additionalData - Dati aggiuntivi
     * @returns {Promise<Object>} Il test aggiornato
     */
    async updateTestStatus(testId, status, additionalData = {}) {
        try {
            const updateData = {
                status,
                ...additionalData
            };

            const test = await Test.findByIdAndUpdate(
                testId,
                updateData,
                { new: true }
            );

            if (!test) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato'
                );
            }

            return test;
        } catch (error) {
            return handleRepositoryError(
                error,
                'updateTestStatus',
                { testId, status, additionalData },
                'TestRepository'
            );
        }
    }

    /**
     * Salva il risultato di un test
     * @param {string} testId - ID del test
     * @param {Object} resultData - Dati del risultato
     * @returns {Promise<Object>} Il risultato salvato
     */
    async saveTestResult(testId, resultData) {
        try {
            // Recupera il test
            const test = await Test.findById(testId);
            if (!test) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato'
                );
            }

            // Aggiorna lo stato del test
            test.status = 'completed';
            test.dataCompletamento = resultData.completedAt;
            test.risposte = resultData.answers;

            // Salva il test aggiornato
            await test.save();

            // TODO: Implementare il calcolo del risultato in base al tipo di test
            // Per ora, restituiamo solo il test aggiornato
            return test;
        } catch (error) {
            return handleRepositoryError(
                error,
                'saveTestResult',
                { testId, resultData },
                'TestRepository'
            );
        }
    }

    /**
     * Ottiene i risultati base di un test
     * @param {string} testId - ID del test
     * @returns {Promise<Object>} Statistiche del test
     */
    async getBaseResults(testId) {
        try {
            const test = await Test.findById(testId);
            if (!test) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato'
                );
            }

            // Verifica se il test è completato
            if (test.status !== 'completed') {
                return {
                    completed: false,
                    message: 'Il test non è ancora stato completato'
                };
            }

            // TODO: Implementare calcolo statistiche in base al tipo di test
            // Per ora, restituiamo solo info base
            return {
                completed: true,
                completedAt: test.dataCompletamento,
                answersCount: test.risposte?.length || 0,
                testType: test.tipo
            };
        } catch (error) {
            return handleRepositoryError(
                error,
                'getBaseResults',
                { testId },
                'TestRepository'
            );
        }
    }
}

module.exports = TestRepository;