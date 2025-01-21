// src/engines/core/BaseEngine.js

const logger = require('../../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../../utils/errors/errorTypes');

class BaseEngine {
    constructor(Test, Result) {
        // Verifica che la classe non venga istanziata direttamente
        if (this.constructor === BaseEngine) {
            throw new Error('BaseEngine is abstract and cannot be instantiated directly');
        }
        
        if (!Test || !Result) {
            throw new Error('Test and Result models are required');
        }
        
        this.Test = Test;
        this.Result = Result;
        this.testType = null; // Deve essere settato dalle sottoclassi
    }

    /**
     * Verifica la validità di un token test
     */
    async verifyToken(token) {
        try {
            if (!token) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token is required'
                );
            }

            logger.debug('Verifying token in BaseEngine:', { token });

            const result = await this.Result.findOne({
                token,
                expiresAt: { $gt: new Date() },
                used: false
            })
            .populate('studentId')
            .populate('test');  // Aggiunto populate del test

            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o scaduto'
                );
            }

            logger.debug('Token verification result:', {
                resultId: result._id,
                testId: result.test?._id,
                testType: result.test?.tipo,
                studentId: result.studentId?._id
            });

            return result;
        } catch (error) {
            logger.error('Error verifying token in BaseEngine:', {
                error: error.message,
                stack: error.stack,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw error;
        }
    }

    /**
     * Marca un token come utilizzato
     */
    async markTokenAsUsed(token) {
        try {
            const result = await this.Result.findOneAndUpdate(
                { token },
                { 
                    used: true,
                    lastUsed: new Date()
                },
                { new: true }
            );

            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non trovato'
                );
            }

            return result;
        } catch (error) {
            logger.error('Error marking token as used:', {
                error: error.message,
                token
            });
            throw error;
        }
    }

    /**
     * Inizializza un nuovo test
     */
    async initializeTest(params) {
        throw new Error('initializeTest must be implemented by subclass');
    }

    /**
     * Processa una risposta durante il test
     */
    async processAnswer(testId, answer) {
        throw new Error('processAnswer must be implemented by subclass');
    }

    /**
     * Completa il test e calcola i risultati
     */
    async completeTest(testId, token) {
        throw new Error('completeTest must be implemented by subclass');
    }

    /**
     * Verifica se uno studente può fare il test
     */
    async verifyTestAvailability(studentId) {
        try {
            const lastResult = await this.Result
                .findOne({ 
                    studentId,
                    completato: true 
                })
                .sort({ dataCompletamento: -1 });

            if (!lastResult) {
                return { available: true };
            }

            // Verifica cooldown period
            const test = await this.Test.findById(lastResult.test);
            const cooldownHours = test?.configurazione?.cooldownPeriod || 24;
            
            const hoursSinceLastTest = 
                (Date.now() - lastResult.dataCompletamento.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastTest < cooldownHours) {
                return {
                    available: false,
                    message: `Devi aspettare ${Math.ceil(cooldownHours - hoursSinceLastTest)} ore prima di rifare il test`
                };
            }

            return { available: true };
        } catch (error) {
            logger.error('Error checking test availability:', {
                error: error.message,
                studentId
            });
            throw error;
        }
    }

    /**
     * Genera il report dei risultati
     */
    async generateReport(testId) {
        throw new Error('generateReport must be implemented by subclass');
    }
}

module.exports = BaseEngine;