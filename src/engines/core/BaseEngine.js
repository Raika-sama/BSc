// src/engines/core/BaseEngine.js

const { Test, Result } = require('../../models/Test');
const logger = require('../../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../../utils/errors/errorTypes');

class BaseEngine {
    constructor() {
        if (this.constructor === BaseEngine) {
            throw new Error('BaseEngine is abstract and cannot be instantiated directly');
        }
        
        this.testModel = Test;
        this.resultModel = Result;
    }

    /**
     * Inizializza un nuovo test per uno studente
     * @param {Object} params - Parametri di inizializzazione
     * @param {string} params.studentId - ID dello studente
     * @param {string} params.classId - ID della classe
     * @param {Object} params.config - Configurazione specifica del test
     */
    async initializeTest(params) {
        try {
            // Validazione base
            if (!params.studentId) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Student ID is required'
                );
            }

            // Verifica cooldown period
            const canTakeTest = await this.verifyTestAvailability(params.studentId);
            if (!canTakeTest.available) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    canTakeTest.message
                );
            }

            // Creazione test specifico - deve essere implementato dalle sottoclassi
            const test = await this.createTest(params);
            
            logger.info('Test initialized', {
                testId: test._id,
                studentId: params.studentId,
                type: test.tipo
            });

            return test;
        } catch (error) {
            logger.error('Error initializing test', { error, params });
            throw error;
        }
    }

    /**
     * Processa una risposta durante il test
     * @param {string} testId - ID del test
     * @param {Object} answer - Risposta dello studente
     */
    async processAnswer(testId, answer) {
        throw new Error('processAnswer must be implemented by subclass');
    }

    /**
     * Completa il test e calcola i risultati
     * @param {string} testId - ID del test
     */
    async completeTest(testId) {
        throw new Error('completeTest must be implemented by subclass');
    }

    /**
     * Calcola i punteggi del test
     * @param {Array} answers - Array di risposte
     */
    async calculateScores(answers) {
        throw new Error('calculateScores must be implemented by subclass');
    }

    /**
     * Genera il report dei risultati
     * @param {string} testId - ID del test
     */
    async generateReport(testId) {
        throw new Error('generateReport must be implemented by subclass');
    }

    /**
     * Verifica se uno studente può fare il test (cooldown, tentativi massimi, etc.)
     * @param {string} studentId - ID dello studente
     */
    async verifyTestAvailability(studentId) {
        try {
            const lastResult = await this.resultModel
                .findOne({ 
                    utente: studentId,
                    completato: true 
                })
                .sort({ dataCompletamento: -1 });

            if (!lastResult) {
                return { available: true };
            }

            // Verifica cooldown period
            const test = await this.testModel.findById(lastResult.test);
            const cooldownHours = test.configurazione.cooldownPeriod || 24;
            
            const hoursSinceLastTest = 
                (Date.now() - lastResult.dataCompletamento.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastTest < cooldownHours) {
                return {
                    available: false,
                    message: `Devi aspettare ${Math.ceil(cooldownHours - hoursSinceLastTest)} ore prima di rifare il test`
                };
            }

            // Verifica numero massimo tentativi
            const attemptCount = await this.resultModel.countDocuments({
                utente: studentId,
                test: lastResult.test,
                completato: true
            });

            if (test.configurazione.tentativiMax && 
                attemptCount >= test.configurazione.tentativiMax) {
                return {
                    available: false,
                    message: 'Hai raggiunto il numero massimo di tentativi per questo test'
                };
            }

            return { available: true };
        } catch (error) {
            logger.error('Error checking test availability', { error, studentId });
            throw error;
        }
    }

    /**
     * Genera analytics sul test
     * @param {string} testId - ID del test
     */
    async generateAnalytics(testId) {
        try {
            const results = await this.resultModel
                .find({ 
                    test: testId,
                    completato: true 
                })
                .populate('utente', 'firstName lastName email')
                .sort({ dataCompletamento: -1 });

            if (results.length === 0) {
                return {
                    totalAttempts: 0,
                    averageCompletionTime: 0,
                    questionStats: []
                };
            }

            // Calcolo statistiche base
            const completionTimes = results.map(r => r.analytics.tempoTotale);
            const avgTime = completionTimes.reduce((a, b) => a + b, 0) / results.length;

            // Statistiche per domanda - da implementare nelle sottoclassi
            const questionStats = await this.calculateQuestionStats(results);

            return {
                totalAttempts: results.length,
                averageCompletionTime: avgTime,
                questionStats,
                lastAttempt: results[0].dataCompletamento
            };
        } catch (error) {
            logger.error('Error generating analytics', { error, testId });
            throw error;
        }
    }

    /**
     * Calcola statistiche per ogni domanda
     * @param {Array} results - Array di risultati
     */
    async calculateQuestionStats(results) {
        throw new Error('calculateQuestionStats must be implemented by subclass');
    }
}

module.exports = BaseEngine;