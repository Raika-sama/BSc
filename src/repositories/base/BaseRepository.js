// src/repositories/base/BaseRepository.js

const { AppError } = require('../../utils/errors/AppError');

/**
 * Repository Base che fornisce operazioni CRUD standard
 * Ogni repository specifico erediterà da questa classe
 */
class BaseRepository {
    constructor(model) {
        this.model = model;
        this.modelName = model.modelName;
    }

    /**
     * Crea un nuovo documento
     * @param {Object} data - Dati per creare il documento
     * @returns {Promise} Documento creato
     */
    async create(data) {
        try {
            const document = await this.model.create(data);
            return document;
        } catch (error) {
            throw new AppError(
                `Errore durante la creazione di ${this.modelName}`,
                400,
                'CREATION_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova un documento per ID
     * @param {String} id - ID del documento
     * @param {Object} options - Opzioni aggiuntive (es: populate)
     * @returns {Promise} Documento trovato
     */
    async findById(id, options = {}) {
        try {
            let query = this.model.findById(id);
            
            if (options.populate) {
                query = query.populate(options.populate);
            }

            const document = await query.exec();
            
            if (!document) {
                throw new AppError(
                    `${this.modelName} non trovato`,
                    404,
                    'NOT_FOUND'
                );
            }

            return document;
        } catch (error) {
            throw new AppError(
                `Errore durante la ricerca di ${this.modelName}`,
                error.statusCode || 500,
                error.code || 'FIND_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova documenti in base a criteri
     * @param {Object} filter - Criteri di ricerca
     * @param {Object} options - Opzioni (populate, sort, limit, skip)
     * @returns {Promise} Array di documenti
     */
    async find(filter = {}, options = {}) {
        try {
            let query = this.model.find(filter);

            if (options.populate) {
                query = query.populate(options.populate);
            }

            if (options.sort) {
                query = query.sort(options.sort);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.skip) {
                query = query.skip(options.skip);
            }

            return await query.exec();
        } catch (error) {
            throw new AppError(
                `Errore durante la ricerca di ${this.modelName}`,
                500,
                'FIND_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Aggiorna un documento per ID
     * @param {String} id - ID del documento
     * @param {Object} updateData - Dati da aggiornare
     * @param {Object} options - Opzioni aggiuntive
     * @returns {Promise} Documento aggiornato
     */
    async update(id, updateData, options = { new: true }) {
        try {
            const document = await this.model.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true, ...options }
            );

            if (!document) {
                throw new AppError(
                    `${this.modelName} non trovato per l'aggiornamento`,
                    404,
                    'NOT_FOUND'
                );
            }

            return document;
        } catch (error) {
            throw new AppError(
                `Errore durante l'aggiornamento di ${this.modelName}`,
                error.statusCode || 500,
                error.code || 'UPDATE_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Elimina un documento (soft delete)
     * @param {String} id - ID del documento
     * @returns {Promise} Risultato operazione
     */
    async delete(id) {
        try {
            // Implementa soft delete se il modello ha isActive
            const document = await this.model.findById(id);
            
            if (!document) {
                throw new AppError(
                    `${this.modelName} non trovato per l'eliminazione`,
                    404,
                    'NOT_FOUND'
                );
            }

            if ('isActive' in document) {
                document.isActive = false;
                await document.save();
                return document;
            } else {
                return await this.model.findByIdAndDelete(id);
            }
        } catch (error) {
            throw new AppError(
                `Errore durante l'eliminazione di ${this.modelName}`,
                error.statusCode || 500,
                error.code || 'DELETE_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Conta documenti in base a criteri
     * @param {Object} filter - Criteri di conteggio
     * @returns {Promise} Numero di documenti
     */
    async count(filter = {}) {
        try {
            return await this.model.countDocuments(filter);
        } catch (error) {
            throw new AppError(
                `Errore durante il conteggio di ${this.modelName}`,
                500,
                'COUNT_ERROR',
                { error: error.message }
            );
        }
    }
}

module.exports = BaseRepository;