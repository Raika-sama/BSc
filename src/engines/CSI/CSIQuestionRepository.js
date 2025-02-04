const CSIQuestion = require('./models/CSIQuestion');
const logger = require('../../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');

class CSIQuestionRepository {
    constructor(model = CSIQuestion) {
        if (!model) {
            throw new Error('Model is required');
        }
        this.model = model;
    }

    /**
     * Get all active questions for a specific version
     */
    async getActiveQuestions(version = '1.0.0') {
        try {
            const questions = await this.model
                .find({
                    version,
                    active: true
                })
                .select({
                    id: 1,
                    testo: 1,
                    categoria: 1,
                    metadata: 1,
                    weight: 1,
                    version: 1
                })
                .lean();
    
            return questions.map(q => ({
                ...q,
                tipo: 'CSI',
                metadata: {
                    ...q.metadata,
                    weight: q.metadata?.weight || 1
                }
            }));
        } catch (error) {
            logger.error('Error retrieving active questions:', {
                error: error.message,
                version
            });
            throw error;
        }
    }

    /**
     * Get a specific question by ID
     */
    async getById(id) {
        try {
            const question = await this.model.findOne({ id });
            if (!question) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    `Question with ID ${id} not found`
                );
            }
            return question;
        } catch (error) {
            logger.error('Error retrieving question:', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Create a new question
     */
    async create(questionData) {
        try {
            // Get the highest ID currently in use
            const maxId = await this.model
                .findOne({})
                .sort({ id: -1 })
                .select('id');

            // Increment the ID
            questionData.id = (maxId?.id || 0) + 1;

            const question = await this.model.create(questionData);
            logger.info('Created new question:', {
                id: question.id,
                version: question.version
            });

            return question;
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
    async update(id, updateData) {
        try {
            console.log('Repository received update data:', updateData);

            // Verifica se la domanda esiste
            const existingQuestion = await this.model.findOne({ id });
            if (!existingQuestion) {
                throw new Error(`Question with ID ${id} not found`);
            }

            // Usiamo $set per assicurarci che i campi non specificati non vengano rimossi
            const question = await this.model.findOneAndUpdate(
                { id },
                { $set: updateData },
                { 
                    new: true,
                    runValidators: true
                }
            );

            console.log('Updated question:', question);
            return question;
        } catch (error) {
            logger.error('Error updating question:', error);
            throw error;
        }
    }

    /**
     * Soft delete a question by setting active to false
     */
    async softDelete(id) {
        try {
            const question = await this.model.findOneAndUpdate(
                { id },
                { active: false },
                { new: true }
            );

            if (!question) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    `Question with ID ${id} not found`
                );
            }

            logger.info('Soft deleted question:', { id });
            return question;
        } catch (error) {
            logger.error('Error soft deleting question:', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Get all available versions
     */
    async getVersions() {
        try {
            const versions = await this.model
                .distinct('version')
                .sort();

            logger.debug('Retrieved versions:', { versions });
            return versions;
        } catch (error) {
            logger.error('Error retrieving versions:', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get questions by version
     */
    async getQuestionsByVersion(version) {
        try {
            const questions = await this.model
                .find({ version })
                .sort({ id: 1 });

            logger.debug('Retrieved questions by version:', {
                version,
                count: questions.length
            });

            return questions;
        } catch (error) {
            logger.error('Error retrieving questions by version:', {
                error: error.message,
                version
            });
            throw error;
        }
    }
}

module.exports = CSIQuestionRepository;
