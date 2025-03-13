// src/repositories/StudentRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Student, School, Class } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');


/**
 * Repository per la gestione delle operazioni relative agli studenti
 * Estende le funzionalità base del BaseRepository
 */
class StudentRepository extends BaseRepository {
    constructor() {
        super(Student);
        this.studentAuthService = null; // Sarà iniettato dopo
    }

    setStudentAuthService(service) {
        this.studentAuthService = service;
    }


    /**
     * Trova studenti con dettagli completi
     * @param {Object} filters - Filtri di ricerca
     * @param {Object} options - Opzioni aggiuntive (sort, limit, skip)
     * @returns {Promise<Array>} Lista degli studenti con relazioni popolate
     */

    async findWithDetails(filters = {}, options = {}) {
        try {
            logger.debug('Starting findWithDetails with:', {
                filters,
                options
            });
            const pipeline = [
                { $match: filters },
                // Lookup ottimizzato per i test
                {
                    $lookup: {
                        from: 'results',
                        let: { studentId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$studentId', '$$studentId'] },
                                            { $eq: ['$completato', true] }
                                        ]
                                    }
                                }
                            },
                            { $count: 'total' }
                        ],
                        as: 'testStats'
                    }
                },
                // Modifica il lookup per mainTeacher per includere più campi
            {
                $lookup: {
                    from: 'users',
                    localField: 'mainTeacher',
                    foreignField: '_id',
                    as: 'mainTeacherDetails'
                }
            },
            
            // Aggiungi un nuovo lookup per i teachers
            {
                $lookup: {
                    from: 'users',
                    localField: 'teachers',
                    foreignField: '_id',
                    as: 'teachersDetails'
                }
            },
                // Lookup essenziale per school
                {
                    $lookup: {
                        from: 'schools',
                        localField: 'schoolId',
                        foreignField: '_id',
                        as: 'schoolDetails'
                    }
                },
                // Lookup essenziale per class
                {
                    $lookup: {
                        from: 'classes',
                        localField: 'classId',
                        foreignField: '_id',
                        as: 'classDetails'
                    }
                },
                 // Modifica dell'addFields per gestire meglio il conteggio
                {
                    $addFields: {
                        testCount: {
                            $cond: {
                                if: { $eq: [{ $size: '$testStats' }, 0] },
                                then: 0,
                                else: { $arrayElemAt: ['$testStats.total', 0] }
                            }
                        },
                        mainTeacher: { $arrayElemAt: ['$mainTeacherDetails', 0] },
                        teachers: '$teachersDetails',
                        schoolId: { $arrayElemAt: ['$schoolDetails', 0] },
                        classId: { $arrayElemAt: ['$classDetails', 0] }
                    }
                },
                // Proiezione ottimizzata
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        status: 1,
                        specialNeeds: 1,
                        testCount: 1,
                        schoolId: {
                            _id: 1,
                            name: 1
                        },
                        classId: {
                            _id: 1,
                            year: 1,
                            section: 1
                        },
                        // Campi dettagliati dei docenti
                        mainTeacher: {
                            _id: 1,
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            role: 1,
                            assignedSchoolIds: 1
                        },
                        teachers: {
                            _id: 1,
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            role: 1,
                            assignedSchoolIds: 1
                        }
                    }
                }
            ];
    
            if (options.sort) {
                pipeline.push({ $sort: options.sort });
            }
    
            if (options.skip) {
                pipeline.push({ $skip: options.skip });
            }
    
            if (options.limit) {
                pipeline.push({ $limit: options.limit });
            }
    
            // Changed: logging the pipeline object directly instead of using JSON.stringify 
            // This prevents character by character logging
            logger.debug('Executing aggregation with pipeline:', { pipeline });

            const students = await this.model.aggregate(pipeline);
            logger.debug('Aggregation results:', {
                count: students.length,
                sampleStudent: students[0] ? {
                    id: students[0]._id,
                    hasTestCount: 'testCount' in students[0],
                    hasMainTeacher: 'mainTeacher' in students[0]
                } : null
            });

            return students;
        } catch (error) {
            return handleRepositoryError(
                error,
                'findWithDetails',
                { filters, options },
                'StudentRepository'
            );
        }
    }

    
     /**
     * Trova studenti non assegnati ad una classe per una specifica scuola
     * @param {string} schoolId - ID della scuola
     * @param {Object} options - Opzioni di ricerca (es: filtri per nome)
     * @returns {Promise<Array>} Lista degli studenti non assegnati
     */
     async findUnassignedStudents(schoolId, options = {}) {
        try {
            logger.debug('Inizio ricerca studenti non assegnati:', {
                schoolId,
                options
            });
    
            if (!mongoose.Types.ObjectId.isValid(schoolId)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_FORMAT,
                    `SchoolId non valido: ${schoolId}`
                );
            }
    
            // Query principale
            const query = {
                schoolId: new mongoose.Types.ObjectId(schoolId),
                isActive: true,
                $or: [
                    // Caso 1: Non ha una classe assegnata
                    { classId: null },
                    // Caso 2: Ha bisogno di assegnazione
                    { needsClassAssignment: true }
                ]
            };
    
            // Log della query per debug
            logger.debug('Query per studenti non assegnati:', JSON.stringify(query, null, 2));
    
            // Esegui la query con pipeline di aggregazione per ottenere più informazioni
            const pipeline = [
                { $match: query },
                // Lookup per la scuola
                {
                    $lookup: {
                        from: 'schools',
                        localField: 'schoolId',
                        foreignField: '_id',
                        as: 'schoolData'
                    }
                },
                // Aggiungi i campi calcolati
                {
                    $addFields: {
                        schoolDetails: { $arrayElemAt: ['$schoolData', 0] }
                    }
                },
                // Ordina per cognome e nome
                { $sort: { lastName: 1, firstName: 1 } },
                // Rimuovi i campi non necessari
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        gender: 1,
                        dateOfBirth: 1,
                        status: 1,
                        needsClassAssignment: 1,
                        classId: 1,
                        isActive: 1,
                        schoolName: '$schoolDetails.name'
                    }
                }
            ];
    
            const students = await this.model.aggregate(pipeline);
    
            // Log dettagliato dei risultati
            logger.debug('Studenti non assegnati trovati:', {
                count: students.length,
                students: students.map(s => ({
                    id: s._id,
                    name: `${s.firstName} ${s.lastName}`,
                    hasClassId: !!s.classId,
                    needsAssignment: s.needsClassAssignment,
                    isActive: s.isActive,
                    status: s.status
                }))
            });
    
            return students;
    
        } catch (error) {
            return handleRepositoryError(
                error,
                'findUnassignedStudents',
                { schoolId, options },
                'StudentRepository'
            );
        }
    }

