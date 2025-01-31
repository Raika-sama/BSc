// src/repositories/ClassRepository.js
const mongoose = require('mongoose');  // Aggiungi questo import
const BaseRepository = require('./base/BaseRepository');
const { Class, User, School } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');





class ClassRepository extends BaseRepository {
    constructor() {
        super(Class);
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
            logger.error('Errore nella verifica esistenza classe:', {
                error: error.message,
                stack: error.stack,
                criteria
            });
            
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella verifica esistenza classe',
                { originalError: error.message }
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
            logger.error('Errore creazione classe:', {
                message: error.message,
                stack: error.stack,
                validationErrors: error.errors,
                data: data
            });

            if (error.name === 'ValidationError') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errore di validazione: ' + error.message
                );
            }

            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella creazione della classe: ' + error.message
            );
        }
    }

    async findUserWithSchool(userId) {
        try {
            return await User.findById(userId).populate('schoolId');
        } catch (error) {
            logger.error('Errore nel recupero dei dettagli utente', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dei dettagli utente',
                { originalError: error.message }
            );
        }
    }

   // ClassRepository.js
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
        logger.error('Error fetching class details:', error);
        throw error;
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
            logger.error('Error in findBySchool:', { 
                error: error.message,
                schoolId: schoolId 
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca delle classi della scuola',
                { originalError: error.message }
            );
        }
    }

    async addTeacher(classId, teacherId) {
        try {
            const classData = await this.findById(classId);

            if (classData.teachers.includes(teacherId)) {
                logger.warn('Tentativo di aggiungere un insegnante già assegnato', { classId, teacherId });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Insegnante già assegnato alla classe'
                );
            }

            classData.teachers.push(teacherId);
            await classData.save();

            return classData;
        } catch (error) {
            if (error.code) throw error; // Se è già un errore formattato
            logger.error('Errore nell\'aggiunta dell\'insegnante alla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta dell\'insegnante alla classe',
                { originalError: error.message }
            );
        }
    }

    async removeTeacher(classId, teacherId) {
        try {
            const classData = await this.findById(classId);

            if (classData.mainTeacher.toString() === teacherId) {
                logger.warn('Tentativo di rimuovere l\'insegnante principale', { classId, teacherId });
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Impossibile rimuovere l\'insegnante principale'
                );
            }

            classData.teachers = classData.teachers.filter(
                id => id.toString() !== teacherId
            );

            await classData.save();
            return classData;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella rimozione dell\'insegnante dalla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione dell\'insegnante dalla classe',
                { originalError: error.message }
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
            logger.error('Errore nell\'aggiunta dello studente alla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta dello studente alla classe',
                { originalError: error.message }
            );
        }
    }

    async addStudents(classId, studentIds) {
        try {
            const classData = await this.findById(classId);
            const newStudents = studentIds.filter(id => 
                !classData.students.includes(id)
            );
            
            if (newStudents.length) {
                classData.students.push(...newStudents);
                await classData.save();
            }
            return classData;
        } catch (error) {
            logger.error('Errore nell\'aggiunta degli studenti', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta degli studenti'
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
            logger.error('Errore nella rimozione dello studente dalla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione dello studente dalla classe',
                { originalError: error.message }
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
            logger.error('Errore nella ricerca delle classi per insegnante', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca delle classi per insegnante',
                { originalError: error.message }
            );
        }
    }

    // src/repositories/ClassRepository.js

    // Nel ClassRepository
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
            logger.error('Error in createInitialClasses:', {
                error: error.message,
                stack: error.stack
            });
            
            await session.abortTransaction();
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella creazione classi iniziali',
                { originalError: error.message }
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
                logger.error('Error in promoteStudents:', {
                    error: error.message,
                    stack: error.stack,
                    fromYear,
                    toYear
                });
                
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }

        async getMyClasses(userId) {
            try {
                logger.debug('Getting classes for user:', { userId });
        
                const pipeline = [
                    {
                        $facet: {
                            // Classi dove l'utente è insegnante principale
                            mainTeacherClasses: [
                                {
                                    $match: {
                                        mainTeacher: new mongoose.Types.ObjectId(userId),
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
                                        schoolId: '$schoolId',
                                        schoolName: '$school.name',
                                        classId: '$_id',
                                        year: 1,
                                        section: 1,
                                        academicYear: 1,
                                        students: 1
                                    }
                                },
                                {
                                    $sort: { 
                                        schoolName: 1, 
                                        year: 1, 
                                        section: 1 
                                    }
                                }
                            ],
                            // Classi dove l'utente è co-insegnante
                            coTeacherClasses: [
                                {
                                    $match: {
                                        teachers: new mongoose.Types.ObjectId(userId),
                                        mainTeacher: { 
                                            $ne: new mongoose.Types.ObjectId(userId) 
                                        },
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
                                        schoolId: '$schoolId',
                                        schoolName: '$school.name',
                                        classId: '$_id',
                                        year: 1,
                                        section: 1,
                                        academicYear: 1,
                                        students: 1
                                    }
                                },
                                {
                                    $sort: { 
                                        schoolName: 1, 
                                        year: 1, 
                                        section: 1 
                                    }
                                }
                            ]
                        }
                    }
                ];
        
                const [result] = await this.model.aggregate(pipeline);
        
                logger.debug('Found classes:', {
                    mainTeacherClassesCount: result.mainTeacherClasses.length,
                    coTeacherClassesCount: result.coTeacherClasses.length
                });
        
                return result;
        
            } catch (error) {
                logger.error('Error in getMyClasses:', { error });
                throw createError(
                    ErrorTypes.DATABASE.QUERY_FAILED,
                    'Errore nel recupero delle classi',
                    { originalError: error.message }
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
                logger.error('Errore nella disattivazione delle classi:', {
                    error,
                    schoolId,
                    sectionName
                });
                throw error;
            }
        }

}

module.exports = ClassRepository;