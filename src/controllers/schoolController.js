// src/controllers/schoolController.js

/**
 * @file schoolController.js
 * @description Controller per la gestione delle scuole
 */

const BaseController = require('./baseController');
const { school: SchoolRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');

class SchoolController extends BaseController {
    constructor() {
        super(SchoolRepository, 'school');
    }

    /**
     * Trova scuole per regione
     */
    async getByRegion(req, res) {
        try {
            const { region } = req.params;
            const schools = await this.repository.findByRegion(region);
            this.sendResponse(res, { schools });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Trova scuole per tipo
     */
    async getByType(req, res) {
        try {
            const { type } = req.params;
            const schools = await this.repository.findByType(type);
            this.sendResponse(res, { schools });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Override del metodo create per aggiungere validazione specifica
     */
    async create(req, res) {
        try {
            // Validazione specifica per la scuola
            const { name, schoolType, institutionType, region } = req.body;
            
            if (!name || !schoolType || !institutionType || !region) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Dati scuola incompleti',
                    code: 'VALIDATION_ERROR'
                });
            }

            // Procedi con la creazione
            const school = await this.repository.create(req.body);
            logger.info('Nuova scuola creata', { schoolId: school._id });
            this.sendResponse(res, { school }, 201);
        } catch (error) {
            this.sendError(res, error);
        }
    }
}

module.exports = new SchoolController();