// src/repositories/testRepository.js

const mongoose = require('mongoose');
const Test = require('../models/Test');
const Student = require('../models/Student');
const { getModels } = require('../models/Result');
const logger = require('../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');

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
            return test;
        } catch (error) {
            logger.error('Error finding test by ID:', {
                error: error.message,
                testId: id
            });
            throw error;
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
            logger.error('Error finding tests:', {
                error: error.message,
                filters
            });
            throw error;
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // Verifica tipo di test supportato
            if (testData.tipo !== 'CSI') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Tipo di test non supportato'
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
            logger.error('Error assigning test to student:', {
                error: error.message,
                studentId,
                assignedBy,
                testType: testData.tipo
            });
            throw error;
        }
    }

    /**
     * Assegna un test a tutti gli studenti di una classe
     * @param {Object} testData - Dati del test da assegnare
     * @param {string} classId - ID della classe
     * @param {string} assignedBy - ID dell'utente che assegna il test
     * @returns {Promise<Object>} Risultato dell'operazione
     */
    async assignTestToClass(testData, classId, assignedBy) {
        // Utilizziamo una sessione per garantire l'atomicità dell'operazione
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // 1. Verifica che la classe esista
            const Class = mongoose.model('Class');
            const classDoc = await Class.findById(classId).session(session);
            
            if (!classDoc) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Classe non trovata'
                );
            }
            
            // 2. Recupera tutti gli studenti attivi della classe
            const students = await Student.find({
                classId: classId,
                status: 'active',
                isActive: true
            }).session(session);
            
            if (!students.length) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Nessuno studente attivo trovato nella classe'
                );
            }
            
            logger.debug('Found students for class test assignment:', {
                classId,
                studentsCount: students.length
            });
            
            // 3. Verifica tipo di test supportato
            if (testData.tipo !== 'CSI') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Tipo di test non supportato'
                );
            }
            
            // 4. Per i test CSI, recupera la configurazione attiva
            let csiConfigId = null;
            if (testData.tipo === 'CSI') {
                const CSIConfig = mongoose.model('CSIConfig');
                const activeConfig = await CSIConfig.findOne({ active: true }).session(session);
                
                if (!activeConfig) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        'Nessuna configurazione CSI attiva trovata'
                    );
                }
                
                csiConfigId = activeConfig._id;
            }
            
            // 5. Crea un test per ogni studente
            const tests = [];
            const testPromises = students.map(async (student) => {
                const test = new Test({
                    nome: `Test ${testData.tipo} per ${student.firstName} ${student.lastName}`,
                    tipo: testData.tipo,
                    descrizione: `Test ${testData.tipo} assegnato a ${student.firstName} ${student.lastName} (classe ${classDoc.year}${classDoc.section})`,
                    configurazione: {
                        ...testData.configurazione,
                        questionVersion: '1.0.0'
                    },
                    studentId: student._id,
                    assignedBy,
                    assignedAt: new Date(),
                    status: 'pending',
                    attempts: 0,
                    active: true,
                    csiConfig: csiConfigId
                });
                
                await test.save({ session });
                tests.push(test);
                
                logger.debug('Assigned test to student in class:', {
                    testId: test._id,
                    studentId: student._id,
                    studentName: `${student.firstName} ${student.lastName}`
                });
                
                return test;
            });
            
            await Promise.all(testPromises);
            
            // 6. Commit della transazione
            await session.commitTransaction();
            
            // 7. Log del risultato
            logger.info('Tests assigned to all students in class:', {
                classId,
                testsCount: tests.length,
                assignedBy
            });
            
            return {
                success: true,
                testsAssigned: tests.length,
                students: students.map(s => ({
                    id: s._id,
                    name: `${s.firstName} ${s.lastName}`
                }))
            };
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error assigning tests to class:', {
                error: error.message,
                classId,
                assignedBy
            });
            throw error;
        } finally {
            session.endSession();
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

            // Query semplificata che seleziona solo i campi necessari
            const tests = await Test.find(filters)
                .select({
                    tipo: 1,
                    status: 1,
                    'configurazione.questionVersion': 1,
                    versione: 1,
                    csiConfig: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    nome: 1,
                    descrizione: 1
                })
                .lean();

            logger.debug('Raw tests found:', {
                count: tests.length,
                firstTest: tests[0] ? {
                    id: tests[0]._id,
                    tipo: tests[0].tipo,
                    status: tests[0].status
                } : 'No tests found',
                studentId
            });

            // Log dei test trovati in formato leggibile
            tests.forEach((test, index) => {
                logger.debug(`Test ${index + 1}:`, {
                    id: test._id,
                    tipo: test.tipo,
                    status: test.status,
                    nome: test.nome
                });
            });

            return tests;
        } catch (error) {
            logger.error('Error getting assigned tests:', {
                error: error.message,
                stack: error.stack,
                studentId,
                assignedBy
            });
            throw error;
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
            logger.error('Error getting tests by class:', {
                error: error.message,
                classId,
                assignedBy
            });
            throw error;
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Test non trovato'
                );
            }

            // Controlla se il test è già completato
            if (test.status === 'completed') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
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
            logger.error('Error revoking test:', {
                error: error.message,
                testId
            });
            throw error;
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
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
            logger.error('Error revoking class tests:', {
                error: error.message,
                classId,
                testType
            });
            throw error;
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
            logger.error('Error getting student tests:', {
                error: error.message,
                studentId,
                status
            });
            throw error;
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
                status: { $in: ['pending', 'in_progress'] },
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
                            nextAvailableDate: cooldownEndDate
                        };
                    }
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Test non trovato'
                );
            }

            return test;
        } catch (error) {
            logger.error('Error updating test status:', {
                error: error.message,
                testId,
                status
            });
            throw error;
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
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
            logger.error('Error saving test result:', {
                error: error.message,
                testId
            });
            throw error;
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
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
            logger.error('Error getting test results:', {
                error: error.message,
                testId
            });
            throw error;
        }
    }
}

module.exports = TestRepository;