// src/controllers/classController.js

const BaseController = require('./baseController');
const { class: ClassRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');


class ClassController extends BaseController {
    constructor() {
        super(ClassRepository, 'class');
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
            const classes = await this.repository.findBySchool(schoolId);
            this.sendResponse(res, { classes });
        } catch (error) {
            this.sendError(res, error);
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

            // 3. Recupera le classi
            const classes = await this.repository.findBySchool(userWithSchool.schoolId);
            
            // 4. Invia risposta
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

    async handleYearTransition(req, res) {
        try {
            const { fromYear, toYear } = req.body;
            const schoolId = req.params.schoolId;

            await this.repository.promoteStudents(fromYear, toYear);
            
            const newClasses = await this.repository.createInitialClasses(
                schoolId,
                toYear,
                req.body.sections
            );

            this.sendResponse(res, { 
                message: 'Transizione anno completata',
                newClasses 
            });
        } catch (error) {
            this.sendError(res, error);
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


}

module.exports = new ClassController();