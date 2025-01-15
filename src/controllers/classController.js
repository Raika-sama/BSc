// src/controllers/classController.js
const mongoose = require('mongoose');

const BaseController = require('./baseController');
const { class: ClassRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const { Class, School } = require('../models'); // Aggiunto School all'import


class ClassController extends BaseController {
    constructor() {
        super(ClassRepository, 'class');
        this.School = School; // Aggiungi questa riga

    }

 /**
     * Elimina tutte le classi della scuola dell'utente corrente
     */
    async deleteAll(req, res, next) {
        try {
            // 1. Verifica l'utente
            if (!req.user) {
                return next(createError(
                    ErrorTypes.AUTH.UNAUTHORIZED,
                    'Utente non autenticato'
                ));
            }

            // 2. Verifica che l'utente abbia una scuola associata
            const userWithSchool = await this.repository.findUserWithSchool(req.user.id);
            if (!userWithSchool || !userWithSchool.schoolId) {
                return next(createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Nessuna scuola associata all\'utente'
                ));
            }

            // 3. Elimina le classi
            const result = await this.repository.deleteMany({ 
                schoolId: userWithSchool.schoolId 
            });
            
            // 4. Log dell'operazione
            logger.info('Classi eliminate', { 
                userId: req.user.id,
                schoolId: userWithSchool.schoolId,
                deletedCount: result.deletedCount 
            });

            // 5. Invia risposta
            this.sendResponse(res, { 
                message: `Eliminate ${result.deletedCount} classi dalla scuola`,
                count: result.deletedCount 
            });

        } catch (error) {
            logger.error('Errore nell\'eliminazione delle classi:', error);
            next(createError(
                ErrorTypes.INTERNAL.SERVER_ERROR,
                'Errore durante l\'eliminazione delle classi'
            ));
        }
    }



    /**
     * Ottiene le classi per scuola
     */
    async getBySchool(req, res) {
        try {
            const { schoolId } = req.params;
            
            logger.debug('Getting classes for school:', { schoolId });
    
            if (!schoolId) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'SchoolId non fornito',
                    code: 'MISSING_SCHOOL_ID'
                });
            }
    
            const classes = await this.repository.findBySchool(schoolId);
            
            return this.sendResponse(res, { 
                status: 'success',
                classes: classes 
            });
    
        } catch (error) {
            logger.error('Error in getBySchool:', error);
            return this.sendError(res, {
                statusCode: 500,
                message: error.message || 'Errore nel recupero delle classi',
                code: error.code || 'CLASS_FETCH_ERROR'
            });
        }
    }

    /**
     * Aggiunge studenti alla classe
     */
    async addStudents(req, res) {
        try {
            const { classId } = req.params;
            const { studentIds } = req.body;

            const updatedClass = await this.repository.addStudents(classId, studentIds);
            logger.info('Studenti aggiunti alla classe', { 
                classId, 
                studentCount: studentIds.length 
            });

            this.sendResponse(res, { class: updatedClass });
        } catch (error) {
            this.sendError(res, error);
        }
    }


    /**
     * Ottiene tutte le classi
     */
    async getAll(req, res, next) {
        try {
            // Se è admin, recupera tutte le classi senza filtri
            if (req.user.role === 'admin') {
                logger.debug('Admin user requesting all classes');
                const classes = await Class.find()
                    .populate('schoolId', 'name')
                    .populate('mainTeacher', 'firstName lastName');
    
                return this.sendResponse(res, { classes });
            }
    
            // Per i teacher, manteniamo la logica esistente
            const userWithSchool = await this.repository.findUserWithSchool(req.user.id);
            if (!userWithSchool || !userWithSchool.schoolId) {
                return next(createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Nessuna scuola associata all\'utente'
                ));
            }
    
            const classes = await this.repository.findBySchool(userWithSchool.schoolId);
            this.sendResponse(res, { classes });
    
        } catch (error) {
            logger.error('Errore nel recupero delle classi:', error);
            next(createError(
                ErrorTypes.INTERNAL.SERVER_ERROR,
                'Errore durante il recupero delle classi'
            ));
        }
    }

    /**
     * Crea una nuova classe nella scuola dell'utente corrente
     */
    
    async exists(criteria) {
        try {
            // Aggiungiamo log per debug
            logger.debug('Verifica esistenza classe con criteri:', criteria);

            // Usiamo this.model direttamente invece di count
            const existingClass = await this.model.findOne(criteria);
            
            logger.debug('Risultato verifica:', { exists: !!existingClass });
            
            return !!existingClass;
        } catch (error) {
            logger.error('Errore nella verifica esistenza classe', { 
                error,
                criteria 
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella verifica esistenza classe',
                { originalError: error.message }
            );
        }
    }

    async create(req, res) {
        try {
            // Verifica utente
            if (!req.user) {
                return this.sendError(res, {
                    statusCode: 401,
                    message: 'Utente non autenticato',
                    code: 'AUTH_001'
                });
            }
    
            // Verifica schoolId
            if (!req.user.schoolId) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Nessuna scuola associata all\'utente',
                    code: 'CLASS_002'
                });
            }
    
            // Prepara i dati della classe
            const classData = {
                ...req.body,
                schoolId: req.user.schoolId
            };
    
            // Verifica esistenza
            const exists = await this.repository.exists({
                schoolId: req.user.schoolId,
                year: classData.year,
                section: classData.section,
                academicYear: classData.academicYear
            });
    
            if (exists) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Classe già esistente per questo anno e sezione',
                    code: 'CLASS_003'
                });
            }
    
            // Crea la classe
            const newClass = await this.repository.create(classData);
            this.sendResponse(res, { class: newClass });
        } catch (error) {
            logger.error('Errore nella creazione della classe:', error);
            this.sendError(res, error);
        }
    }
    

   /**
     * Elimina tutte le classi della scuola dell'utente corrente
     */
  
   async validateAcademicYear(academicYear) {
    const currentYear = new Date().getFullYear();
    const [startYear, endYear] = academicYear.split('/');
    return parseInt(startYear) === currentYear && 
           parseInt(endYear) === currentYear + 1;
    }

    // Nel ClassController
    async handleYearTransition(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug('handleYearTransition called with body:', req.body);
            const { schoolId, fromYear, toYear, sections } = req.body;

            // 1. Verifica input e scuola
            if (!schoolId || !fromYear || !toYear || !sections) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Dati mancanti per la transizione'
                );
            }

            const school = await School.findById(schoolId).session(session);
            logger.debug('Found school:', school);

            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            // 2. Cerca le classi esistenti del vecchio anno
            const existingClasses = await Class.find({
                schoolId,
                academicYear: fromYear,
                status: 'active'
            }).session(session);

            logger.debug('Found existing classes:', {
                count: existingClasses.length,
                classes: existingClasses.map(c => ({
                    year: c.year,
                    section: c.section,
                    status: c.status
                }))
            });

            // 3. Archivia le vecchie classi
            const archiveResult = await Class.updateMany(
                {
                    schoolId,
                    academicYear: fromYear,
                    status: 'active'
                },
                {
                    $set: {
                        status: 'archived',
                        'students.$[].status': 'transferred'
                    }
                },
                { session }
            );

            logger.debug('Archived old classes', { archiveResult });

            // 4. Crea le nuove classi promosse
            const promotedClassesData = existingClasses
                .filter(oldClass => oldClass.year < (school.schoolType === 'middle_school' ? 3 : 5))
                .map(oldClass => ({
                    schoolId,
                    year: oldClass.year + 1,
                    section: oldClass.section,
                    academicYear: toYear,
                    status: 'active',
                    capacity: oldClass.capacity,
                    mainTeacher: oldClass.mainTeacher,
                    teachers: oldClass.teachers,
                    isActive: true,
                    students: []
                }));

            // 5. Crea le nuove prime classi
            const newFirstYearClasses = sections.map(section => ({
                schoolId,
                year: 1,
                section: section.name,
                academicYear: toYear,
                status: 'active',
                capacity: section.maxStudents,
                mainTeacher: section.mainTeacherId,
                teachers: [],
                isActive: true,
                students: []
            }));

            // 6. Crea tutte le nuove classi
            const allNewClasses = [...promotedClassesData, ...newFirstYearClasses];
            logger.debug('Creating new classes:', {
                count: allNewClasses.length,
                promoted: promotedClassesData.length,
                newFirstYear: newFirstYearClasses.length
            });

            const newClasses = await Class.create(allNewClasses, { session });

            await session.commitTransaction();
            logger.debug('Year transition completed successfully');

            return this.sendResponse(res, {
                message: 'Transizione anno completata',
                newClasses
            });

        } catch (error) {
            await session.abortTransaction();
            logger.error('Error in handleYearTransition:', {
                message: error.message,
                stack: error.stack
            });
            return this.sendError(res, error);
        } finally {
            session.endSession();
        }
    }


    
    async getByAcademicYear(req, res) {
        try {
            const { schoolId, year } = req.params;
            console.log('Searching classes with params:', { schoolId, year }); // debug log
    
            // Normalizza il formato dell'anno accademico (supporta sia 2024-2025 che 2024/2025)
            const normalizedYear = year.includes('/') ? year : year.replace('-', '/');
    
            const classes = await this.repository.find({
                schoolId,
                academicYear: normalizedYear
            });
    
            console.log('Found classes:', classes); // debug log
    
            this.sendResponse(res, { classes });
        } catch (error) {
            console.error('Error in getByAcademicYear:', error);
            this.sendError(res, error);
        }
    }

    // Aggiungi questo metodo alla classe ClassController

