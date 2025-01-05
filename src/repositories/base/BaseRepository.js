// src/repositories/base/BaseRepository.js
const { ErrorTypes, createError } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        try {
            const doc = await this.model.create(data);
            return doc;
        } catch (error) {
            logger.error(`Errore nella creazione di ${this.model.modelName}`, { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                `Errore nella creazione di ${this.model.modelName}`,
                { originalError: error.message }
            );
        }
    }

    async findById(id) {
        try {
            const doc = await this.model.findById(id);
            if (!doc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    `${this.model.modelName} non trovato`
                );
            }
            return doc;
        } catch (error) {
            if (error.code) throw error; // Se è già un errore formattato
            logger.error(`Errore nel recupero di ${this.model.modelName}`, { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                `Errore nel recupero di ${this.model.modelName}`,
                { originalError: error.message }
            );
        }
    }

    async findOne(filter) {
        try {
            const doc = await this.model.findOne(filter);
            return doc;
        } catch (error) {
            logger.error(`Errore nella ricerca di ${this.model.modelName}`, { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                `Errore nella ricerca di ${this.model.modelName}`,
                { originalError: error.message }
            );
        }
    }

    async find(filter = {}) {
        try {
            const docs = await this.model.find(filter);
            return docs;
        } catch (error) {
            logger.error(`Errore nel recupero di ${this.model.modelName}`, { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                `Errore nel recupero di ${this.model.modelName}`,
                { originalError: error.message }
            );
        }
    }

    async update(id, data) {
        try {
            const doc = await this.model.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true
            });
            if (!doc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    `${this.model.modelName} non trovato`
                );
            }
            return doc;
        } catch (error) {
            if (error.code) throw error; // Se è già un errore formattato
            logger.error(`Errore nell'aggiornamento di ${this.model.modelName}`, { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                `Errore nell'aggiornamento di ${this.model.modelName}`,
                { originalError: error.message }
            );
        }
    }

    async delete(id) {
        try {
            const doc = await this.model.findByIdAndDelete(id);
            if (!doc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    `${this.model.modelName} non trovato`
                );
            }
            return doc;
        } catch (error) {
            if (error.code) throw error; // Se è già un errore formattato
            logger.error(`Errore nella cancellazione di ${this.model.modelName}`, { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                `Errore nella cancellazione di ${this.model.modelName}`,
                { originalError: error.message }
            );
        }
    }
}

module.exports = BaseRepository;