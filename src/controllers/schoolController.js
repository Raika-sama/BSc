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
        this.addManagerToSchool = this.addManagerToSchool.bind(this);
        this.removeUserFromSchool = this.removeUserFromSchool.bind(this);
        this.changeSchoolType = this.changeSchoolType.bind(this);
        this.setupAcademicYear = this.setupAcademicYear.bind(this);
        this.getAcademicYears = this.getAcademicYears.bind(this);
        this.activateAcademicYear = this.activateAcademicYear.bind(this);
        this.archiveAcademicYear = this.archiveAcademicYear.bind(this);
        this.reactivateAcademicYear = this.reactivateAcademicYear.bind(this);
        this.getClassesByAcademicYear = this.getClassesByAcademicYear.bind(this);
        this.createSection = this.createSection.bind(this);
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
     * Crea un nuovo utente e lo associa direttamente alla scuola
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async createAndAssociateUser(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id: schoolId } = req.params;
            const userData = req.body;
            
            logger.debug('Creating and associating new user to school', { 
                schoolId, 
                userData: { ...userData, password: '[REDACTED]' } 
            });

            // 1. Verifica che la scuola esista
            const school = await this.repository.findById(schoolId);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            // 2. Verifica autorizzazioni: solo admin, developer o manager della scuola
            if (req.user.role !== 'admin' && req.user.role !== 'developer' && 
                (!school.manager || school.manager.toString() !== req.user._id.toString())) {
                throw createError(
                    ErrorTypes.AUTHORIZATION.FORBIDDEN,
                    'Non autorizzato a creare utenti per questa scuola'
                );
            }

            // 3. Crea l'utente tramite userService
            // Importa il userService se non è già disponibile nel controller
            const userService = req.app.get('userService'); // Assicurati che userService sia disponibile in app
            
            if (!userService) {
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Servizio utenti non disponibile'
                );
            }

            // 4. Crea l'utente
            const user = await userService.createUser(userData, { session });
            
            if (!user) {
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Errore nella creazione dell\'utente'
                );
            }

            // 5. Associa l'utente alla scuola
            const role = userData.schoolRole || 'teacher'; // Usa schoolRole se specificato, altrimenti 'teacher'
            const updatedSchool = await this.repository.addUser(schoolId, user._id, role, { session });

            // 6. Se l'utente è un teacher, assegna alla scuola tramite assignedSchoolIds
            if (['teacher', 'tutor'].includes(user.role)) {
                // Aggiorna direttamente l'utente per includere la scuola nei suoi assignedSchoolIds
                const User = mongoose.model('User');
                await User.findByIdAndUpdate(
                    user._id,
                    { $addToSet: { assignedSchoolIds: school._id } },
                    { session }
                );
            }

            await session.commitTransaction();
            
            logger.info('User created and associated to school successfully', {
                userId: user._id,
                schoolId,
                role
            });

            return this.sendResponse(res, {
                user,
                school: updatedSchool,
                message: 'Utente creato e associato alla scuola con successo'
            }, 201);

        } catch (error) {
            await session.abortTransaction();
            
            logger.error('Error creating and associating user to school', {
                error: error.message,
                stack: error.stack,
                schoolId: req.params.id
            });
            
            // Gestione errori specifici
            if (error.code === 11000) {
                return this.sendError(res, createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                ));
            }
            
            return this.sendError(res, error);
        } finally {
            session.endSession();
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
            const { createClasses = true, ...yearData } = req.body;
            
            yearData.createdBy = req.user.id;
            
            logger.debug('Richiesta creazione anno accademico', {
                schoolId,
                yearData: { ...yearData, createdBy: req.user.id },
                createClasses
            });
    
            // Validazione del formato dell'anno
            const yearFormat = /^\d{4}\/\d{4}$/;
            if (!yearData.year || !yearFormat.test(yearData.year)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Formato anno non valido. Deve essere YYYY/YYYY'
                ));
            }
    
            // Validazione date se presenti
            if (yearData.startDate && yearData.endDate) {
                const startDate = new Date(yearData.startDate);
                const endDate = new Date(yearData.endDate);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return this.sendError(res, createError(
                        ErrorTypes.VALIDATION.BAD_REQUEST,
                        'Date non valide'
                    ));
                }
                
                if (startDate >= endDate) {
                    return this.sendError(res, createError(
                        ErrorTypes.VALIDATION.BAD_REQUEST,
                        'La data di inizio deve essere precedente alla data di fine'
                    ));
                }
            }
            
            // Chiama il repository con il parametro per creare le classi
            const school = await this.repository.setupAcademicYear(schoolId, yearData, createClasses);
            
            logger.info('Anno accademico creato con successo', {
                schoolId,
                year: yearData.year,
                classesCreated: createClasses
            });
            
            this.sendResponse(res, { 
                school,
                message: createClasses 
                    ? 'Anno accademico creato con successo e classi generate' 
                    : 'Anno accademico creato con successo'
            });
        } catch (error) {
            logger.error('Errore nella creazione dell\'anno accademico', {
                error: error.message,
                stack: error.stack,
                schoolId: req.params.id
            });
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

    /**
     * Aggiunge un manager a una scuola
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async addManagerToSchool(req, res) {
        try {
            logger.debug('Inizio aggiunta manager alla scuola', { 
                schoolId: req.params.id,
                newManagerId: req.body.userId,
                requestedBy: req.user._id
            });

            const schoolId = req.params.id;
            const { userId } = req.body;

            if (!userId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID utente non fornito'
                );
            }

            const school = await this.repository.findById(schoolId);
            
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            // Verifica che non ci sia già un manager
            if (school.manager) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'La scuola ha già un manager'
                );
            }

            // Esegui l'aggiunta attraverso il repository
            const result = await this.repository.addManagerToSchool(schoolId, userId);

            logger.info('Manager aggiunto con successo', {
                schoolId,
                newManagerId: userId,
                updatedSchool: result.school._id
            });

            // Invia la risposta
            return res.status(200).json({
                status: 'success',
                data: {
                    school: result.school,
                    newManagerId: result.newManagerId,
                    message: 'Manager aggiunto con successo'
                }
            });

        } catch (error) {
            logger.error('Errore nell\'aggiunta del manager:', {
                error: error.message,
                schoolId: req.params.id,
                stack: error.stack
            });

            return res.status(error.statusCode || 500).json({
                status: 'error',
                error: {
                    message: error.message || 'Errore nell\'aggiunta del manager',
                    code: error.code || 'INTERNAL_SERVER_ERROR'
                }
            });
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
     * Aggiunge un utente a una scuola
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async addUserToSchool(req, res) {
        try {
            const { id } = req.params;
            const { userId, role, email } = req.body;

            logger.debug('Adding user to school', {
                schoolId: id,
                userId,
                email,
                role
            });

            // Verifica autorizzazioni: solo admin, developer o manager della scuola
            const school = await this.repository.findById(id);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            if (req.user.role !== 'admin' && req.user.role !== 'developer' && 
                (!school.manager || school.manager.toString() !== req.user._id.toString())) {
                throw createError(
                    ErrorTypes.AUTHORIZATION.FORBIDDEN,
                    'Non autorizzato ad aggiungere utenti alla scuola'
                );
            }

            // Se è stato fornito l'email invece dell'userId, cerca l'utente
            let actualUserId = userId;
            if (!userId && email) {
                const User = mongoose.model('User');
                const user = await User.findOne({ email }).select('_id');
                if (!user) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        `Nessun utente trovato con email: ${email}`
                    );
                }
                actualUserId = user._id;
            }

            if (!actualUserId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID utente o email richiesto'
                );
            }

            // Verifica che il ruolo sia valido
            const validRoles = ['teacher', 'admin'];
            if (!validRoles.includes(role)) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Ruolo non valido. Valori accettati: teacher, admin'
                );
            }

            const updatedSchool = await this.repository.addUser(id, actualUserId, role);
            
            return this.sendResponse(res, {
                school: updatedSchool,
                message: 'Utente aggiunto con successo'
            });
        } catch (error) {
            logger.error('Error adding user to school', error);
            return this.sendError(res, error);
        }
    }



    /**
     * Rimuove un utente da una scuola
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async removeUserFromSchool(req, res) {
        try {
            logger.debug('Inizio rimozione utente dalla scuola', { 
                schoolId: req.params.id,
                userId: req.body.userId,
                requestedBy: req.user._id
            });

            const schoolId = req.params.id;
            const { userId } = req.body;

            if (!userId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID utente non fornito'
                );
            }

            const school = await this.repository.findById(schoolId);
            
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }

            // Verifica autorizzazioni: solo admin, developer o manager della scuola
            if (req.user.role !== 'admin' && req.user.role !== 'developer' && 
                (!school.manager || school.manager.toString() !== req.user._id.toString())) {
                throw createError(
                    ErrorTypes.AUTHORIZATION.FORBIDDEN,
                    'Non autorizzato a rimuovere utenti dalla scuola'
                );
            }

            // Esegui la rimozione attraverso il repository
            const result = await this.repository.removeUser(schoolId, userId);

            // Invia la risposta
            return this.sendResponse(res, {
                school: result.school,
                message: 'Utente rimosso con successo',
                stats: {
                    classesUpdated: result.classesUpdated || 0,
                    studentsUpdated: result.studentsUpdated || 0
                }
            });

        } catch (error) {
            logger.error('Errore nella rimozione dell\'utente dalla scuola:', {
                error: error.message,
                schoolId: req.params.id,
                userId: req.body.userId,
                stack: error.stack
            });

            return this.sendError(res, error);
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

    async changeSchoolType(req, res) {
        try {
            const { id } = req.params;
            const { schoolType, institutionType } = req.body;
    
            logger.debug('Richiesta cambio tipo scuola:', {
                schoolId: id,
                schoolType,
                institutionType,
                userId: req.user.id
            });
    
            // Verifica autorizzazioni (solo admin)
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTHORIZATION.FORBIDDEN,
                    'Solo gli amministratori possono cambiare il tipo di scuola'
                );
            }
    
            // Usa il metodo specializzato del repository
            const school = await this.repository.changeSchoolType(id, {
                schoolType,
                institutionType
            });
    
            // Log e risposta
            logger.info('Tipo scuola cambiato con successo:', {
                schoolId: id,
                newType: schoolType,
                newInstitutionType: institutionType,
                userId: req.user.id
            });
    
            this.sendResponse(res, {
                status: 'success',
                data: { school }
            });
        } catch (error) {
            logger.error('Errore nel cambio tipo scuola:', {
                error: error.message,
                stack: error.stack,
                schoolId: req.params.id
            });
            this.sendError(res, error);
        }
    }

    
/**
 * Crea un nuovo anno accademico per una scuola
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
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
        
        logger.debug('Richiesta creazione anno accademico', {
            schoolId,
            yearData: { ...yearData, createdBy: req.user.id }
        });

        // Validazione del formato dell'anno
        const yearFormat = /^\d{4}\/\d{4}$/;
        if (!yearFormat.test(yearData.year)) {
            return this.sendError(res, createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Formato anno non valido. Deve essere YYYY/YYYY'
            ));
        }

        // Validazione date se presenti
        if (yearData.startDate && yearData.endDate) {
            const startDate = new Date(yearData.startDate);
            const endDate = new Date(yearData.endDate);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Date non valide'
                ));
            }
            
            if (startDate >= endDate) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'La data di inizio deve essere precedente alla data di fine'
                ));
            }
        }
        
        const school = await this.repository.setupAcademicYear(schoolId, yearData);
        
        logger.info('Anno accademico creato con successo', {
            schoolId,
            year: yearData.year
        });
        
        this.sendResponse(res, { 
            school,
            message: 'Anno accademico creato con successo'
        });
    } catch (error) {
        logger.error('Errore nella creazione dell\'anno accademico', {
            error: error.message,
            stack: error.stack,
            schoolId: req.params.id
        });
        this.sendError(res, error);
    }
}

/**
 * Attiva un anno accademico specifico
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async activateAcademicYear(req, res) {
    try {
        const { id: schoolId, yearId } = req.params;
        
        logger.debug('Richiesta attivazione anno accademico', {
            schoolId,
            yearId,
            userId: req.user.id
        });

        // Verifica autorizzazioni (solo admin e manager della scuola)
        const school = await this.repository.findById(schoolId);
        if (!school) {
            return this.sendError(res, createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Scuola non trovata'
            ));
        }

        if (req.user.role !== 'admin' && 
            (!school.manager || school.manager.toString() !== req.user._id.toString())) {
            return this.sendError(res, createError(
                ErrorTypes.AUTHORIZATION.FORBIDDEN,
                'Non autorizzato ad attivare anni accademici per questa scuola'
            ));
        }

        const updatedSchool = await this.repository.activateAcademicYear(schoolId, yearId);
        
        logger.info('Anno accademico attivato con successo', {
            schoolId,
            yearId,
            userId: req.user.id
        });
        
        this.sendResponse(res, { 
            school: updatedSchool,
            message: 'Anno accademico attivato con successo'
        });
    } catch (error) {
        logger.error('Errore nell\'attivazione dell\'anno accademico', {
            error: error.message,
            stack: error.stack,
            schoolId: req.params.id,
            yearId: req.params.yearId
        });
        this.sendError(res, error);
    }
}

/**
 * Archivia un anno accademico specifico
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async archiveAcademicYear(req, res) {
    try {
        const { id: schoolId, yearId } = req.params;
        
        logger.debug('Richiesta archiviazione anno accademico', {
            schoolId,
            yearId,
            userId: req.user.id
        });

        // Verifica autorizzazioni (solo admin e manager della scuola)
        const school = await this.repository.findById(schoolId);
        if (!school) {
            return this.sendError(res, createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Scuola non trovata'
            ));
        }

        if (req.user.role !== 'admin' && 
            (!school.manager || school.manager.toString() !== req.user._id.toString())) {
            return this.sendError(res, createError(
                ErrorTypes.AUTHORIZATION.FORBIDDEN,
                'Non autorizzato ad archiviare anni accademici per questa scuola'
            ));
        }

        const updatedSchool = await this.repository.archiveAcademicYear(schoolId, yearId);
        
        logger.info('Anno accademico archiviato con successo', {
            schoolId,
            yearId,
            userId: req.user.id
        });
        
        this.sendResponse(res, { 
            school: updatedSchool,
            message: 'Anno accademico archiviato con successo'
        });
    } catch (error) {
        logger.error('Errore nell\'archiviazione dell\'anno accademico', {
            error: error.message,
            stack: error.stack,
            schoolId: req.params.id,
            yearId: req.params.yearId
        });
        this.sendError(res, error);
    }
}

/**
 * Recupera le classi per un determinato anno accademico
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async getClassesByAcademicYear(req, res) {
    try {
        const { id: schoolId } = req.params;
        const { academicYear } = req.query;
        
        if (!academicYear) {
            return this.sendError(res, createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Anno accademico richiesto'
            ));
        }
        
        logger.debug('Richiesta classi per anno accademico', {
            schoolId,
            academicYear,
            userId: req.user.id
        });

        const classes = await this.repository.getClassesByAcademicYear(schoolId, academicYear);
        
        // Aggiungi virtuals e altre proprietà utili
        const classesWithExtras = classes.map(cls => {
            // Calcola il numero di studenti attivi
            const activeStudentsCount = cls.students 
                ? cls.students.filter(s => s.status === 'active').length 
                : 0;
            
            return {
                ...cls,
                activeStudentsCount
            };
        });
        
        logger.debug('Classi recuperate con successo', {
            schoolId,
            academicYear,
            count: classesWithExtras.length
        });
        
        this.sendResponse(res, { 
            classes: classesWithExtras
        });
    } catch (error) {
        logger.error('Errore nel recupero delle classi per anno accademico', {
            error: error.message,
            stack: error.stack,
            schoolId: req.params.id,
            academicYear: req.query.academicYear
        });
        this.sendError(res, error);
    }
}

/**
 * Crea una nuova sezione per una scuola
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async createSection(req, res) {
    try {
        const schoolId = req.params.id;
        const { name, maxStudents, isActive = true } = req.body;
        
        logger.debug('Richiesta creazione nuova sezione', {
            schoolId,
            name,
            maxStudents,
            isActive,
            userId: req.user.id
        });

        // Validazione
        if (!name || !/^[A-Z]$/.test(name)) {
            return this.sendError(res, createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Il nome della sezione deve essere una singola lettera maiuscola (A-Z)'
            ));
        }
        
        // Trova la scuola
        const school = await this.repository.findById(schoolId);
        if (!school) {
            return this.sendError(res, createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Scuola non trovata'
            ));
        }
        
        // Verifica se la sezione esiste già
        const sectionExists = school.sections.some(
            s => s.name.toUpperCase() === name.toUpperCase()
        );
        
        if (sectionExists) {
            return this.sendError(res, createError(
                ErrorTypes.RESOURCE.ALREADY_EXISTS,
                'Esiste già una sezione con questo nome'
            ));
        }
        
        // Validazione del numero massimo di studenti
        const minStudents = 15;
        const maxStudentsLimit = school.schoolType === 'middle_school' ? 30 : 35;
        
        const normalizedMaxStudents = Math.min(
            Math.max(parseInt(maxStudents) || school.defaultMaxStudentsPerClass, minStudents),
            maxStudentsLimit
        );
        
        // Crea la nuova sezione
        school.sections.push({
            name: name.toUpperCase(),
            isActive,
            maxStudents: normalizedMaxStudents,
            academicYears: [],
            createdAt: new Date()
        });
        
        // Se c'è un anno attivo, aggiungi la configurazione per quell'anno
        const activeYear = school.academicYears.find(y => y.status === 'active');
        if (activeYear) {
            const newSection = school.sections[school.sections.length - 1];
            newSection.academicYears.push({
                year: activeYear.year,
                status: 'active',
                maxStudents: normalizedMaxStudents,
                activatedAt: new Date()
            });
            
            logger.debug('Added academic year configuration to new section', {
                sectionName: name,
                academicYear: activeYear.year
            });
        }
        
        await school.save();
        
        // Ottieni l'ultima sezione aggiunta (quella appena creata)
        const newSection = school.sections[school.sections.length - 1];
        
        logger.info('Sezione creata con successo', {
            schoolId,
            sectionName: newSection.name,
            maxStudents: newSection.maxStudents
        });
        
        this.sendResponse(res, {
            section: newSection,
            message: 'Sezione creata con successo'
        });
    } catch (error) {
        logger.error('Errore nella creazione della sezione', {
            error: error.message,
            stack: error.stack,
            schoolId: req.params.id
        });
        this.sendError(res, error);
    }
}
    
    /**
     * Riattiva un anno accademico precedentemente archiviato
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async reactivateAcademicYear(req, res) {
        try {
            const { id: schoolId, yearId } = req.params;
            
            logger.debug('Richiesta riattivazione anno accademico archiviato', {
                schoolId,
                yearId,
                userId: req.user.id
            });

            // Verifica autorizzazioni (solo admin e manager della scuola)
            const school = await this.repository.findById(schoolId);
            if (!school) {
                return this.sendError(res, createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                ));
            }

            if (req.user.role !== 'admin' && 
                (!school.manager || school.manager.toString() !== req.user._id.toString())) {
                return this.sendError(res, createError(
                    ErrorTypes.AUTHORIZATION.FORBIDDEN,
                    'Non autorizzato a riattivare anni accademici per questa scuola'
                ));
            }

            // Verifica che l'anno esista e sia archiviato
            const yearToReactivate = school.academicYears.id(yearId);
            if (!yearToReactivate) {
                return this.sendError(res, createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Anno accademico non trovato'
                ));
            }

            if (yearToReactivate.status !== 'archived') {
                return this.sendError(res, createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Solo gli anni accademici archiviati possono essere riattivati'
                ));
            }

            const updatedSchool = await this.repository.reactivateAcademicYear(schoolId, yearId);
            
            logger.info('Anno accademico riattivato con successo', {
                schoolId,
                yearId,
                yearValue: yearToReactivate.year,
                userId: req.user.id
            });
            
            this.sendResponse(res, { 
                school: updatedSchool,
                message: 'Anno accademico riattivato con successo. Ora è in stato "planned" e può essere attivato.'
            });
        } catch (error) {
            logger.error('Errore nella riattivazione dell\'anno accademico', {
                error: error.message,
                stack: error.stack,
                schoolId: req.params.id,
                yearId: req.params.yearId
            });
            this.sendError(res, error);
        }
    }
}

module.exports = SchoolController;  // CORRETTO
