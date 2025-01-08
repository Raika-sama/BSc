/**
 * @file schoolController.js
 * @description Controller per la gestione delle scuole
 */

const BaseController = require('./baseController');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const { school: SchoolRepository } = require('../repositories');


class SchoolController extends BaseController {
    constructor() {
        super(SchoolRepository, 'school');
        // Binding dei metodi
        this.create = this.create.bind(this);
        this.getByRegion = this.getByRegion.bind(this);
        this.getByType = this.getByType.bind(this);
    }



    
    /**
     * Crea una nuova scuola
     * @override
     */
    async create(req, res) {
        try {
            const schoolData = {
                ...req.body,
                manager: req.user.id,
                users: [{ 
                    user: req.user.id, 
                    role: 'admin' 
                }]
            };
    
            logger.debug('Tentativo di creazione scuola', { data: schoolData });
    
            const school = await this.repository.create(schoolData);
            
            logger.info('Scuola creata con successo', { 
                schoolId: school._id,
                schoolName: school.name,
                createdBy: req.user.id
            });
    
            return this.sendResponse(res, { school }, 201);
        } catch (error) {
            logger.error('Errore nella creazione della scuola', { error });
    
            // Gestione errore duplicato
            if (error.code === 11000) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Esiste già una scuola con questo nome',
                    code: 'SCHOOL_001'
                });
            }
    
            // Errori di validazione
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
    
            // Altri errori
            return this.sendError(res, {
                statusCode: 500,
                message: 'Errore nella creazione della scuola',
                code: 'SCHOOL_003'
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
            const schools = await this.repository.find({}); // Usa find invece di findAll
            
            res.status(200).json({
                status: 'success',
                results: schools.length,
                data: { schools }
            });
        } catch (error) {
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

}

module.exports = new SchoolController();