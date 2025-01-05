// src/controllers/baseController.js

/**
 * @file baseController.js
 * @description Controller base che implementa le operazioni CRUD comuni
 * @author Raika-sama
 * @date 2025-01-05
 */

const logger = require('../utils/errors/logger/logger');

class BaseController {
    constructor(repository, modelName) {
        this.repository = repository;
        this.modelName = modelName;
    }

    /**
     * Gestisce le risposte HTTP
     */
    sendResponse(res, data, statusCode = 200) {
        res.status(statusCode).json({
            status: 'success',
            data
        });
    }

    /**
     * Gestisce gli errori
     */
    sendError(res, error) {
        logger.error(`${this.modelName} error:`, error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'INTERNAL_SERVER_ERROR'
            }
        });
    }

    /**
     * Ottiene tutti i documenti
     */
    async getAll(req, res) {
        try {
            const items = await this.repository.findAll();
            this.sendResponse(res, { [this.modelName]: items });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Ottiene un documento per ID
     */
    async getById(req, res) {
        try {
            const item = await this.repository.findById(req.params.id);
            if (!item) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: `${this.modelName} non trovato`,
                    code: 'NOT_FOUND'
                });
            }
            this.sendResponse(res, { [this.modelName]: item });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Crea un nuovo documento
     */
    async create(req, res) {
        try {
            const newItem = await this.repository.create(req.body);
            this.sendResponse(res, { [this.modelName]: newItem }, 201);
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Aggiorna un documento
     */
    async update(req, res) {
        try {
            const updatedItem = await this.repository.update(req.params.id, req.body);
            if (!updatedItem) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: `${this.modelName} non trovato`,
                    code: 'NOT_FOUND'
                });
            }
            this.sendResponse(res, { [this.modelName]: updatedItem });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Elimina un documento
     */
    async delete(req, res) {
        try {
            const deleted = await this.repository.delete(req.params.id);
            if (!deleted) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: `${this.modelName} non trovato`,
                    code: 'NOT_FOUND'
                });
            }
            this.sendResponse(res, { message: `${this.modelName} eliminato con successo` });
        } catch (error) {
            this.sendError(res, error);
        }
    }
}

module.exports = BaseController;