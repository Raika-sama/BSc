const CSIQuestionRepository = require('./CSIQuestionRepository');
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const semver = require('semver');

class CSIQuestionService {
    constructor(repository) {
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
            const questions = await this.repository.getActiveQuestions(version);
            
            if (!questions || questions.length === 0) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    `No active questions found for version ${version}`
                );
            }

            return questions;
        } catch (error) {
            logger.error('Error getting test questions:', {
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
            if (updateData.version && !semver.valid(updateData.version)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Invalid version format'
                );
            }

            return await this.repository.update(id, updateData);
        } catch (error) {
            logger.error('Error updating question:', {
                error: error.message,
                id,
                updateData
            });
            throw error;
        }
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

module.exports = new CSIQuestionService(CSIQuestionRepository);