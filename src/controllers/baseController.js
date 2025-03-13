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
        // Binding esplicito dei metodi
        this.sendResponse = this.sendResponse.bind(this);
        this.sendError = this.sendError.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }
    
 /**
   * Invia una risposta di successo standardizzata
   * @param {Response} res - Express response object
   * @param {Object} data - Dati da inviare nella risposta
   * @param {number} statusCode - Codice di stato HTTP (default: 200)
   */
 sendResponse(res, data, statusCode = 200) {
    // FIX: Evita il doppio wrapping controllando se data è già nel formato corretto
    // Se data ha già un campo 'status' e/o 'data', non lo wrappa ulteriormente
    if (data && typeof data === 'object' && (data.status || data.data)) {
      return res.status(statusCode).json(data);
    }

    // Altrimenti, usa il formato standard
    return res.status(statusCode).json({
      status: 'success',
      data: data
    });
  }

 /**
   * Invia una risposta di errore standardizzata
   * @param {Response} res - Express response object
   * @param {Object} error - Dettagli dell'errore
   */
 sendError(res, error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || 'Si è verificato un errore';
    const errorCode = error.code || 'INTERNAL_ERROR';
    const errorDetails = error.details || null;

    // Risposta di errore standardizzata
    return res.status(statusCode).json({
      status: 'error',
      error: {
        code: errorCode,
        message: errorMessage,
        ...(errorDetails && { details: errorDetails })
      }
    });
  }

    /**
   * Metodo helper per creare una risposta paginata
   * @param {Array} data - Array di elementi
   * @param {number} page - Pagina corrente
   * @param {number} limit - Elementi per pagina
   * @param {number} total - Numero totale di elementi
   * @returns {Object} Risposta paginata
   */
    paginatedResponse(data, page, limit, total) {
        return {
          data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
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

     /**
     * Elimina tutti i documenti
     */
    async deleteAll(req, res) {
        try {
            const result = await this.repository.deleteMany({});
            this.sendResponse(res, { 
                message: `Tutti i documenti ${this.resourceName} sono stati eliminati`,
                count: result.deletedCount 
            });
        } catch (error) {
            this.sendError(res, error);
        }
    }
}

module.exports = BaseController;