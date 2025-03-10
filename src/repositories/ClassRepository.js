// src/repositories/ClassRepository.js
const mongoose = require('mongoose');
const BaseRepository = require('./base/BaseRepository');
const { Class, User, School } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');

class ClassRepository extends BaseRepository {
    constructor() {
        super(Class);
        this.repositoryName = 'ClassRepository';
    }


    async exists(criteria) {
        try {
            logger.debug('Verifica esistenza classe con criteri:', criteria);
            
            // Verifica che l'ID della scuola sia valido
            if (!mongoose.Types.ObjectId.isValid(criteria.schoolId)) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola non valido'
                );
            }

            // Usa il modello Class direttamente
            const existingClass = await Class.findOne({
                schoolId: criteria.schoolId,
                year: criteria.year,
                section: criteria.section,
                academicYear: criteria.academicYear
            }).exec(); // Aggiungi .exec() per assicurarti che la promise sia risolta

            logger.debug('Risultato verifica esistenza:', { 
                exists: !!existingClass,
                searchCriteria: criteria 
            });

            return !!existingClass;
        } catch (error) {
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'exists',
                { criteria },
                this.repositoryName
            );
        }
    }


    async create(data) {
        try {
            // Verifica stato connessione database
            if (mongoose.connection.readyState !== 1) {
                throw createError(
                    ErrorTypes.DATABASE.CONNECTION_ERROR,
                    'Database non connesso'
                );
            }

            // Verifica che i dati siano validi
            if (!data || !data.schoolId || !data.mainTeacher) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Dati classe incompleti'
                );
            }

            // Crea un nuovo documento usando il modello direttamente
            const classDoc = new Class(data);
            
            // Valida il documento
            await classDoc.validate();

            // Salva il documento
            const savedClass = await classDoc.save();

            logger.info('Classe creata con successo:', {
                classId: savedClass._id,
                schoolId: savedClass.schoolId
            });

            return savedClass;

        } catch (error) {
            if (error.code) throw error;
            
            // Gestione specifica per errori di validazione
            if (error.name === 'ValidationError') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errore di validazione: ' + error.message,
                    { validationErrors: error.errors }
                );
            }
            
            throw handleRepositoryError(
                error,
                'create',
                { data },
                this.repositoryName
            );
        }
    }

    async findUserWithSchool(userId) {
        try {
            return await User.findById(userId).populate('schoolId');
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findUserWithSchool',
                { userId },
                this.repositoryName
            );
        }
    }

    async findWithDetails(id) {
        try {
            const classData = await this.model.findById(id)
                .populate({
                    path: 'schoolId',
                    select: 'name schoolType'
                })
                .populate({
                    path: 'mainTeacher',
                    select: 'firstName lastName email'
                })
                .populate({
                    path: 'teachers',
                    select: 'firstName lastName email'
                })
                .populate({
                    path: 'students.studentId',
                    select: 'firstName lastName email'
                })
                .lean();

            return classData;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findWithDetails',
                { id },
                this.repositoryName
            );
        }
    }

    async findBySchool(schoolId, academicYear) {
        try {
            logger.debug('Finding classes by school:', { schoolId, academicYear });
    
            const query = { 
                schoolId,
                isActive: true 
            };
    
            // Se c'è un anno accademico specifico, aggiungiamolo alla query
            if (academicYear) {
                query.academicYear = academicYear;
            }
    
            const classes = await this.model
                .find(query)
                .populate('mainTeacher', 'firstName lastName')
                .populate('teachers', 'firstName lastName')
                .sort({ year: 1, section: 1 });
    
            logger.debug('Found classes:', { 
                count: classes.length,
                schoolId: schoolId
            });
    
            return classes;
    
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findBySchool',
                { schoolId, academicYear },
                this.repositoryName
            );
        }
    }

    async addStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);

            if (classData.students.includes(studentId)) {
                logger.warn('Tentativo di aggiungere uno studente già presente', { classId, studentId });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Studente già presente nella classe'
                );
            }

            classData.students.push(studentId);
            await classData.save();

            return classData;
        } catch (error) {
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'addStudent',
                { classId, studentId },
                this.repositoryName
            );
        }
    }

    async removeStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);
            
            classData.students = classData.students.filter(
                id => id.toString() !== studentId
            );

            await classData.save();
            return classData;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'removeStudent',
                { classId, studentId },
                this.repositoryName
            );
        }
    }

    async findByTeacher(teacherId, academicYear) {
        try {
            const filter = {
                $or: [
                    { mainTeacher: teacherId },
                    { teachers: teacherId }
                ],
                isActive: true
            };

            if (academicYear) {
                filter.academicYear = academicYear;
            }

            return await this.find(filter, {
                sort: { year: 1, section: 1 },
                populate: {
                    path: 'schoolId',
                    select: 'name'
                }
            });
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findByTeacher',
                { teacherId, academicYear },
                this.repositoryName
            );
        }
    }

    async createInitialClasses(schoolId, academicYear, sections) {
        const session = await mongoose.startSession();
        session.startTransaction();
            
        if (!schoolId || !academicYear || !sections || !Array.isArray(sections)) {
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Parametri mancanti o non validi'
            );
        }

        try {
            logger.debug('Starting createInitialClasses', {
                schoolId,
                academicYear,
                sections
            });
    
            // Verifica se esistono già classi per quell'anno
            const existingClasses = await this.model.find({
                schoolId,
                academicYear
            }).session(session);
    
            logger.debug('Found existing classes:', {
                count: existingClasses.length
            });
    
            if (existingClasses.length > 0) {
                logger.debug('Classes already exist for this year');
                await session.commitTransaction();
                return existingClasses;
            }
    
            const school = await School.findById(schoolId).session(session);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            // Prepara i dati per le classi
            const classesData = [];
            const maxYear = school.schoolType === 'middle_school' ? 3 : 5;
    
            for (let year = 1; year <= maxYear; year++) {
                for (const section of sections) {
                    logger.debug('Creating class with data:', {
                        year,
                        section,
                        mainTeacherId: section.mainTeacherId
                    });
    
                    classesData.push({
                        schoolId,
                        year,
                        section: section.name,
                        academicYear,
                        status: 'planned',
                        capacity: section.maxStudents,
                        mainTeacher: section.mainTeacherId,
                        teachers: [],
                        isActive: true,
                        students: []
                    });
                }
            }
    
            logger.debug('Creating classes with data:', {
                count: classesData.length,
                firstClass: classesData[0]
            });
    
            const newClasses = await this.model.create(classesData, { session });
            
            logger.debug('Classes created successfully', {
                count: newClasses.length
            });
    
            await session.commitTransaction();
            return newClasses;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'createInitialClasses',
                { schoolId, academicYear, sections },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async promoteStudents(fromYear, toYear) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            logger.debug('Starting promoteStudents transaction', { fromYear, toYear });
    
            // 1. Prima trova tutte le classi attive dell'anno precedente
            const oldClasses = await this.model.find({ 
                academicYear: fromYear,
                status: 'active'
            }).populate('schoolId').session(session);
    
            logger.debug('Found old classes', { 
                count: oldClasses.length,
                classes: oldClasses.map(c => ({
                    id: c._id,
                    year: c.year,
                    section: c.section,
                    academicYear: c.academicYear
                }))
            });
    
            // 2. Archivia le vecchie classi
            const archiveResult = await this.model.updateMany(
                { academicYear: fromYear, status: 'active' },
                { 
                    $set: { 
                        status: 'archived',
                        'students.$[].status': 'transferred',
                        'students.$[].leftAt': new Date()
                    }
                },
                { session }
            );
    
            logger.debug('Archive result', { archiveResult });
    
            // 3. Prepara le nuove classi
            const newClassesData = oldClasses
                .filter(oldClass => {
                    const maxYear = oldClass.schoolId.schoolType === 'middle_school' ? 3 : 5;
                    return oldClass.year < maxYear;
                })
                .map(oldClass => ({
                    schoolId: oldClass.schoolId._id,
                    year: oldClass.year + 1,
                    section: oldClass.section,
                    academicYear: toYear,
                    status: 'active',
                    capacity: oldClass.capacity,
                    mainTeacher: oldClass.mainTeacher,
                    teachers: oldClass.teachers,
                    isActive: true
                }));
    
            logger.debug('Prepared new classes', { 
                count: newClassesData.length,
                classes: newClassesData
            });
    
            // 4. Inserisci le nuove classi
            const insertResult = await this.model.insertMany(newClassesData, { session });
            logger.debug('Insert result', { insertResult });
    
            await session.commitTransaction();
            return true;
    
        } catch (error) {
            await session.abortTransaction();
            throw handleRepositoryError(
                error,
                'promoteStudents',
                { fromYear, toYear },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async getMyClasses(userId) {
        try {
            logger.debug('Getting classes for user:', { userId });

            // Prima otteniamo l'utente con i suoi dettagli
            const user = await mongoose.model('User').findById(userId)
                .select('role schoolId')
                .lean();

            logger.debug('ClassRepository: Utente trovato', { 
                role: user?.role, 
                schoolId: user?.schoolId 
            });

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            logger.debug('User details:', { 
                role: user.role, 
                schoolId: user.schoolId 
            });

            let pipeline = [];

            // Pipeline diversa in base al ruolo
            switch (user.role) {
                case 'admin':
                    // Admin vede tutte le classi
                    pipeline = [
                        {
                            $lookup: {
                                from: 'schools',
                                localField: 'schoolId',
                                foreignField: '_id',
                                as: 'school'
                            }
                        },
                        {
                            $unwind: '$school'
                        },
                        {
                            $match: {
                                isActive: true
                            }
                        },
                        {
                            $project: {
                                schoolId: 1,
                                schoolName: '$school.name',
                                classId: '$_id',
                                year: 1,
                                section: 1,
                                academicYear: 1,
                                students: 1,
                                mainTeacher: 1,
                                teachers: 1
                            }
                        },
                        {
                            $sort: { 
                                'school.name': 1, 
                                year: 1, 
                                section: 1 
                            }
                        }
                    ];
                    break;

                case 'manager':
                    // Manager vede solo le classi della sua scuola
                    pipeline = [
                        {
                            $match: {
                                schoolId: user.schoolId,
                                isActive: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'schools',
                                localField: 'schoolId',
                                foreignField: '_id',
                                as: 'school'
                            }
                        },
                        {
                            $unwind: '$school'
                        },
                        {
                            $project: {
                                schoolId: 1,
                                schoolName: '$school.name',
                                classId: '$_id',
                                year: 1,
                                section: 1,
                                academicYear: 1,
                                students: 1,
                                mainTeacher: 1,
                                teachers: 1
                            }
                        },
                        {
                            $sort: { 
                                year: 1, 
                                section: 1 
                            }
                        }
                    ];
                    break;

                case 'teacher':
                    // Teacher vede le classi dove è mainTeacher o nell'array teachers
                    pipeline = [
                        {
                            $match: {
                                isActive: true,
                                $or: [
                                    { mainTeacher: new mongoose.Types.ObjectId(userId) },
                                    { teachers: new mongoose.Types.ObjectId(userId) }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: 'schools',
                                localField: 'schoolId',
                                foreignField: '_id',
                                as: 'school'
                            }
                        },
                        {
                            $unwind: '$school'
                        },
                        {
                            $project: {
                                schoolId: 1,
                                schoolName: '$school.name',
                                classId: '$_id',
                                year: 1,
                                section: 1,
                                academicYear: 1,
                                students: 1,
                                mainTeacher: 1,
                                teachers: 1,
                                isMainTeacher: {
                                    $eq: ['$mainTeacher', new mongoose.Types.ObjectId(userId)]
                                }
                            }
                        },
                        {
                            $sort: { 
                                isMainTeacher: -1,
                                year: 1, 
                                section: 1 
                            }
                        },
                        {
                            $facet: {
                                mainTeacherClasses: [
                                    {
                                        $match: {
                                            isMainTeacher: true
                                        }
                                    }
                                ],
                                coTeacherClasses: [
                                    {
                                        $match: {
                                            isMainTeacher: false
                                        }
                                    }
                                ]
                            }
                        }
                    ];
                    break;

                default:
                    throw createError(
                        ErrorTypes.AUTH.INVALID_ROLE,
                        'Ruolo utente non valido'
                    );
            }

            const result = await this.model.aggregate(pipeline);
            logger.debug('ClassRepository: Query completata', {
                resultLength: result.length
            });
            // Per admin e manager, formatta il risultato nello stesso formato usato per i teacher
            if (user.role === 'admin' || user.role === 'manager') {
                return {
                    mainTeacherClasses: result,
                    coTeacherClasses: []
                };
            }

            // Per teacher, il risultato è già nel formato corretto dalla facet
            return result[0];

        } catch (error) {
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'getMyClasses',
                { userId },
                this.repositoryName
            );
        }
    }

    async deactivateClassesBySection(schoolId, sectionName, session) {
        try {
            logger.debug('Inizio deactivateClassesBySection', {
                schoolId,
                sectionName,
                session: !!session
            });
    
            // 1. Trova tutte le classi della sezione
            const classes = await this.model.find({
                schoolId,
                section: sectionName,
                isActive: true
            }).session(session);
    
            logger.debug('Classi trovate da disattivare:', {
                count: classes.length,
                classi: classes.map(c => ({
                    id: c._id,
                    section: c.section,
                    isActive: c.isActive
                }))
            });
    
            // 2. Aggiorna lo stato delle classi
            for (const classDoc of classes) {
                classDoc.previousMainTeacher = classDoc.mainTeacher;
                // Resetta tutti i campi
                classDoc.isActive = false;
                classDoc.status = 'archived';
                classDoc.deactivatedAt = new Date();
                classDoc.mainTeacher = null;
                classDoc.teachers = [];
                classDoc.students = [];
                classDoc.updatedAt = new Date();
                
                await classDoc.save({ session });
            }
    
            return classes;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'deactivateClassesBySection',
                { schoolId, sectionName },
                this.repositoryName
            );
        }
    }

    async removeStudentsFromClass(classId, studentIds) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // Aggiorna la classe rimuovendo gli studenti
            const classDoc = await this.model.findByIdAndUpdate(
                classId,
                {
                    $pull: {
                        students: {
                            studentId: { $in: studentIds }
                        }
                    }
                },
                { session, new: true }
            );
    
            // Aggiorna gli studenti
            await mongoose.model('Student').updateMany(
                { _id: { $in: studentIds } },
                {
                    $set: {
                        classId: null,
                        section: null,
                        status: 'inactive',
                        mainTeacher: null,
                        teachers: [],
                        needsClassAssignment: true
                    }
                },
                { session }
            );
    
            await session.commitTransaction();
            return classDoc;
        } catch (error) {
            await session.abortTransaction();
            throw handleRepositoryError(
                error,
                'removeStudentsFromClass',
                { classId, studentIds },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async updateMainTeacher(classId, teacherId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la classe
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // Salva il vecchio mainTeacher se presente
            const oldMainTeacher = classDoc.mainTeacher;
            
            // 2. Aggiorna la classe
            classDoc.mainTeacher = teacherId;
            classDoc.mainTeacherIsTemporary = false;
            classDoc.previousMainTeacher = undefined;
            await classDoc.save({ session });
    
            // 3. Aggiorna gli studenti della classe
            await mongoose.model('Student').updateMany(
                { classId: classId },
                { 
                    $set: { mainTeacher: teacherId },
                    $addToSet: { teachers: teacherId } 
                },
                { session }
            );
    
            // 4. Aggiorna l'utente docente (aggiungi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                teacherId,
                { 
                    $addToSet: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $each: studentIds }
                    } 
                },
                { session }
            );
    
            // 5. Se c'era un docente principale precedente, rimuovi i riferimenti
            if (oldMainTeacher && oldMainTeacher.toString() !== teacherId.toString()) {
                // Rimuovi la classe e gli studenti dal vecchio mainTeacher
                await mongoose.model('User').findByIdAndUpdate(
                    oldMainTeacher,
                    { 
                        $pull: { 
                            assignedClassIds: classId,
                            assignedStudentIds: { $in: studentIds }
                        } 
                    },
                    { session }
                );
            }
    
            await session.commitTransaction();
            return classDoc;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'updateMainTeacher',
                { classId, teacherId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async removeMainTeacher(classId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la classe e verifica che esista
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // 2. Verifica che ci sia un mainTeacher da rimuovere
            if (!classDoc.mainTeacher) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Nessun docente principale assegnato'
                );
            }
    
            const previousTeacherId = classDoc.mainTeacher;
    
            // 3. Aggiorna la classe
            classDoc.previousMainTeacher = previousTeacherId;
            classDoc.mainTeacher = null;
            classDoc.mainTeacherIsTemporary = true;
            await classDoc.save({ session });
    
            // 4. Aggiorna gli studenti
            await mongoose.model('Student').updateMany(
                { 
                    classId: classId,
                    mainTeacher: previousTeacherId
                },
                { 
                    $set: { mainTeacher: null },
                    $pull: { teachers: previousTeacherId }
                },
                { session }
            );
    
            // 5. Aggiorna l'utente docente (rimuovi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                previousTeacherId,
                { 
                    $pull: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $in: studentIds }
                    } 
                },
                { session }
            );
    
            await session.commitTransaction();
            
            return classDoc;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'removeMainTeacher',
                { classId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async addTeacher(classId, teacherId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Trova la classe
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            // 2. Verifica che il docente non sia già presente
            if (classDoc.teachers.includes(teacherId)) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Docente già assegnato alla classe'
                );
            }

            // 3. Aggiorna la classe
            classDoc.teachers.push(teacherId);
            await classDoc.save({ session });

            // 4. Aggiorna gli studenti della classe
            await mongoose.model('Student').updateMany(
                { classId: classId },
                { 
                    $addToSet: { teachers: teacherId } 
                },
                { session }
            );

            // 5. Aggiorna l'utente docente (aggiungi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                teacherId,
                { 
                    $addToSet: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $each: studentIds }
                    } 
                },
                { session }
            );

            await session.commitTransaction();
            return classDoc;

        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'addTeacher',
                { classId, teacherId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async removeTeacher(classId, teacherId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la classe
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // 2. Verifica che il docente non sia mainTeacher
            if (classDoc.mainTeacher && classDoc.mainTeacher.toString() === teacherId.toString()) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Non è possibile rimuovere il docente principale. Usare removeMainTeacher invece.'
                );
            }
    
            // 3. Verifica che il docente sia presente nell'array
            if (!classDoc.teachers.some(t => t.toString() === teacherId.toString())) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Docente non trovato nella classe'
                );
            }
    
            // 4. Aggiorna la classe
            classDoc.teachers = classDoc.teachers.filter(
                t => t.toString() !== teacherId.toString()
            );
            await classDoc.save({ session });
    
            // 5. Aggiorna gli studenti della classe
            await mongoose.model('Student').updateMany(
                { classId: classId },
                { 
                    $pull: { teachers: teacherId } 
                },
                { session }
            );
    
            // 6. Aggiorna l'utente docente (rimuovi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                teacherId,
                { 
                    $pull: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $in: studentIds }
                    } 
                },
                { session }
            );
    
            await session.commitTransaction();
            return classDoc;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'removeTeacher',
                { classId, teacherId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }
}

module.exports = ClassRepository;