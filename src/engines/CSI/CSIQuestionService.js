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
     * Ottiene le domande per il test
     */
    async getTestQuestions() {
        try {
            logger.debug('Getting test questions');
            
            const questions = await this.repository.getLatestActiveQuestions();
            
            if (!questions || questions.length === 0) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'No active questions found'
                );
            }

            return questions;
        } catch (error) {
            logger.error('Error in service getting questions:', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Aggiorna i metadati di una domanda
     */
    async updateQuestionMetadata(id, metadata) {
        try {
            const question = await this.repository.findById(id);
            if (!question) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Domanda non trovata'
                );
            }

            await question.updateMetadata(metadata);
            return question;
        } catch (error) {
            logger.error('Error updating question metadata:', { 
                error: error.message,
                id 
            });
            throw error;
        }
    }

    /**
     * Recupera tutti i tag utilizzati
     */
    async getAllTags() {
        try {
            const tags = await this.repository.model.distinct('metadata.tags');
            return tags;
        } catch (error) {
            logger.error('Error getting all tags:', { 
                error: error.message 
            });
            throw error;
        }
    }

    
    /**
     * Create a new question
     */
    async createQuestion(questionData) {
        try {
            // Validazione base
            if (!questionData.testo || !questionData.categoria) {
                throw new Error('Testo e categoria sono richiesti');
            }

            const formattedData = {
                ...questionData,
                metadata: {
                    polarity: questionData.metadata?.polarity || '+'
                },
                weight: parseFloat(questionData.weight || 1),
                version: questionData.version || '1.0.0',
                active: questionData.active ?? true
            };

            return await this.repository.create(formattedData);
        } catch (error) {
            logger.error('Error creating question:', { error: error.message });
            throw error;
        }
    }

     /**
     * Update an existing question
     */
     async updateQuestion(id, updateData) {
        try {
            console.log('Service received update data:', updateData);
    
            // Manteniamo la struttura dei dati come arriva dal frontend
            const formattedData = {
                testo: updateData.testo,
                categoria: updateData.categoria,
                metadata: {
                    polarity: updateData.metadata?.polarity,
                    weight: updateData.metadata?.weight // Manteniamo il weight dentro metadata
                },
                version: updateData.version,
                active: updateData.active
            };
    
            console.log('Formatted data for repository:', formattedData);
            const result = await this.repository.update(id, formattedData);
            return result;
        } catch (error) {
            logger.error('Error updating question:', error);
            throw error;
        }
    }

    async getVersionsWithStats() {
        try {
            const versions = await this.repository.getVersions();
            const versionStats = await Promise.all(
                versions.map(async version => {
                    const questions = await this.repository.getQuestionsByVersion(version);
                    return {
                        version,
                        totalQuestions: questions.length,
                        activeQuestions: questions.filter(q => q.active).length
                    };
                })
            );
            return versionStats;
        } catch (error) {
            logger.error('Error getting version stats:', { error: error.message });
            throw error;
        }
    }

}

module.exports = CSIQuestionService;