async findUnassignedToSchoolStudents() {
    try {
        logger.debug('Cercando studenti senza scuola...');
        
        const query = {
            $or: [
                { schoolId: null },
                { schoolId: { $exists: false } }
            ],
        };

        logger.debug('Query di ricerca:', query);
        
        const students = await this.findWithDetails(query, {
            sort: { createdAt: -1 }
        });

        logger.debug(`Trovati ${students.length} studenti non assegnati:`, {
            students: students.map(s => ({
                id: s._id,
                name: `${s.firstName} ${s.lastName}`,
                status: s.status,
                schoolId: s.schoolId,
                isActive: s.isActive
            }))
        });
        
        return students;
    } catch (error) {
        return handleRepositoryError(
            error,
            'findUnassignedToSchoolStudents',
            {},
            'StudentRepository'
        );
    }
}
    
async batchAssignToClass(studentIds, { classId, academicYear }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verifica esistenza e dettagli della classe con populate più specifico
        const classDoc = await Class.findById(classId)
            .populate('mainTeacher', '_id firstName lastName email')  // Specifichiamo i campi
            .populate('teachers', '_id firstName lastName email')     // Specifichiamo i campi
            .session(session);

        if (!classDoc) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Classe non trovata'
            );
        }

        // Verifica presenza docente principale
        if (!classDoc.mainTeacher?._id) {
            logger.warn('MainTeacher not found for class:', { classId });
        }

        // 2. Verifica studenti e che siano assegnabili
        const students = await this.model.find({
            _id: { $in: studentIds },
            schoolId: classDoc.schoolId,
            needsClassAssignment: true,
            classId: null
        }).session(session);

        // 3. Verifica capacità della classe
        const currentStudentsCount = classDoc.students?.length || 0;
        if (currentStudentsCount + students.length > classDoc.capacity) {
            throw createError(
                ErrorTypes.BUSINESS.CLASS_FULL,
                `Capacità classe superata`
            );
        }

        // Prepara i dati dei docenti verificando la loro validità
        const teacherIds = classDoc.teachers?.filter(t => t?._id).map(t => t._id) || [];
        const mainTeacherId = classDoc.mainTeacher?._id;

        // 4. Aggiorna gli studenti
        const updateResult = await this.model.updateMany(
            {
                _id: { $in: studentIds },
                schoolId: classDoc.schoolId,
                needsClassAssignment: true
            },
            {
                $set: {
                    classId: classId,
                    status: 'active',
                    needsClassAssignment: false,
                    currentYear: classDoc.year,
                    section: classDoc.section,
                    mainTeacher: mainTeacherId,
                    teachers: teacherIds,
                    lastClassChangeDate: new Date()
                },
                $push: {
                    classChangeHistory: {
                        fromClass: null,
                        toClass: classId,
                        fromSection: null,
                        toSection: classDoc.section,
                        fromYear: null,
                        toYear: classDoc.year,
                        date: new Date(),
                        academicYear: academicYear,
                        reason: 'Assegnazione a nuova classe',
                        mainTeacher: mainTeacherId,
                        teachers: teacherIds
                    }
                }
            },
            { session }
        );

        // 5. Aggiorna la classe
        const newStudentRecords = studentIds.map(studentId => ({
            studentId: studentId,
            status: 'active',
            joinedAt: new Date(),
            mainTeacher: mainTeacherId
        }));

        classDoc.students.push(...newStudentRecords);
        await classDoc.save({ session });

        // Log del risultato per debug
        logger.debug('Assignment completed:', {
            studentsAssigned: updateResult.modifiedCount,
            mainTeacher: mainTeacherId,
            teachersCount: teacherIds.length
        });

        // 6. Aggiorna gli assignedStudentIds per tutti gli insegnanti
        if (teacherIds.length > 0 || mainTeacherId) {
            const allTeacherIds = [...new Set([...teacherIds, mainTeacherId].filter(Boolean))];
            await mongoose.model('User').updateMany(
                { _id: { $in: allTeacherIds } },
                {
                    $addToSet: {
                        assignedStudentIds: { $each: studentIds }
                    }
                },
                { session }
            );
        }

        await session.commitTransaction();
        
        return {
            success: true,
            modifiedCount: updateResult.modifiedCount,
            className: `${classDoc.year}${classDoc.section}`
        };

    } catch (error) {
        await session.abortTransaction();
        return handleRepositoryError(
            error,
            'batchAssignToClass',
            { studentIds, classId, academicYear },
            'StudentRepository'
        );
    } finally {
        session.endSession();
    }
}

    async batchAssignToSchool(studentIds, schoolId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug('Starting batch school assignment:', {
                studentCount: studentIds.length,
                schoolId
            });

            // 1. Verifica che la scuola esista
            const school = await School.findById(schoolId).session(session);
            
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            // 2. Verifica che gli studenti esistano
            const students = await Student.find({
                _id: { $in: studentIds },
                $or: [
                    { schoolId: { $exists: false } },
                    { schoolId: null }
                ]
            }).session(session);

            logger.debug('Students found:', {
                requested: studentIds.length,
                found: students.length,
                studentDetails: students.map(s => ({
                    id: s._id,
                    hasSchoolId: !!s.schoolId
                }))
            });

            if (students.length !== studentIds.length) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Alcuni studenti selezionati non sono validi o hanno già una scuola assegnata'
                );
            }

            // 3. Aggiorna gli studenti
            const updateResult = await Student.updateMany(
                {
                    _id: { $in: studentIds },
                    $or: [
                        { schoolId: { $exists: false } },
                        { schoolId: null }
                    ]
                },
                {
                    $set: {
                        schoolId: schoolId,
                        status: 'pending',
                        needsClassAssignment: true,
                        lastSchoolAssignmentDate: new Date()
                    }
                },
                { session }
            );

            await session.commitTransaction();
            
            return {
                success: true,
                modifiedCount: updateResult.modifiedCount,
                schoolName: school.name
            };
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'batchAssignToSchool',
                { studentIds, schoolId },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    /**
     * Trova studenti per classe con controllo permessi
     * @param {string} classId - ID della classe
     * @param {string} teacherId - ID del docente (per controllo permessi)
     * @returns {Promise<Array>} Lista degli studenti della classe
     */
    async findByClass(classId, teacherId = null) {
        try {
            const query = { classId, isActive: true };
            
            // Se specificato teacherId, verifica i permessi
            if (teacherId) {
                const classDoc = await Class.findOne({
                    _id: classId,
                    $or: [
                        { mainTeacher: teacherId },
                        { teachers: teacherId }
                    ]
                });

                if (!classDoc) {
                    throw createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Non autorizzato ad accedere a questa classe'
                    );
                }
            }

            return await this.findWithDetails(query, {
                sort: { lastName: 1, firstName: 1 }
            });
        } catch (error) {
            return handleRepositoryError(
                error,
                'findByClass',
                { classId, teacherId },
                'StudentRepository'
            );
        }
    }

    /**
     * Trova studenti per docente
     * @param {string} teacherId - ID del docente
     * @param {Object} options - Opzioni di query
     * @returns {Promise<Array>} Lista degli studenti associati al docente
     */
    async findByTeacher(teacherId, options = {}) {
        try {
            const query = {
                isActive: true,
                $or: [
                    { mainTeacher: teacherId },
                    { teachers: teacherId }
                ]
            };

            return await this.findWithDetails(query, options);
        } catch (error) {
            return handleRepositoryError(
                error,
                'findByTeacher',
                { teacherId, options },
                'StudentRepository'
            );
        }
    }

    /**
     * Cerca studenti per nome/cognome con fuzzy matching
     * @param {string} searchTerm - Termine di ricerca
     * @param {string} schoolId - ID della scuola (opzionale)
     * @returns {Promise<Array>} Lista degli studenti che matchano la ricerca
     */
    async searchByName(searchTerm, schoolId = null) {
        try {
            const query = {
                isActive: true,
                $or: [
                    { firstName: { $regex: searchTerm, $options: 'i' } },
                    { lastName: { $regex: searchTerm, $options: 'i' } }
                ]
            };

            if (schoolId) {
                query.schoolId = schoolId;
            }

            return await this.findWithDetails(query, {
                sort: { lastName: 1, firstName: 1 }
            });
        } catch (error) {
            return handleRepositoryError(
                error,
                'searchByName',
                { searchTerm, schoolId },
                'StudentRepository'
            );
        }
    }

    /**
     * Crea un nuovo studente con validazioni aggiuntive
     * @param {Object} studentData - Dati dello studente
     * @returns {Promise<Object>} Studente creato
     */
    async create(studentData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verifica l'unicità dell'email e del codice fiscale
            const exists = await this.model.findOne({
                $or: [
                    { email: studentData.email },
                ]
            });

            if (exists) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }

            // Se viene specificata una classe, verifica che esista e abbia posto
            if (studentData.classId) {
                const classDoc = await Class.findById(studentData.classId);
                if (!classDoc) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        'Classe non trovata'
                    );
                }

                const student = new this.model(studentData);
                const canBeAssigned = await student.canBeAssignedToClass(studentData.classId);
                if (!canBeAssigned) {
                    throw createError(
                        ErrorTypes.BUSINESS.INVALID_OPERATION,
                        'Non è possibile assegnare lo studente a questa classe'
                    );
                }
            }

            const newStudent = await this.model.create([studentData], { session });
            await session.commitTransaction();

            return newStudent[0];
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'create',
                { studentData },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    // Aggiungiamo un nuovo metodo specifico per la creazione con classe
    async createWithClass(studentData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Verifica l'unicità dell'email
            const exists = await this.model.findOne({
                email: studentData.email
            }).session(session);

            if (exists) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }

            // 2. Verifica e recupera la classe
            const classDoc = await Class.findById(studentData.classId)
                .populate('mainTeacher', '_id firstName lastName email')
                .populate('teachers', '_id firstName lastName email')
                .session(session);
                
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            // 3. Verifica capacità classe
            if (classDoc.students.length >= classDoc.capacity) {
                throw createError(
                    ErrorTypes.BUSINESS.CLASS_FULL,
                    'La classe ha raggiunto la capacità massima'
                );
            }

            // 4. Prepara i dati dello studente includendo teacher e mainTeacher
            const studentWithTeachers = {
                ...studentData,
                // Assicurati che mainTeacher e teachers vengano sempre assegnati
                mainTeacher: classDoc.mainTeacher?._id || studentData.mainTeacher,
                teachers: classDoc.teachers?.map(t => t._id) || studentData.teachers || []
            };

            // 5. Crea lo studente
            const newStudent = await this.model.create([studentWithTeachers], { session });

            // 6. Aggiorna la classe
            classDoc.students.push({
                studentId: newStudent[0]._id,
                joinedAt: new Date(),
                status: 'active'
            });

            await classDoc.save({ session });
            await session.commitTransaction();

            // 7. Student creato con successo, ora genera le credenziali
            // Questo è fuori dalla transazione perché anche se fallisce
            // vogliamo comunque che lo studente venga creato
            try {
                if (this.studentAuthService) {
                    const credentials = await this.studentAuthService.generateCredentials(newStudent[0]._id);
                    logger.info('Credenziali generate automaticamente', { 
                        studentId: newStudent[0]._id,
                        username: credentials.username
                    });
                    
                    // Aggiorna il flag hasCredentials nello studente
                    await this.model.findByIdAndUpdate(newStudent[0]._id, {
                        $set: { 
                            hasCredentials: true,
                            credentialsSentAt: new Date()
                        }
                    });
                } else {
                    logger.warn('Impossibile generare credenziali: servizio non disponibile', {
                        studentId: newStudent[0]._id
                    });
                }
            } catch (authError) {
                logger.error('Errore nella generazione automatica delle credenziali', { 
                    error: authError, 
                    studentId: newStudent[0]._id 
                });
                // Non interrompiamo il flusso, lo studente è già stato creato
            }

            return newStudent[0];
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'createWithClass',
                { studentData },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    /**
     * Assegna uno studente a una classe
     * @param {string} studentId - ID dello studente
     * @param {string} classId - ID della classe
     * @returns {Promise<Object>} Studente aggiornato
     */
    async assignToClass(studentId, classId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const student = await this.model.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            const classDoc = await Class.findById(classId)
                .populate('mainTeacher')
                .populate('teachers');

            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            const canBeAssigned = await student.canBeAssignedToClass(classId);
            if (!canBeAssigned) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Non è possibile assegnare lo studente a questa classe'
                );
            }

            // Raccogli tutti gli ID degli insegnanti (principale + co-docenti)
            const teacherIds = [];
            if (classDoc.mainTeacher) {
                teacherIds.push(classDoc.mainTeacher._id);
            }
            if (classDoc.teachers && classDoc.teachers.length > 0) {
                teacherIds.push(...classDoc.teachers.map(t => t._id));
            }

            // Aggiorna lo storico se necessario
            if (student.classId && student.classId.toString() !== classId) {
                student.classChangeHistory.push({
                    fromClass: student.classId,
                    toClass: classId,
                    fromSection: student.section,
                    toSection: classDoc.section,
                    fromYear: student.currentYear,
                    toYear: classDoc.year,
                    academicYear: classDoc.academicYear,
                    date: new Date(),
                    reason: 'Assegnazione a nuova classe'
                });
            }

            // Aggiorna i dati dello studente
            student.classId = classId;
            student.section = classDoc.section;
            student.currentYear = classDoc.year;
            student.mainTeacher = classDoc.mainTeacher;
            student.teachers = classDoc.teachers;
            student.needsClassAssignment = false;
            student.lastClassChangeDate = new Date();

            await student.save({ session });

            // Aggiorna la classe
            await classDoc.updateOne(
                { _id: classId },
                {
                    $addToSet: {
                        students: { studentId: student._id }
                    }
                }
            );

            // Aggiorna gli assignedStudentIds per tutti gli insegnanti
            if (teacherIds.length > 0) {
                await mongoose.model('User').updateMany(
                    { _id: { $in: teacherIds } },
                    {
                        $addToSet: {
                            assignedStudentIds: student._id
                        }
                    }
                );
            }

            await session.commitTransaction();
            return student;
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'assignToClass',
                { studentId, classId },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    /**
     * Rimuove uno studente da una classe
     * @param {string} studentId - ID dello studente
     * @param {string} reason - Motivo della rimozione
     * @returns {Promise<Object>} Studente aggiornato
     */
    async removeFromClass(studentId, reason = 'Rimozione dalla classe') {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const student = await this.model.findById(studentId).session(session);
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }
    
            // Se lo studente è assegnato a una classe
            if (student.classId) {
                // 1. Aggiorna lo storico
                student.classChangeHistory.push({
                    fromClass: student.classId,
                    toClass: null,
                    fromSection: student.section,
                    toSection: null,
                    fromYear: student.currentYear,
                    toYear: null,
                    date: new Date(),
                    reason: reason
                });
    
                // 2. Rimuovi lo studente dall'array students della classe
                await Class.updateOne(
                    { _id: student.classId },
                    { 
                        $pull: { 
                            students: { 
                                studentId: student._id 
                            } 
                        } 
                    }
                ).session(session);
    
                // 3. Resetta i dati dello studente
                student.classId = null;
                student.section = null;
                student.mainTeacher = null;
                student.teachers = [];
                student.needsClassAssignment = true;
                student.lastClassChangeDate = new Date();
    
                await student.save({ session });
            }
    
            await session.commitTransaction();
            return student;
    
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'removeFromClass',
                { studentId, reason },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    /**
     * Elimina uno studente e gestisce le relazioni
     * @param {string} studentId - ID dello studente
     * @param {boolean} cascade - Se true, rimuove anche tutti i riferimenti in altre collections
     * @returns {Promise<Object>} Risultato dell'eliminazione
     */
    async delete(studentId, cascade = false) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const student = await this.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // Se cascade è true, rimuovi i riferimenti nelle classi e negli utenti
            if (cascade) {
                logger.debug('Eliminazione in cascata attivata per lo studente:', {
                    studentId,
                    hasClass: !!student.classId
                });

                // 1. Rimuovi lo studente dalle classi
                if (student.classId) {
                    logger.debug('Rimuovendo studente dalla classe:', { classId: student.classId });
                    await Class.updateOne(
                        { _id: student.classId },
                        { $pull: { students: { studentId: new mongoose.Types.ObjectId(studentId) } } }
                    ).session(session);
                }

                // 2. Rimuovi lo studente dagli utenti (docenti/tutor che lo hanno assegnato)
                logger.debug('Rimuovendo studente dagli utenti assegnati');
                const User = mongoose.model('User');
                await User.updateMany(
                    { assignedStudentIds: new mongoose.Types.ObjectId(studentId) },
                    { $pull: { assignedStudentIds: new mongoose.Types.ObjectId(studentId) } }
                ).session(session);
                
                // 3. Rimuovi i risultati dei test associati allo studente
                const Result = mongoose.model('Result');
                if (Result) {
                    logger.debug('Rimuovendo risultati dei test dello studente');
                    await Result.deleteMany({ 
                        studentId: new mongoose.Types.ObjectId(studentId) 
                    }).session(session);
                }
            }

            // Elimina lo studente
            await this.model.deleteOne({ _id: studentId }, { session });
            await session.commitTransaction();

            return { success: true, message: 'Studente eliminato con successo' };
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'delete',
                { studentId, cascade },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    /**
     * Aggiorna i dati di uno studente con validazioni
     * @param {string} studentId - ID dello studente
     * @param {Object} updateData - Dati da aggiornare
     * @returns {Promise<Object>} Studente aggiornato
     */
    async update(studentId, updateData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verifica esistenza dello studente
            const student = await this.model.findById(studentId).session(session);
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // Verifica unicità email/codice fiscale se vengono modificati
            if (updateData.email || updateData.fiscalCode) {
                const exists = await this.model.findOne({
                    _id: { $ne: studentId },
                    $or: [
                        updateData.email ? { email: updateData.email } : null,
                        updateData.fiscalCode ? { fiscalCode: updateData.fiscalCode } : null
                    ].filter(Boolean)
                }).session(session);

                if (exists) {
                    throw createError(
                        ErrorTypes.RESOURCE.ALREADY_EXISTS,
                        'Email o codice fiscale già registrati'
                    );
                }
            }

            // Gestione speciale per l'aggiornamento dei docenti
            if (updateData.teachers && updateData.updateTeacherAssignments) {
                // Normalizza gli ID dei docenti
                updateData.teachers = updateData.teachers.map(teacherId => 
                    typeof teacherId === 'string' ? teacherId : teacherId._id
                );

                // Ottiene i docenti precedenti dello studente
                const previousTeachers = student.teachers || [];
                
                // Converte in array di stringhe (ID)
                const previousTeacherIds = previousTeachers.map(teacher => 
                    teacher.toString()
                );

                // Converti i nuovi ID docenti in stringhe per confronto
                const newTeacherIds = updateData.teachers.map(id => id.toString());
                
                // Calcola i docenti aggiunti e rimossi
                const addedTeachers = newTeacherIds.filter(id => !previousTeacherIds.includes(id));
                const removedTeachers = previousTeacherIds.filter(id => !newTeacherIds.includes(id));

                logger.debug('Aggiornamento relazioni docenti-studente:', {
                    studentId,
                    addedTeachers,
                    removedTeachers
                });

                const User = mongoose.model('User');
                
                // Aggiungi lo studentId all'array assignedStudentIds dei docenti aggiunti
                if (addedTeachers.length > 0) {
                    await User.updateMany(
                        { _id: { $in: addedTeachers } },
                        { $addToSet: { assignedStudentIds: studentId } },
                        { session }
                    );
                }
                
                // Rimuovi lo studentId dall'array assignedStudentIds dei docenti rimossi
                if (removedTeachers.length > 0) {
                    await User.updateMany(
                        { _id: { $in: removedTeachers } },
                        { $pull: { assignedStudentIds: studentId } },
                        { session }
                    );
                }
                
                // Rimuoviamo il flag updateTeacherAssignments per evitare che venga salvato nel DB
                delete updateData.updateTeacherAssignments;
            }

            // Esegue l'aggiornamento dello studente
            const updatedStudent = await this.model.findByIdAndUpdate(
                studentId,
                updateData,
                { 
                    new: true,
                    runValidators: true,
                    session
                }
            );

            await session.commitTransaction();
            return updatedStudent;

        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'update',
                { studentId, updateData },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    async updateStudentsForDeactivatedSection(schoolId, sectionName) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            logger.debug('Aggiornamento studenti per sezione disattivata:', {
                schoolId,
                sectionName
            });
    
            // 1. Trova tutte le classi della sezione
            const classes = await Class.find({
                schoolId,
                section: sectionName,
                isActive: true
            })
            .select('_id academicYear')
            .session(session);
    
            const classIds = classes.map(c => c._id);
    
            if (classIds.length === 0) {
                logger.debug('Nessuna classe attiva trovata per la sezione');
                await session.commitTransaction();
                return { modifiedCount: 0 };
            }
    
            // 2. Aggiorna tutti gli studenti in un'unica operazione
            const result = await this.model.updateMany(
                {
                    schoolId,
                    classId: { $in: classIds },
                    isActive: true
                },
                {
                    $set: {
                        classId: null,
                        section: null,
                        currentYear: null,
                        mainTeacher: null,
                        teachers: [],
                        status: 'pending',
                        needsClassAssignment: true,
                        lastClassChangeDate: new Date()
                    },
                    $push: {
                        classChangeHistory: {
                            fromSection: sectionName,
                            date: new Date(),
                            reason: 'Sezione disattivata',
                            academicYear: classes[0].academicYear // Usiamo l'anno accademico della prima classe
                        }
                    }
                },
                { session }
            );
    
            await session.commitTransaction();
            
            logger.debug('Aggiornamento studenti completato:', {
                modifiedCount: result.modifiedCount
            });
    
            return { modifiedCount: result.modifiedCount };
        } catch (error) {
            await session.abortTransaction();
            return handleRepositoryError(
                error,
                'updateStudentsForDeactivatedSection',
                { schoolId, sectionName },
                'StudentRepository'
            );
        } finally {
            session.endSession();
        }
    }

    async findWithTestCount(filters = {}) {
        try {
            logger.debug('Finding students with test count:', { filters });

            // Verifichiamo prima se esistono dei test nel database
            const Result = mongoose.model('Result');
            const testCount = await Result.countDocuments({ completato: true });
            logger.debug('Total completed tests in database:', { testCount });

            // Log delle collezioni disponibili
            const collections = await mongoose.connection.db.collections();
            logger.debug('Available collections:', {
                collections: collections.map(c => c.collectionName)
            });

            // Verifichiamo i test per uno studente specifico
            if (testCount > 0) {
                const sampleTest = await Result.findOne({ completato: true });
                logger.debug('Sample test found:', {
                    testId: sampleTest._id,
                    studentId: sampleTest.studentId,
                    completato: sampleTest.completato
                });
            }

            const pipeline = [
                { $match: filters },
                {
                    $lookup: {
                        from: 'results',
                        let: { studentId: '$_id' },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$studentId', '$$studentId'] },
                                            { $eq: ['$completato', true] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'tests'
                    }
                },
                {
                    $addFields: {
                        testCount: { $size: '$tests' }
                    }
                }
            ];

            // Log del pipeline
            logger.debug('Aggregation pipeline:', JSON.stringify(pipeline, null, 2));


            const students = await this.model.aggregate(pipeline);
             // Log dettagliato dei risultati
             logger.debug('Aggregation results:', {
                totalStudents: students.length,
                studentsWithTests: students.filter(s => s.testCount > 0).length,
                sampleStudents: students.slice(0,3).map(s => ({
                    studentId: s._id,
                    name: `${s.firstName} ${s.lastName}`,
                    testCount: s.testCount,
                    testsArray: s.tests
                }))
            });
            
            return students;
        } catch (error) {
            return handleRepositoryError(
                error,
                'findWithTestCount',
                { filters },
                'StudentRepository'
            );
        }
    }

    /**
     * Conta il numero di studenti attivi in classi specifiche
     * @param {Array<string>} classIds - Array di ID delle classi
     * @returns {Promise<number>} - Numero di studenti trovati
     */
    async countByClasses(classIds) {
        try {
            logger.debug('Conteggio studenti per classi:', { classIds });
            
            // Validazione input
            if (!Array.isArray(classIds) || classIds.length === 0) {
                return 0;
            }
            
            // Converte le stringhe in ObjectId se necessario
            const objectIds = classIds.map(id => 
                typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
            );
            
            // Conta gli studenti attivi nelle classi specificate
            const count = await this.model.countDocuments({
                classId: { $in: objectIds },
                status: 'active'
            });
            
            logger.debug('Risultato conteggio studenti:', { count, classIds });
            return count;
        } catch (error) {
            return handleRepositoryError(
                error,
                'countByClasses',
                { classIds },
                'StudentRepository'
            );
        }
    }

    /**
     * Trova studenti per email
     * @param {Array<string>} emails - Array di email da cercare
     * @returns {Promise<Array>} Lista degli studenti trovati
     */
    async findByEmails(emails) {
        try {
            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return [];
            }
            
            // Normalizza le email (converti in minuscolo e rimuovi spazi)
            const normalizedEmails = emails.map(email => 
                email.toString().trim().toLowerCase()
            );
            
            logger.debug('Searching for students by emails:', { 
                emailCount: normalizedEmails.length,
                sampleEmails: normalizedEmails.slice(0, 3)
            });
            
            // Cerca gli studenti con le email specificate
            const students = await this.model.find({
                email: { $in: normalizedEmails }
            });
            
            logger.debug('Found students by emails:', {
                searchedCount: normalizedEmails.length,
                foundCount: students.length
            });
            
            return students;
        } catch (error) {
            return handleRepositoryError(
                error,
                'findByEmails',
                { emailsCount: emails?.length },
                'StudentRepository'
            );
        }
    }


}

module.exports = StudentRepository;