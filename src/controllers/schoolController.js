/**
 * @file schoolController.js
 * @description Controller per la gestione delle scuole
 */
const mongoose = require('mongoose');
const BaseController = require('./baseController');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const repositories = require('../repositories');
const schoolRepository = repositories.school;
const classRepository = repositories.class;
const studentRepository = repositories.student;
const { School, Class } = require('../models');  // Aggiungi Class qui

class SchoolController extends BaseController {
    constructor() {
        super(schoolRepository);
        this.repository = schoolRepository;
        this.classRepository = classRepository;
        this.studentRepository = studentRepository;

        // Binding dei metodi
        this.create = this.create.bind(this);
        this.sendError = this.sendError.bind(this);
        this.sendResponse = this.sendResponse.bind(this);
        this.getByRegion = this.getByRegion.bind(this);
        this.getByType = this.getByType.bind(this);
        this.getMySchool = this.getMySchool.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.addUserToSchool = this.addUserToSchool.bind(this);
        this.setupInitialConfiguration = this.setupInitialConfiguration.bind(this);
        this.removeManagerFromSchool = this.removeManagerFromSchool.bind(this);

    }

    // Aggiungi questi metodi di utility
    sendError(res, error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            }
        });
    }

    sendResponse(res, data, statusCode = 200) {
        res.status(statusCode).json({
            status: 'success',
            data
        });
    }

    /**
     * Ottiene la scuola associata all'utente corrente
     */
    async getMySchool(req, res) {
        try {
            logger.debug('Starting getMySchool method', {
                user: req.user,
                userId: req.user._id
            });

            // Prima trova le classi dove l'utente è mainTeacher
            const userClass = await this.classRepository.findOne({
                mainTeacher: req.user._id
            });

            logger.debug('Found class:', { userClass });

            if (!userClass) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Nessuna classe associata all\'utente',
                    code: 'CLASS_NOT_FOUND'
                });
            }

            // Poi usa lo schoolId della classe per trovare la scuola
            const school = await this.repository.findById(userClass.schoolId);

            logger.debug('Found school:', { school });

            if (!school) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Scuola non trovata',
                    code: 'SCHOOL_NOT_FOUND'
                });
            }

            this.sendResponse(res, {
                school
            });

        } catch (error) {
            logger.error('Error in getMySchool:', {
                error: error.message,
                stack: error.stack,
                userId: req.user?._id
            });

            this.sendError(res, {
                statusCode: 500,
                message: 'Errore nel recupero della scuola',
                code: 'SCHOOL_FETCH_ERROR',
                error: error.message
            });
        }
    }

    /**
     * Crea una nuova scuola
     * @override
     */
    async create(req, res) {
        try {
            console.log('Received school creation request:', {
                body: req.body,
                user: req.user
            });
    
            const schoolData = {
                ...req.body,
                manager: req.user.id
            };
    
            console.log('Attempting to create school with data:', schoolData);
    
            const school = await this.repository.create(schoolData);
            
            console.log('School created successfully:', {
                schoolId: school._id,
                schoolName: school.name
            });
    
            return this.sendResponse(res, { school }, 201);
        } catch (error) {
            console.error('School creation error:', {
                error: error.message,
                stack: error.stack,
                code: error.code
            });
    
            if (error.code === 11000) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Esiste già una scuola con questo nome',
                    code: 'SCHOOL_001'
                });
            }
    
            if (error.name === 'ValidationError') {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Dati scuola non validi',
                    code: 'SCHOOL_002',
                    errors: Object.values(error.errors).map(err => ({
                        field: err.path,
                        message: err.message
                    }))
                });
            }
    
            return this.sendError(res, {
                statusCode: 500,
                message: 'Errore nella creazione della scuola',
                code: 'SCHOOL_003',
                details: error.message
            });
        }
    }

    /**
     * Trova scuole per regione
     */
    async getByRegion(req, res, next) {
        try {
            const { region } = req.params;
            logger.debug('Ricerca scuole per regione', { region });

            const schools = await this.repository.find({ region });

            res.status(200).json({
                status: 'success',
                results: schools.length,
                data: { schools }
            });
        } catch (error) {
            logger.error('Errore nel recupero scuole per regione', { 
                error,
                region: req.params.region 
            });
            next(error);
        }
    }

    /**
     * Trova scuole per tipo
     */
    async getByType(req, res, next) {
        try {
            const { type } = req.params;
            logger.debug('Ricerca scuole per tipo', { type });

            const schools = await this.repository.find({ schoolType: type });

            res.status(200).json({
                status: 'success',
                results: schools.length,
                data: { schools }
            });
        } catch (error) {
            logger.error('Errore nel recupero scuole per tipo', { 
                error,
                type: req.params.type 
            });
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            logger.debug('Getting all schools', { 
                userRole: req.user.role,
                userId: req.user.id 
            });
    
            let schools;
            
            // Se admin, vede tutte le scuole
            if (req.user.role === 'admin') {
                schools = await this.repository.findAll();
                logger.debug('Admin user - returning all schools', { 
                    count: schools.length 
                });
            } 
            // Se teacher, vede solo le sue scuole
            else {
                schools = await this.repository.find({ 
                    'users.user': req.user._id 
                });
                logger.debug('Teacher user - returning filtered schools', { 
                    count: schools.length 
                });
            }
    
            res.status(200).json({
                status: 'success',
                results: schools.length,
                data: { schools }
            });
        } catch (error) {
            logger.error('Errore nel recupero delle scuole', { error });
            next(error);
        }
    }

    async getById(req, res) {
        try {
            logger.debug('Recupero scuola con dettagli utenti', { 
                schoolId: req.params.id 
            });
    
            // Usa findWithUsers invece di findById
            const school = await this.repository.findWithUsers(req.params.id);
            
            logger.debug('Scuola recuperata con successo', { 
                schoolId: school._id,
                usersCount: school.users.length,
                users: JSON.stringify(school.users) // Aggiungi questo per debug
            });
    
            this.sendResponse(res, { school });
        } catch (error) {
            logger.error('Errore nel recupero della scuola', { 
                error,
                schoolId: req.params.id 
            });
            this.sendError(res, error);
        }
    }

    async setupInitialConfiguration(req, res) {
        try {
            if (!req.user) {
                return this.sendError(res, {
                    statusCode: 401,
                    message: 'Authentication required'
                });
            }
    
            const { academicYear, sections } = req.body;
            const schoolId = req.params.id;
    
            // Verifica i dati richiesti
            if (!academicYear || !sections || !sections.length) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Missing required data'
                });
            }
    
            const academicYearSetup = await this.repository.setupAcademicYear(schoolId, {
                year: academicYear,
                status: 'active',
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                createdBy: req.user.id
            });
    
            const { sections: configuredSections } = await this.repository.configureSections(
                schoolId, 
                sections
            );
    
            await this.classRepository.createInitialClasses(
                schoolId,
                academicYear,
                sections
            );
    
            return this.sendResponse(res, {
                academicYear: academicYearSetup,
                sections: configuredSections
            });
        } catch (error) {
            logger.error('Setup configuration error:', error);
            return this.sendError(res, {
                statusCode: error.statusCode || 500,
                message: error.message
            });
        }
    }


    async getAcademicYears(req, res) {
        try {
            const schoolId = req.params.id;
            const school = await this.repository.findById(schoolId);
            this.sendResponse(res, { academicYears: school.academicYears });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    async setupAcademicYear(req, res) {
        try {
            const schoolId = req.params.id;
            const yearData = {
                year: req.body.year,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                status: req.body.status || 'planned',
                createdBy: req.user.id
            };
            
            const school = await this.repository.setupAcademicYear(schoolId, yearData);
            this.sendResponse(res, { school });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const result = await this.repository.deleteWithClasses(req.params.id);
            
            this.sendResponse(res, {
                message: 'Scuola e dati correlati eliminati con successo',
                deletedData: {
                    school: result.school.name,
                    classesCount: result.deletedClassesCount
                }
            });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    async addUserToSchool(req, res) {
        try {
            const { id } = req.params;
            const { userId, role } = req.body;
    
            logger.debug('Adding user to school', {
                schoolId: id,
                userId,
                role
            });
    
            const school = await this.repository.addUser(id, userId, role);
            
            return this.sendResponse(res, {
                school
            });
        } catch (error) {
            logger.error('Error adding user to school', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Rimuove il manager da una scuola e aggiorna le relative entità
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async removeManagerFromSchool(req, res) {
        try {
            logger.debug('Inizio rimozione manager dalla scuola', { 
                schoolId: req.params.id,
                requestedBy: req.user._id
            });
    
            const schoolId = req.params.id;
            const school = await this.repository.findById(schoolId);
            
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            // 2. Verifica che ci sia un manager da rimuovere
            if (!school.manager) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'La scuola non ha un manager da rimuovere'
                );
            }
    
            // 3. Esegui la rimozione attraverso il repository
            const result = await this.repository.removeManagerFromSchool(schoolId);
    
            logger.info('Manager rimosso con successo', {
                schoolId,
                oldManagerId: result.oldManagerId,
                updatedSchool: result.school._id
            });
    
            // 4. Invia la risposta
            return res.status(200).json({
                status: 'success',
                data: {
                    school: result.school,
                    oldManagerId: result.oldManagerId,
                    message: 'Manager rimosso con successo'
                }
            });
    
        } catch (error) {
            logger.error('Errore nella rimozione del manager:', {
                error: error.message,
                schoolId: req.params.id,
                stack: error.stack
            });
    
            return res.status(error.statusCode || 500).json({
                status: 'error',
                error: {
                    message: error.message || 'Errore nella rimozione del manager',
                    code: error.code || 'INTERNAL_SERVER_ERROR'
                }
            });
        }
    }

    /**
     * Gestisce la disattivazione di una sezione
     */
    async deactivateSection(req, res) {
        try {
            const { schoolId, sectionName } = req.params;

            logger.debug('Controller: Inizio deactivateSection', {
                schoolId,
                sectionName,
                hasRepository: !!this.repository,
                hasClassRepository: !!this.repository.classRepository // Verifica se classRepository è definito
            });

            // 1. Prima recupera gli studenti che saranno impattati
            const students = await this.repository.getStudentsBySection(schoolId, sectionName);
            
            // 2. Disattiva la sezione
            const updatedSchool = await this.repository.deactivateSection(schoolId, sectionName);
            
            // 3. Aggiorna gli studenti
            const studentUpdateResult = await this.studentRepository.updateStudentsForDeactivatedSection(
                schoolId, 
                sectionName
            );

            logger.info('Sezione disattivata con successo:', {
                schoolId,
                sectionName,
                studentsUpdated: studentUpdateResult.modifiedCount
            });

            this.sendResponse(res, {
                message: 'Sezione disattivata con successo',
                studentsUpdated: studentUpdateResult.modifiedCount,
                school: updatedSchool
            });

        } catch (error) {
            logger.error('Errore nella disattivazione della sezione:', {
                error: error.message,
                stack: error.stack
            });
            this.sendError(res, error);
        }
    }

    /**
     * Riattiva una sezione precedentemente disattivata
     */
    async reactivateSection(req, res) {
        try {
            const { schoolId, sectionName } = req.params;
            
            logger.debug('Controller: Richiesta riattivazione sezione', {
                schoolId,
                sectionName,
                userId: req.user?.id
            });

            const result = await this.repository.reactivateSection(schoolId, sectionName);

            this.sendResponse(res, {
                status: 'success',
                data: {
                    school: result.school,
                    classesReactivated: result.classesReactivated
                }
            });

        } catch (error) {
            logger.error('Controller: Errore nella riattivazione sezione', {
                error: error.message,
                schoolId: req.params.schoolId,
                sectionName: req.params.sectionName
            });
            this.sendError(res, error);
        }
    }

    /**
     * Recupera le sezioni di una scuola con il conteggio degli studenti
     */
    async getSections(req, res) {
        try {
            const schoolId = req.params.id;
            const { includeInactive = false } = req.query;

            logger.debug('Richiesta recupero sezioni:', {
                schoolId,
                includeInactive,
                userRole: req.user.role
            });

            // Recupera la scuola
            let school;
            try {
                school = await this.repository.findById(schoolId);
                logger.debug('Scuola trovata:', {
                    schoolId: school._id,
                    schoolName: school.name
                });
            } catch (error) {
                logger.error('Errore nel recupero della scuola:', {
                    error: error.message,
                    schoolId
                });
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Scuola non trovata',
                    code: 'SCHOOL_NOT_FOUND'
                });
            }

            // Verifica autorizzazioni
            if (req.user.role !== 'admin') {
                if (!req.user.schoolId || req.user.schoolId.toString() !== schoolId) {
                    return this.sendError(res, {
                        statusCode: 403,
                        message: 'Non autorizzato ad accedere a questa scuola',
                        code: 'UNAUTHORIZED_SCHOOL_ACCESS'
                    });
                }
            }

            // Recupera il conteggio degli studenti per sezione
            const classesWithStudents = await Class.aggregate([
                { 
                    $match: { 
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        isActive: true 
                    } 
                },
                {
                    $group: {
                        _id: '$section',
                        studentCount: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: '$students',
                                        as: 'student',
                                        cond: { $eq: ['$$student.status', 'active'] }
                                    }
                                }
                            }
                        }
                    }
                }
            ]);

            // Mappa le sezioni con i conteggi
            const sections = school.sections
                .filter(section => includeInactive === 'true' || section.isActive)
                .map(section => {
                    const stats = classesWithStudents.find(c => c._id === section.name);
                    return {
                        ...section.toObject(),
                        studentsCount: stats?.studentCount || 0
                    };
                });

            logger.debug('Sezioni recuperate con successo:', {
                schoolId,
                sectionsCount: sections.length,
                sectionsWithStudents: sections.map(s => ({
                    name: s.name,
                    studentsCount: s.studentsCount
                }))
            });

            this.sendResponse(res, {
                sections: sections
            });

        } catch (error) {
            logger.error('Errore nel recupero delle sezioni:', {
                error: error.message,
                stack: error.stack
            });
            this.sendError(res, {
                statusCode: 500,
                message: 'Errore interno nel recupero delle sezioni',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    async getSectionStudents(req, res) {
        try {
            const { schoolId, sectionName } = req.params;

            logger.debug('Recupero studenti della sezione:', {
                schoolId,
                sectionName
            });

            const students = await this.repository.getStudentsBySection(schoolId, sectionName);

            // Formatta i dati degli studenti per il frontend
            const formattedStudents = students.map(student => ({
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                year: student.year,
                currentClass: student.currentClass
            }));

            this.sendResponse(res, {
                students: formattedStudents
            });

        } catch (error) {
            logger.error('Errore nel recupero degli studenti della sezione:', {
                error: error.message,
                stack: error.stack
            });
            this.sendError(res, {
                statusCode: 500,
                message: 'Errore nel recupero degli studenti della sezione',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    
}

module.exports = SchoolController;  // CORRETTO
