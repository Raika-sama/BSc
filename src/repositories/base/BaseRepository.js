// src/repositories/base/BaseRepository.js
const handleRepositoryError = require('../../utils/errors/repositoryErrorHandler');
const logger = require('../../utils/errors/logger/logger');

class BaseRepository {
    constructor(model) {
        if (!model) {
            logger.warn('Warning: ModelName mancante nel repository', {
                repository: this.constructor.name.toLowerCase()
            });
        }
        this.model = model;
        this.repositoryName = this.constructor.name;
    }

    async create(data) {
        try {
            logger.debug('Creazione documento:', {
                modelName: this.model.modelName,
                data
            });
    
            const doc = await this.model.create(data);
            return doc;
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'create', 
                { data }, 
                this.repositoryName
            );
        }
    }

    async findById(id, options = {}) {
        try {
            let query = this.model.findById(id);
            
            // Gestione dell'opzione select
            if (options.select) {
                query = query.select(options.select);
            }
            
            // Aggiungi supporto per populate
            if (options.populate) {
                query = query.populate(options.populate);
            }

            const doc = await query.exec();
            
            if (!doc) {
                // Utilizziamo l'helper per generare un errore standard
                const error = new Error(`${this.model.modelName} non trovato`);
                error.name = 'DocumentNotFoundError';
                throw error;
            }
            
            return doc;
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'findById', 
                { id, options }, 
                this.repositoryName
            );
        }
    }

    async findOne(filter, options = {}) {
        try {
            let query = this.model.findOne(filter);
            
            // Gestione dell'opzione select
            if (options.select) {
                query = query.select(options.select);
            }
            
            const doc = await query.exec();
            return doc;
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'findOne', 
                { filter, options }, 
                this.repositoryName
            );
        }
    }

    async find(filter = {}, options = {}) {
        try {
            let query = this.model.find(filter);
            
            // Applica opzioni come sort, limit, skip
            if (options.sort) query = query.sort(options.sort);
            if (options.limit) query = query.limit(options.limit);
            if (options.skip) query = query.skip(options.skip);
            if (options.select) query = query.select(options.select);
            if (options.populate) query = query.populate(options.populate);
            
            const docs = await query.exec();
            return docs;
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'find', 
                { filter, options }, 
                this.repositoryName
            );
        }
    }

    async update(id, data) {
        try {
            const doc = await this.model.findByIdAndUpdate(
                id, 
                data, 
                {
                    new: true,
                    runValidators: true,
                    context: 'query'
                }
            );
            
            if (!doc) {
                const error = new Error(`${this.model.modelName} non trovato`);
                error.name = 'DocumentNotFoundError';
                throw error;
            }
            
            return doc;
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'update', 
                { id, data }, 
                this.repositoryName
            );
        }
    }

    async delete(id) {
        try {
            const doc = await this.model.findByIdAndDelete(id);
            
            if (!doc) {
                const error = new Error(`${this.model.modelName} non trovato`);
                error.name = 'DocumentNotFoundError';
                throw error;
            }
            
            return doc;
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'delete', 
                { id }, 
                this.repositoryName
            );
        }
    }

    async deleteMany(filter = {}) {
        try {
            return await this.model.deleteMany(filter);
        } catch (error) {
            throw handleRepositoryError(
                error, 
                'deleteMany', 
                { filter }, 
                this.repositoryName
            );
        }
    }
}

module.exports = BaseRepository;