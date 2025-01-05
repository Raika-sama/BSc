// src/repositories/TestRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Test, Result } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class TestRepository extends BaseRepository {
    constructor() {
        super(Test);
        this.Result = Result;
    }

    async createTest(testData) {
        try {
            if (!testData.domande || testData.domande.length === 0) {
                logger.warn('Tentativo di creazione test senza domande', { testData });
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Il test deve contenere almeno una domanda'
                );
            }

            // Validazione opzioni per ogni domanda
            testData.domande.forEach((domanda, index) => {
                if (!domanda.opzioni || domanda.opzioni.length < 2) {
                    throw createError(
                        ErrorTypes.VALIDATION.INVALID_INPUT,
                        `La domanda ${index + 1} deve avere almeno due opzioni`
                    );
                }

                if (domanda.rispostaCorretta && 
                    !domanda.opzioni.includes(domanda.rispostaCorretta)) {
                    throw createError(
                        ErrorTypes.VALIDATION.INVALID_INPUT,
                        `Risposta corretta non presente nelle opzioni - Domanda ${index + 1}`
                    );
                }
            });

            return await this.create(testData);
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella creazione del test', { error, testData });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella creazione del test',
                { originalError: error.message }
            );
        }
    }

    async saveResult(resultData) {
        try {
            const test = await this.findById(resultData.test);
            
            if (!resultData.risposte || 
                resultData.risposte.length !== test.domande.length) {
                logger.warn('Tentativo di salvare risultato con numero risposte non valido', { 
                    expected: test.domande.length, 
                    received: resultData.risposte?.length 
                });
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Numero di risposte non valido'
                );
            }

            const result = await this.Result.create(resultData);
            return result;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nel salvataggio del risultato', { error, resultData });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel salvataggio del risultato',
                { originalError: error.message }
            );
        }
    }

    async findResultsByUser(userId) {
        try {
            return await this.Result.find({ utente: userId })
                .populate('test', 'nome descrizione')
                .sort({ data: -1 });
        } catch (error) {
            logger.error('Errore nel recupero dei risultati utente', { error, userId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dei risultati utente',
                { originalError: error.message }
            );
        }
    }

    async findResultsByTest(testId, options = {}) {
        try {
            let query = this.Result.find({ test: testId });

            if (options.populate) {
                query = query.populate('utente', 'firstName lastName email');
            }

            if (options.sort) {
                query = query.sort(options.sort);
            } else {
                query = query.sort({ data: -1 });
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            return await query.exec();
        } catch (error) {
            logger.error('Errore nel recupero dei risultati del test', { error, testId, options });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dei risultati del test',
                { originalError: error.message }
            );
        }
    }

    async getTestStats(testId) {
        try {
            const results = await this.Result.find({ test: testId });
            
            if (results.length === 0) {
                return {
                    totalAttempts: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    medianScore: 0
                };
            }

            const scores = results.map(r => r.punteggio);
            scores.sort((a, b) => a - b);

            return {
                totalAttempts: results.length,
                averageScore: scores.reduce((a, b) => a + b) / scores.length,
                highestScore: Math.max(...scores),
                lowestScore: Math.min(...scores),
                medianScore: scores[Math.floor(scores.length / 2)]
            };
        } catch (error) {
            logger.error('Errore nel calcolo delle statistiche', { error, testId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel calcolo delle statistiche',
                { originalError: error.message }
            );
        }
    }

    async getLastResult(userId, testId) {
        try {
            return await this.Result.findOne({
                utente: userId,
                test: testId
            })
            .sort({ data: -1 })
            .populate('test', 'nome descrizione');
        } catch (error) {
            logger.error('Errore nel recupero dell\'ultimo risultato', { error, userId, testId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dell\'ultimo risultato',
                { originalError: error.message }
            );
        }
    }

    async canRetakeTest(userId, testId, cooldownHours = 24) {
        try {
            const lastResult = await this.getLastResult(userId, testId);
            
            if (!lastResult) return true;

            const hoursSinceLastAttempt = 
                (Date.now() - lastResult.data.getTime()) / (1000 * 60 * 60);

            return hoursSinceLastAttempt >= cooldownHours;
        } catch (error) {
            logger.error('Errore nella verifica ripetibilità test', { error, userId, testId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella verifica ripetibilità test',
                { originalError: error.message }
            );
        }
    }
}

module.exports = TestRepository;