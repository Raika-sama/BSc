// src/components/engines/CSI/controllers/CSIQuestionController.js

const CSIQuestionService = require('./CSIQuestionService');
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');

class CSIQuestionController {
    constructor(service = CSIQuestionService) {
        if (!service) {
            throw new Error('CSIQuestionService is required');
        }
        this.service = service;
    }

/**
     * Aggiorna i metadati di una domanda
     */
updateMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const { metadata } = req.body;

        const question = await this.service.updateQuestionMetadata(id, metadata);

        res.json({
            status: 'success',
            data: question
        });
    } catch (error) {
        logger.error('Error updating question metadata:', { 
            error: error.message,
            questionId: req.params.id 
        });

        res.status(error.statusCode || 400).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'UPDATE_METADATA_ERROR'
            }
        });
    }
};

/**
 * Recupera tutti i tag disponibili
 */
getAvailableTags = async (req, res) => {
    try {
        const tags = await this.service.getAllTags();

        res.json({
            status: 'success',
            data: { tags }
        });
    } catch (error) {
        logger.error('Error getting available tags:', { 
            error: error.message 
        });

        res.status(error.statusCode || 500).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'GET_TAGS_ERROR'
            }
        });
    }
};

    /**
     * Ottiene tutte le domande attive
     */
    getActiveQuestions = async (req, res) => {
        try {
            logger.debug('Controller: Getting active questions');
            const questions = await this.service.getTestQuestions();

            logger.debug('Retrieved questions:', {
                count: questions.length
            });

            res.json({
                status: 'success',
                data: questions
            });
        } catch (error) {
            logger.error('Error getting active questions:', {
                error: error.message
            });

            res.status(error.statusCode || 500).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'FETCH_QUESTIONS_ERROR'
                }
            });
        }
    };


    /**
     * Crea una nuova domanda
     */
    createQuestion = async (req, res) => {
        try {
            const question = await this.service.createQuestion(req.body);

            res.status(201).json({
                status: 'success',
                data: question
            });
        } catch (error) {
            logger.error('Error creating question:', {
                error: error.message,
                data: req.body
            });

            res.status(error.statusCode || 400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'CREATE_QUESTION_ERROR'
                }
            });
        }
    };

    /**
     * Aggiorna una domanda esistente
     */
    updateQuestion = async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Update request received:', { id, body: req.body }); // Log dei dati ricevuti

            const question = await this.service.updateQuestion(parseInt(id), req.body);

            res.json({
                status: 'success',
                data: question
            });
        } catch (error) {
            logger.error('Error updating question:', { error: error.message });
            res.status(400).json({
                status: 'error',
                error: { message: error.message }
            });
        }
    };

    /**
     * Disattiva una domanda (soft delete)
     */
    deleteQuestion = async (req, res) => {
        try {
            const { id } = req.params;
            await this.service.softDelete(parseInt(id));

            res.json({
                status: 'success',
                message: 'Domanda disattivata con successo'
            });
        } catch (error) {
            logger.error('Error deleting question:', {
                error: error.message,
                id: req.params.id
            });

            res.status(error.statusCode || 400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'DELETE_QUESTION_ERROR'
                }
            });
        }
    };

    /**
     * Ottiene le statistiche delle versioni
     */
    getVersionStats = async (req, res) => {
        try {
            const stats = await this.service.getVersionsWithStats();

            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            logger.error('Error getting version stats:', {
                error: error.message
            });

            res.status(error.statusCode || 500).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'VERSION_STATS_ERROR'
                }
            });
        }
    };
}

module.exports = CSIQuestionController;