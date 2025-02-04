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
     * Get questions for test initialization
     */
    async getTestQuestions(version = '1.0.0') {
        try {
            console.log('Getting questions for version:', version);
            const questions = await this.repository.getActiveQuestions(version);
            console.log('Questions from repository:', questions);
            
            const formattedQuestions = questions.map(q => ({
                ...q,
                metadata: {
                    ...q.metadata,
                    weight: q.metadata?.weight ?? 1
                }
            }));
            console.log('Formatted questions:', formattedQuestions);

            return formattedQuestions;
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