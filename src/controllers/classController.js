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


    // Nel ClassRepository
    async createInitialClasses(schoolId, academicYear, sections) {
        try {
            const school = await School.findById(schoolId);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            const years = school.schoolType === 'middle_school' ? 3 : 5;
            const classesToCreate = [];

            for (const section of sections) {
                if (!section.mainTeacherId) {
                    throw createError(
                        ErrorTypes.VALIDATION.BAD_REQUEST,
                        'mainTeacher richiesto per ogni sezione'
                    );
                }

                for (let year = 1; year <= years; year++) {
                    classesToCreate.push({
                        schoolId,
                        year,
                        section: section.name,
                        academicYear,
                        status: 'planned',
                        capacity: section.maxStudents,
                        mainTeacher: section.mainTeacherId,  // Usa il mainTeacherId dalla sezione
                        isActive: true
                    });
                }
            }

            const createdClasses = await Class.insertMany(classesToCreate);
            return createdClasses;
        } catch (error) {
            logger.error('Error in createInitialClasses:', error);
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella creazione classi iniziali',
                { originalError: error.message }
            );
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