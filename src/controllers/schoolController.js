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
    async create(req, res, next) {
        try {
            // Validazione iniziale dei dati richiesti
            const schoolData = {
                ...req.body,
                users: [{ 
                    user: req.user.id, 
                    role: 'admin' 
                }],
                manager: req.user.id // L'utente che crea la scuola ne diventa il manager
            };

            logger.debug('Tentativo di creazione scuola', { data: schoolData });

            const school = await this.repository.create(schoolData);
            
            logger.info('Scuola creata con successo', { 
                schoolId: school._id,
                schoolName: school.name,
                createdBy: req.user.id
            });

            res.status(201).json({
                status: 'success',
                data: { school }
            });
        } catch (error) {
            logger.error('Errore nella creazione della scuola', { 
                error,
                requestBody: req.body 
            });

            // Gestione errori specifici
            if (error.code === 11000) {
                return next(createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Esiste già una scuola con questo nome',
                    { field: 'name' }
                ));
            }

            if (error.name === 'ValidationError') {
                return next(createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Dati scuola non validi',
                    { errors: Object.values(error.errors).map(err => ({
                        field: err.path,
                        message: err.message
                    }))}
                ));
            }

            next(createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Errore nella creazione della scuola',
                { originalError: error.message }
            ));
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
}

module.exports = new SchoolController();