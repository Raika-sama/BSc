const CSIQuestionRepository = require('./CSIQuestionRepository');
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const semver = require('semver');

class CSIQuestionService {
    constructor(repository = CSIQuestionRepository) {
        if (!repository) {
            throw new Error('Repository is required');
        }
        this.repository = repository;
    }
    /**
     * Validate question data
     */
    _validateQuestionData(data) {
        const requiredFields = ['testo', 'categoria', 'metadata.polarity'];
        const missingFields = requiredFields.filter(field => {
            const value = field.split('.').reduce((obj, key) => obj?.[key], data);
            return value === undefined;
        });

        if (missingFields.length > 0) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                `Missing required fields: ${missingFields.join(', ')}`
            );
        }

        // Validate version format if provided
        if (data.version && !semver.valid(data.version)) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Invalid version format. Must follow semantic versioning (e.g., 1.0.0)'
            );
        }

        return true;
    }

    /**
     * Get questions for test initialization
     */
    async getTestQuestions(version = '1.0.0') {
        try {
            logger.debug('Getting test questions from service', { version });
            const questions = await this.repository.getActiveQuestions(version);
            
            if (!questions || questions.length === 0) {
                logger.warn('No questions found for version', { version });
                return [];
            }
    
            return questions;
        } catch (error) {
            logger.error('Error in service getting questions:', {
                error: error.message,
                version
            });
            throw error;
        }
    }
    /**
     * Create a new question
     */
    async createQuestion(questionData) {
        try {
            this._validateQuestionData(questionData);
            return await this.repository.create(questionData);
        } catch (error) {
            logger.error('Error creating question:', {
                error: error.message,
                data: questionData
            });
            throw error;
        }
    }

     /**
     * Update an existing question
     */
     async updateQuestion(id, updateData) {
        try {
            logger.debug('Updating question:', { id, updateData });
    
            // Formattazione base dei dati senza validazione complessa
            const formattedData = {
                testo: updateData.testo,
                categoria: updateData.categoria,
                metadata: {
                    polarity: updateData.metadata?.polarity || '+'
                },
                weight: parseFloat(updateData.weight || 1),
                version: updateData.version || '1.0.0',
                active: updateData.active
            };
    
            const result = await this.repository.update(id, formattedData);
            return result;
        } catch (error) {
            logger.error('Error updating question:', { error: error.message, id });
            throw error;
        }
    }
    
    // Rimuoviamo i metodi di validazione complessi
    _validateUpdateData(data) {
        // Validazione minima solo per i campi essenziali
        if (!data.testo || !data.categoria) {
            throw new Error('Testo e categoria sono richiesti');
        }
        return true;
    }

    /**
     * Validate update data
     */
    _validateUpdateData(data) {
        logger.debug('Validating update data:', { data: JSON.stringify(data) });

        // Validazione campi obbligatori
        if (!data.testo || !data.categoria) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Missing required fields: text and category are required'
            );
        }

        // Validazione peso
        if (data.weight !== undefined) {
            const weight = parseFloat(data.weight);
            if (isNaN(weight) || weight < 0.1 || weight > 10) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Weight must be a number between 0.1 and 10'
                );
            }
        }

        // Validazione versione
        if (data.version && !semver.valid(data.version)) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Invalid version format. Must follow semantic versioning (e.g., 1.0.0)'
            );
        }

        // Validazione metadata
        if (data.metadata && !data.metadata.polarity) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Missing polarity in metadata'
            );
        }

        return true;
    }


    /**
     * Get all versions with their question counts
     */
    async getVersionsWithStats() {
        try {
            const versions = await this.repository.getVersions();
            
            const versionStats = await Promise.all(
                versions.map(async version => {
                    const questions = await this.repository.getQuestionsByVersion(version);
                    const activeCount = questions.filter(q => q.active).length;
                    
                    return {
                        version,
                        totalQuestions: questions.length,
                        activeQuestions: activeCount
                    };
                })
            );

            return versionStats;
        } catch (error) {
            logger.error('Error getting version stats:', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = CSIQuestionService;