/**
 * Crea le classi iniziali per una nuova scuola
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
async createInitialClasses(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, academicYear, sections } = req.body;

        // Validazione input
        if (!schoolId || !academicYear || !sections) {
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Dati mancanti per la creazione delle classi iniziali'
            );
        }

        logger.info('Inizializzazione classi per la scuola', {
            schoolId,
            academicYear,
            sectionsCount: sections.length
        });

        // Verifica esistenza scuola
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Scuola non trovata'
            );
        }

        // Usa il repository per creare le classi
        const classes = await this.repository.createInitialClasses(
            schoolId,
            academicYear,
            sections
        );

        await session.commitTransaction();

        logger.info('Classi iniziali create con successo', {
            schoolId,
            classesCreated: classes.length
        });

        this.sendResponse(res, {
            status: 'success',
            data: {
                classes,
                message: `Create ${classes.length} classi con successo`
            }
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error('Errore nella creazione delle classi iniziali:', {
            error: error.message,
            stack: error.stack
        });

        next(createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore durante la creazione delle classi iniziali',
            { originalError: error.message }
        ));
    } finally {
        session.endSession();
    }
}

async getMyClasses(req, res, next) {
    try {
        logger.debug('getMyClasses called for user:', {
            userId: req.user._id
        });

        const result = await this.repository.getMyClasses(req.user._id);

        // Invia risposta con classi separate per ruolo
        this.sendResponse(res, {
            mainTeacherClasses: result.mainTeacherClasses,
            coTeacherClasses: result.coTeacherClasses
        });

    } catch (error) {
        logger.error('Error in getMyClasses controller:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?._id
        });
        next(error);
    }
}

async getById(req, res, next) {
    try {
        const { id } = req.params;
        logger.debug('Getting class details for:', { classId: id });

        const classDetails = await this.repository.findWithDetails(id);
        
        if (!classDetails) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Classe non trovata'
            );
        }

        this.sendResponse(res, { 
            status: 'success',
            class: classDetails 
        });

    } catch (error) {
        logger.error('Error getting class details:', { 
            error: error.message,
            classId: req.params.id 
        });
        next(error);
    }
}

}

module.exports = new ClassController();