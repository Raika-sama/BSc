// src/controllers/classController.js
const mongoose = require('mongoose');

const BaseController = require('./baseController');
const { class: ClassRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const { Class, School } = require('../models'); // Aggiunto School all'import


class ClassController extends BaseController {
    constructor(classRepository, schoolRepository) {
        super(classRepository);
        this.repository = classRepository;
        this.School = schoolRepository;  // invece di School direttamente

        // Binding dei metodi
        this.create = this.create.bind(this);
        this.getBySchool = this.getBySchool.bind(this);
        this.addStudents = this.addStudents.bind(this);
        this.getAll = this.getAll.bind(this);
        this.handleYearTransition = this.handleYearTransition.bind(this);
        this.createInitialClasses = this.createInitialClasses.bind(this);
        this.getMyClasses = this.getMyClasses.bind(this);
        this.getById = this.getById.bind(this);
        this.removeMainTeacher = this.removeMainTeacher.bind(this);
        this.removeStudentsFromClass = this.removeStudentsFromClass.bind(this);
        this.updateMainTeacher = this.updateMainTeacher.bind(this);
        this.addTeacher = this.addTeacher.bind(this);
        this.removeTeacher = this.removeTeacher.bind(this);
        this.getClassTestsAggregation = this.getClassTestsAggregation.bind(this);
    }

    /**
     * Ottiene i dati aggregati dei test degli studenti di una classe
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware
     */
    async getClassTestsAggregation(req, res, next) {
        try {
            const { classId } = req.params;
            const { testType = 'CSI' } = req.query;

            logger.info('Richiesta dati aggregati test classe', { 
                classId, 
                testType,
                userId: req.user?.id
            });

            if (!classId) {
                return next(createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID classe richiesto'
                ));
            }

            // Ottiene i dati aggregati dal repository
            const aggregatedData = await this.repository.getClassTestsAggregation(classId, testType);

            if (!aggregatedData) {
                return next(createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessun dato disponibile per questa classe'
                ));
            }

            this.sendResponse(res, aggregatedData);

        } catch (error) {
            logger.error('Errore nel recupero dei dati aggregati dei test della classe:', error);
            next(error);
        }
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

    /**
     * Gestisce la transizione tra anni accademici
     * @deprecated Use YearTransitionController.executeYearTransition instead
     */
    async handleYearTransition(req, res, next) {
        console.warn('This method is deprecated. Use YearTransitionController.executeYearTransition instead');
        // Redirect alla nuova implementazione
        return res.redirect(307, `/api/schools/${req.body.schoolId}/year-transition`);
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
            logger.debug('ClassController: getMyClasses chiamato', {
                userId: req.user._id,
                role: req.user.role,
                schoolId: req.user.schoolId
            });

            const result = await this.repository.getMyClasses(req.user._id);
            logger.debug('ClassController: Risultato ottenuto', {
                mainTeacherClassesCount: result.mainTeacherClasses?.length,
                coTeacherClassesCount: result.coTeacherClasses?.length
            });

            this.sendResponse(res, {
                status: 'success',
                mainTeacherClasses: result.mainTeacherClasses,
                coTeacherClasses: result.coTeacherClasses
            });

        } catch (error) {
            logger.error('ClassController: Errore in getMyClasses', {
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

    async removeStudentsFromClass(req, res, next) {
        const { classId } = req.params;
        const { studentIds } = req.body;

        try {
            if (!Array.isArray(studentIds) || studentIds.length === 0) {
                return next(createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Lista studenti non valida'
                ));
            }

            const updatedClass = await this.repository.removeStudentsFromClass(
                classId, 
                studentIds
            );

            logger.info('Studenti rimossi dalla classe', {
                classId,
                studentCount: studentIds.length
            });

            this.sendResponse(res, { class: updatedClass });
        } catch (error) {
            logger.error('Errore nella rimozione studenti', {
                error: error.message,
                classId,
                studentIds
            });
            next(error);
        }
    }


    async updateMainTeacher(req, res, next) {
        try {
            const { classId } = req.params;
            const { teacherId } = req.body;
    
            if (!teacherId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID docente richiesto'
                );
            }
    
            const updatedClass = await this.repository.updateMainTeacher(classId, teacherId);
            
            this.sendResponse(res, { 
                status: 'success',
                data: { class: updatedClass }
            });
    
        } catch (error) {
            next(error);
        }
    }
    
    async addTeacher(req, res, next) {
        try {
            const { classId } = req.params;
            const { teacherId } = req.body;
    
            if (!teacherId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID docente richiesto'
                );
            }
    
            const updatedClass = await this.repository.addTeacher(classId, teacherId);
            
            this.sendResponse(res, { 
                status: 'success',
                data: { class: updatedClass }
            });
    
        } catch (error) {
            next(error);
        }
    }

    async removeTeacher(req, res, next) {
        try {
            const { classId, teacherId } = req.params;
            
            if (!teacherId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID docente richiesto'
                );
            }

            const updatedClass = await this.repository.removeTeacher(classId, teacherId);
            
            this.sendResponse(res, { 
                status: 'success',
                data: { class: updatedClass }
            });

        } catch (error) {
            next(error);
        }
    }


    async removeMainTeacher(req, res, next) {
        try {
            const { classId } = req.params;
            
            logger.debug('Removing main teacher from class:', { classId });
    
            const updatedClass = await this.repository.removeMainTeacher(classId);
            
            this.sendResponse(res, {
                status: 'success',
                data: {
                    class: updatedClass
                }
            });
    
        } catch (error) {
            logger.error('Error in removeMainTeacher:', error);
            next(error);
        }
    }

}

module.exports = ClassController;
