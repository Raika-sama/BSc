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
     * Invia una risposta di successo con i dati forniti
     * @param {Object} res - Oggetto response di Express
     * @param {*} data - Dati da inviare nella risposta
     * @param {number} status - Codice di stato HTTP (default: 200)
     * @param {string} message - Messaggio da includere nella risposta (opzionale)
     */
sendResponse(res, data, status = 200, message = '') {
    try {
        console.log(`[BaseController] Invio risposta con status ${status}:`, JSON.stringify({
            data: typeof data === 'object' ? { ...data } : data,
            message: message,
            status: status
        }, null, 2).substring(0, 1000) + '...');
        
        // Verifica che i dati non siano null o undefined
        if (data === null || data === undefined) {
            console.warn('[BaseController] Attenzione: data è null o undefined, invio oggetto vuoto');
            data = {};
        }
        
        // Verifica che i conteggi siano numeri
        if (data && typeof data === 'object') {
            if ('passedTests' in data && (data.passedTests === null || data.passedTests === undefined)) {
                data.passedTests = 0;
            }
            if ('failedTests' in data && (data.failedTests === null || data.failedTests === undefined)) {
                data.failedTests = 0;
            }
            if ('totalTests' in data && (data.totalTests === null || data.totalTests === undefined)) {
                data.totalTests = 0;
            }
            
            // Verifica che i conteggi siano coerenti
            if ('totalTests' in data && 'passedTests' in data && 'failedTests' in data) {
                if (data.totalTests !== (data.passedTests + data.failedTests)) {
                    console.warn(`[BaseController] Correzione totalTests: ${data.totalTests} !== ${data.passedTests} + ${data.failedTests}`);
                    data.totalTests = data.passedTests + data.failedTests;
                }
            }
            
            // Assicurati che testResults sia un array
            if ('testResults' in data && !Array.isArray(data.testResults)) {
                console.warn('[BaseController] testResults non è un array, lo imposto a []');
                data.testResults = [];
            }
        }
        
        // Assicurati che il corpo della risposta sia un oggetto
        const responseBody = {
            status: status >= 200 && status < 300 ? 'success' : 'error',
            data: data,
            message: message || '',
        };
        
        // Verifica che la risposta sia serializzabile
        try {
            // Test di serializzazione
            JSON.stringify(responseBody);
        } catch (serializeError) {
            console.error('[BaseController] Errore nella serializzazione JSON della risposta:', serializeError);
            
            // Crea una versione semplificata della risposta
            const safeResponseBody = {
                status: responseBody.status,
                data: {
                    success: data.success === undefined ? true : data.success,
                    passedTests: data.passedTests || 0,
                    failedTests: data.failedTests || 0,
                    totalTests: data.totalTests || 0,
                    duration: data.duration || 0,
                    // Rimuovi campi potenzialmente problematici
                    rawOutput: 'Rimosso per problemi di serializzazione',
                    testResults: []
                },
                message: message || 'Risposta semplificata per problemi di serializzazione'
            };
            
            return res.status(status).json(safeResponseBody);
        }
        
        // Invia la risposta completa
        return res.status(status).json(responseBody);
    } catch (error) {
        console.error('[BaseController] Errore critico durante l\'invio della risposta:', error);
        
        // Fallback di emergenza
        return res.status(500).json({
            status: 'error',
            message: 'Errore interno durante l\'invio della risposta',
            data: {
                success: false,
                passedTests: 0,
                failedTests: 1,
                totalTests: 1
            }
        });
    }
}

    /**
     * Gestisce gli errori
     */
    sendError(res, error, next) {
        if (next) {
            next(error);
            return;
        }
        
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