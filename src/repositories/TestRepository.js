// src/repositories/TestRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Test, Result } = require('../models');
const { AppError } = require('../utils/errors/AppError');

/**
 * Repository per la gestione delle operazioni specifiche dei test e risultati
 * Estende le funzionalità base del BaseRepository
 */
class TestRepository extends BaseRepository {
    constructor() {
        super(Test);
        this.Result = Result; // Modello per i risultati
    }

    /**
     * Crea un nuovo test
     * @param {Object} testData - Dati del test
     * @returns {Promise} Test creato
     */
    async createTest(testData) {
        try {
            // Validazione base delle domande
            if (!testData.domande || testData.domande.length === 0) {
                throw new AppError(
                    'Il test deve contenere almeno una domanda',
                    400,
                    'INVALID_TEST_DATA'
                );
            }

            // Validazione opzioni per ogni domanda
            testData.domande.forEach((domanda, index) => {
                if (!domanda.opzioni || domanda.opzioni.length < 2) {
                    throw new AppError(
                        `La domanda ${index + 1} deve avere almeno due opzioni`,
                        400,
                        'INVALID_QUESTION_OPTIONS'
                    );
                }

                if (domanda.rispostaCorretta && 
                    !domanda.opzioni.includes(domanda.rispostaCorretta)) {
                    throw new AppError(
                        `Risposta corretta non presente nelle opzioni - Domanda ${index + 1}`,
                        400,
                        'INVALID_CORRECT_ANSWER'
                    );
                }
            });

            return await this.create(testData);
        } catch (error) {
            throw new AppError(
                'Errore nella creazione del test',
                error.statusCode || 500,
                error.code || 'TEST_CREATION_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Salva il risultato di un test
     * @param {Object} resultData - Dati del risultato
     * @returns {Promise} Risultato salvato
     */
    async saveResult(resultData) {
        try {
            // Verifica esistenza del test
            const test = await this.findById(resultData.test);
            
            // Validazione risposte
            if (!resultData.risposte || 
                resultData.risposte.length !== test.domande.length) {
                throw new AppError(
                    'Numero di risposte non valido',
                    400,
                    'INVALID_ANSWERS_COUNT'
                );
            }

            const result = await this.Result.create(resultData);
            return result;
        } catch (error) {
            throw new AppError(
                'Errore nel salvataggio del risultato',
                error.statusCode || 500,
                error.code || 'RESULT_SAVE_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova risultati per utente
     * @param {String} userId - ID dell'utente
     * @returns {Promise} Array di risultati
     */
    async findResultsByUser(userId) {
        try {
            return await this.Result.find({ utente: userId })
                .populate('test', 'nome descrizione')
                .sort({ data: -1 });
        } catch (error) {
            throw new AppError(
                'Errore nel recupero dei risultati utente',
                500,
                'USER_RESULTS_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova risultati per test
     * @param {String} testId - ID del test
     * @param {Object} options - Opzioni di ricerca
     * @returns {Promise} Array di risultati
     */
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
            throw new AppError(
                'Errore nel recupero dei risultati del test',
                500,
                'TEST_RESULTS_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Calcola statistiche per un test
     * @param {String} testId - ID del test
     * @returns {Promise} Statistiche del test
     */
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
            throw new AppError(
                'Errore nel calcolo delle statistiche',
                500,
                'STATS_CALCULATION_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Ottiene l'ultimo risultato di un utente per un test
     * @param {String} userId - ID dell'utente
     * @param {String} testId - ID del test
     * @returns {Promise} Ultimo risultato
     */
    async getLastResult(userId, testId) {
        try {
            return await this.Result.findOne({
                utente: userId,
                test: testId
            })
            .sort({ data: -1 })
            .populate('test', 'nome descrizione');
        } catch (error) {
            throw new AppError(
                'Errore nel recupero dell\'ultimo risultato',
                500,
                'LAST_RESULT_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Verifica se un utente può ripetere un test
     * @param {String} userId - ID dell'utente
     * @param {String} testId - ID del test
     * @param {Number} cooldownHours - Ore di attesa tra tentativi
     * @returns {Promise<boolean>} True se il test può essere ripetuto
     */
    async canRetakeTest(userId, testId, cooldownHours = 24) {
        try {
            const lastResult = await this.getLastResult(userId, testId);
            
            if (!lastResult) return true;

            const hoursSinceLastAttempt = 
                (Date.now() - lastResult.data.getTime()) / (1000 * 60 * 60);

            return hoursSinceLastAttempt >= cooldownHours;
        } catch (error) {
            throw new AppError(
                'Errore nella verifica ripetibilità test',
                500,
                'RETAKE_CHECK_ERROR',
                { error: error.message }
            );
        }
    }
}

module.exports = TestRepository;