// src/repositories/StudentRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Student, School, Class } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

/**
 * Repository per la gestione delle operazioni relative agli studenti
 * Estende le funzionalità base del BaseRepository
 */
class StudentRepository extends BaseRepository {
    constructor() {
        super(Student);
    }

    /**
     * Trova studenti con dettagli completi
     * @param {Object} filters - Filtri di ricerca
     * @param {Object} options - Opzioni aggiuntive (sort, limit, skip)
     * @returns {Promise<Array>} Lista degli studenti con relazioni popolate
     */

    async findWithDetails(filters = {}, options = {}) {
        try {
            const query = this.model.find(filters)
                .populate('schoolId', 'name schoolType')
                .populate('classId', 'year section academicYear')
                .populate('mainTeacher', 'firstName lastName email')
                .populate('teachers', 'firstName lastName email');
    
            // Applica ordinamento di default per studenti pending
            if (filters.status === 'pending' && !options.sort) {
                query.sort({ createdAt: -1 });
            } else if (options.sort) {
                query.sort(options.sort);
            }
    
            if (options.limit) {
                query.limit(options.limit);
            }
    
            if (options.skip) {
                query.skip(options.skip);
            }
    
            return await query.exec();
        } catch (error) {
            logger.error('Error in findWithDetails:', {
                error,
                filters,
                options
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero degli studenti',
                { originalError: error.message }
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
            const query = {
                schoolId,
                needsClassAssignment: true,
                isActive: true
            };
    
            // Se c'è un termine di ricerca per nome
            if (options.name) {
                query.$or = [
                    { firstName: { $regex: options.name, $options: 'i' } },
                    { lastName: { $regex: options.name, $options: 'i' } }
                ];
            }
    
            return await this.findWithDetails(query, {
                sort: { createdAt: -1 }
            });
        } catch (error) {
            logger.error('Error in findUnassignedStudents:', {
                error,
                schoolId,
                options
            });
            throw error;
        }
    }

// nuovo metodo specifico con una query diversa dove cerchiamo schoolId: { $exists: false } invece di usare schoolId come filtro.    

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
        logger.error('Error in findUnassignedToSchoolStudents:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}
    
    async batchAssignToClass(studentIds, { classId, academicYear }) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Verifica esistenza e dettagli della classe
            const classDoc = await Class.findById(classId)
                .populate('mainTeacher')
                .populate('teachers')
                .session(session);
    
            if (!classDoc) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // 2. Verifica capacità della classe
            const currentStudentsCount = classDoc.students?.length || 0;
            if (currentStudentsCount + studentIds.length > classDoc.capacity) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    `Capacità classe superata. Capacità: ${classDoc.capacity}, Attuali: ${currentStudentsCount}, Da aggiungere: ${studentIds.length}`
                );
            }
    
            logger.debug('Debug batchAssignToClass:', {
                modelName: this.model.modelName,
                updateQuery: {
                    _id: { $in: studentIds },
                    schoolId: classDoc.schoolId,
                    needsClassAssignment: true
                },
                updateData: {
                    classId: classId,
                    status: 'active',
                    needsClassAssignment: false,
                    currentYear: classDoc.year,
                    mainTeacher: classDoc.mainTeacher._id,
                    teachers: classDoc.teachers.map(t => t._id),
                    section: classDoc.section
                }
            });
            // 3. Aggiorna gli studenti
            const updateResult = await this.model.updateMany(
                {
                    _id: { $in: studentIds },
                    schoolId: classDoc.schoolId, // Verifica stessa scuola
                    needsClassAssignment: true // Solo studenti non assegnati
                },
                {
                    $set: {
                        classId: classId,
                        status: 'active',
                        needsClassAssignment: false,
                        currentYear: classDoc.year,
                        mainTeacher: classDoc.mainTeacher._id,
                        teachers: classDoc.teachers.map(t => t._id),
                        lastClassChangeDate: new Date(),
                        section: classDoc.section
                    }
                },
                { session }
            );
    
            // 4. Aggiorna la classe
            const newStudentRecords = studentIds.map(studentId => ({
                studentId: studentId,
                joinedAt: new Date(),
                status: 'active'
            }));

            classDoc.students = [
                ...classDoc.students,
                ...newStudentRecords
            ];
            await classDoc.save({ session });
                // Commit della transazione
            await session.commitTransaction();

            // Aggiungi questo return
            return {
                success: true,
                modifiedCount: updateResult.modifiedCount,
                className: `${classDoc.year}${classDoc.section}`
            };
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error in batchAssignToClass:', {
                errorMessage: error.message,
                errorStack: error.stack,
                studentIds,
                classId,
                academicYear,
                modelInfo: {
                    name: this.model?.modelName,
                    exists: !!this.model
                }
            });
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Aggiungi questo nuovo metodo alla classe StudentRepository

    async batchAssignToSchool(studentIds, schoolId) {
        
        console.log('Debug - School model:', {
            isSchoolDefined: !!School,
            modelName: School?.modelName,
            isMongooseModel: School?.prototype?.constructor?.name === 'model'
        });
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug('Starting batch school assignment:', {
                studentCount: studentIds.length,
                schoolId,
                schoolModelExists: !!School  // Debug log
            });

            // 1. Verifica che la scuola esista
            const school = await School.findById(schoolId).session(session);
            
            if (!school) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
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
            logger.error('Error in batch assigning students to school:', {
                error: error.message,
                studentIds,
                schoolId,
                user: this.userId
            });
            throw error;
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
            logger.error('Error in findByClass:', {
                error,
                classId,
                teacherId
            });
            throw error;
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
            logger.error('Error in findByTeacher:', {
                error,
                teacherId
            });
            throw error;
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
            logger.error('Error in searchByName:', {
                error,
                searchTerm,
                schoolId
            });
            throw error;
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
                    ErrorTypes.VALIDATION.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }

            // Se viene specificata una classe, verifica che esista e abbia posto
            if (studentData.classId) {
                const classDoc = await Class.findById(studentData.classId);
                if (!classDoc) {
                    throw createError(
                        ErrorTypes.VALIDATION.NOT_FOUND,
                        'Classe non trovata'
                    );
                }

                const student = new this.model(studentData);
                const canBeAssigned = await student.canBeAssignedToClass(studentData.classId);
                if (!canBeAssigned) {
                    throw createError(
                        ErrorTypes.VALIDATION.BAD_REQUEST,
                        'Non è possibile assegnare lo studente a questa classe'
                    );
                }
            }

            const newStudent = await this.model.create([studentData], { session });
            await session.commitTransaction();

            return newStudent[0];
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error in create student:', {
                error,
                studentData
            });
            throw error;
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
                ErrorTypes.VALIDATION.ALREADY_EXISTS,
                'Email già registrata'
            );
        }

        // 2. Verifica e recupera la classe
        const classDoc = await Class.findById(studentData.classId).session(session);
        if (!classDoc) {
            throw createError(
                ErrorTypes.VALIDATION.NOT_FOUND,
                'Classe non trovata'
            );
        }

        // 3. Verifica capacità classe
        if (classDoc.students.length >= classDoc.capacity) {
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'La classe ha raggiunto la capacità massima'
            );
        }

        // 4. Crea lo studente
        const newStudent = await this.model.create([studentData], { session });

        // 5. Aggiorna la classe
        classDoc.students.push({
            studentId: newStudent[0]._id,
            joinedAt: new Date(),
            status: 'active'
        });

        await classDoc.save({ session });
        await session.commitTransaction();

        return newStudent[0];
    } catch (error) {
        await session.abortTransaction();
        logger.error('Error in createWithClass:', {
            error,
            studentData
        });
        throw error;
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
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            const classDoc = await Class.findById(classId)
                .populate('mainTeacher')
                .populate('teachers');

            if (!classDoc) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            const canBeAssigned = await student.canBeAssignedToClass(classId);
            if (!canBeAssigned) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Non è possibile assegnare lo studente a questa classe'
                );
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
            await session.commitTransaction();

            return student;
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error in assignToClass:', {
                error,
                studentId,
                classId
            });
            throw error;
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
        try {
            const student = await this.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            if (student.classId) {
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
            }

            student.classId = null;
            student.section = null;
            student.mainTeacher = null;
            student.teachers = [];
            student.needsClassAssignment = true;
            student.lastClassChangeDate = new Date();

            return await student.save();
        } catch (error) {
            logger.error('Error in removeFromClass:', {
                error,
                studentId
            });
            throw error;
        }
    }

    /**
     * Elimina uno studente e gestisce le relazioni
     * @param {string} studentId - ID dello studente
     * @returns {Promise<Object>} Risultato dell'eliminazione
     */
    async delete(studentId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const student = await this.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // TODO: Quando implementeremo i test, qui andrà gestita la pulizia
            // dei risultati dei test e altri dati correlati

            await this.model.deleteOne({ _id: studentId }, { session });
            await session.commitTransaction();

            return { success: true, message: 'Studente eliminato con successo' };
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error in delete student:', {
                error,
                studentId
            });
            throw error;
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
        try {
            // Verifica unicità email/codice fiscale se vengono modificati
            if (updateData.email || updateData.fiscalCode) {
                const exists = await this.model.findOne({
                    _id: { $ne: studentId },
                    $or: [
                        updateData.email ? { email: updateData.email } : null,
                        updateData.fiscalCode ? { fiscalCode: updateData.fiscalCode } : null
                    ].filter(Boolean)
                });

                if (exists) {
                    throw createError(
                        ErrorTypes.VALIDATION.ALREADY_EXISTS,
                        'Email o codice fiscale già registrati'
                    );
                }
            }

            const student = await this.model.findByIdAndUpdate(
                studentId,
                updateData,
                { 
                    new: true,
                    runValidators: true
                }
            ).populate('schoolId classId mainTeacher teachers');

            if (!student) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            return student;
        } catch (error) {
            logger.error('Error in update student:', {
                error,
                studentId,
                updateData
            });
            throw error;
        }
    }

    // Aggiungi questo metodo alla classe StudentRepository

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
            logger.error('Errore nell\'aggiornamento degli studenti:', {
                error,
                schoolId,
                sectionName
            });
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = StudentRepository;


// Operazioni CRUD Base:

// Create con validazioni avanzate
// Read con supporto per filtri e popolamento relazioni
// Update con verifica unicità
// Delete con gestione transazioni


// Query Specifiche:

// findWithDetails: recupera studenti con tutte le relazioni popolate
// findByClass: trova studenti di una classe specifica
// findByTeacher: trova studenti associati a un docente
// searchByName: ricerca fuzzy per nome/cognome


// Gestione Classe:

// assignToClass: assegna studente a una classe con storico
// removeFromClass: rimuove studente da una classe
// Validazioni per capacità classe e permessi


// Sicurezza e Validazione:

// Controllo permessi per accesso dati
// Validazioni di unicità email/codice fiscale
// Gestione transazioni per operazioni critiche


// Logging e Gestione Errori:

// Logging dettagliato di tutte le operazioni
// Gestione errori consistente
// Messaggi di errore chiari e specifici