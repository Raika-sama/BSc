const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

class CSIEngine {
    constructor({ Test, Result, scorer, config, repository, questionService, validator }) {
        if (!Test || !Result || !scorer || !config || !repository || !questionService) {
            throw new Error('Required dependencies missing in CSIEngine');
        }

        this.testRepo = Test;
        this.resultRepo = Result;
        this.scorer = scorer;
        this.config = config;
        this.repository = repository;
        this.questionService = questionService;
        this.validator = validator;
    }
/*
    async verifyToken(token) {
        try {
            logger.debug('Verifying CSI token:', { token: token.substring(0, 10) + '...' });

            // Verifica il token usando il repository
            const result = await this.repository.verifyToken(token);
            
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o scaduto'
                );
            }

            return result;
        } catch (error) {
            logger.error('Error verifying token:', { error: error.message });
            throw error;
        }
    }

    async startTest(token) {
        try {
            // Verifica e marca il token come utilizzato
            const result = await this.repository.markTokenAsUsed(token);
            
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o già utilizzato'
                );
            }

            return result;
        } catch (error) {
            logger.error('Error starting test:', { error: error.message });
            throw error;
        }
    }

    async processAnswer(token, answerData) {
        try {
            const { questionId, value, timeSpent } = answerData;
            
            // Validazione risposta
            if (!this.validator.validateAnswer(value, timeSpent)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Risposta non valida'
                );
            }

            // Aggiorna il risultato
            const result = await this.repository.update(token, {
                $push: {
                    risposte: {
                        questionId,
                        value,
                        timeSpent,
                        timestamp: new Date()
                    }
                }
            });

            return result;
        } catch (error) {
            logger.error('Error processing answer:', { error: error.message });
            throw error;
        }
    }

    async completeTest(token) {
        try {
            const result = await this.repository.findByToken(token);
            
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido'
                );
            }

            // Calcola i punteggi
            const scores = await this.scorer.calculateTestResult(result.risposte);
            
            // Aggiorna e completa il test
            const completedResult = await this.repository.update(token, {
                completato: true,
                dataCompletamento: new Date(),
                ...scores
            });

            return completedResult;
        } catch (error) {
            logger.error('Error completing test:', { error: error.message });
            throw error;
        }
    }*/
}

module.exports = CSIEngine;