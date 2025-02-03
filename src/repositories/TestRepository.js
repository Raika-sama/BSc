// src/repositories/TestRepository.js

const BaseRepository = require('./base/BaseRepository');
const Test = require('../models/Test');
const Result = require('../models/Result');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class TestRepository extends BaseRepository {
    constructor() {
        super(Test);
        this.Result = Result;
    }

     /**
     * Trova un test tramite token
     */
     async findByToken(token) {
        try {
            return await this.model.findOne({
                token,
                expiresAt: { $gt: new Date() }
            }).populate('studentId');
        } catch (error) {
            logger.error('Error finding test by token:', {
                error,
                token: token.substring(0, 10) + '...' // log parziale per sicurezza
            });
            throw error;
        }
    }

    /**
     * Verifica se un token è valido e utilizzabile
     */
    async isTokenValid(token) {
        try {
            const test = await this.findByToken(token);
            return {
                isValid: !!test && !test.used,
                test
            };
        } catch (error) {
            logger.error('Error checking token validity:', { error });
            return { isValid: false, test: null };
        }
    }

    /**
     * Marca un token come utilizzato
     */
    async markTokenAsUsed(token) {
        try {
            const result = await this.model.updateOne(
                { token },
                { 
                    $set: { 
                        used: true,
                        lastUsed: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error('Error marking token as used:', { error });
            throw error;
        }
    }

    /**
     * Salva un nuovo token di test
     * @param {Object} tokenData - Dati del token
     * @returns {Promise<Object>} Test creato
     */
    async saveTestToken(tokenData) {
        logger.info('Starting test token creation:', {
            studentId: tokenData.studentId,
            testType: tokenData.testType,
            timestamp: new Date().toISOString()
        });

        try {
            const test = await this.model.create({
                ...tokenData,
                used: false,
                created: new Date(),
                configurazione: {
                    tempoLimite: 30,
                    tentativiMax: 1,
                    cooldownPeriod: 168,
                    randomizzaDomande: true,
                    mostraRisultatiImmediati: false
                }
            });

            logger.info('Test configuration created:', {
                testId: test._id,
                config: test.configurazione,
                created: test.created
            });

            return test;
        } catch (error) {
            logger.error('Test token creation failed:', {
                error: error.message,
                stack: error.stack,
                tokenData,
                timestamp: new Date().toISOString()
            });
            throw createError(
                ErrorTypes.DATABASE.SAVE_ERROR,
                'Errore nel salvare il token del test',
                { originalError: error.message }
            );
        }
    }

    /**
     * Verifica validità di un token
     * @param {string} token - Token da verificare
     * @returns {Promise<Object>} Test associato al token
     */
    async verifyToken(token) {
        logger.info('Starting token verification:', { 
            token,
            timestamp: new Date().toISOString()
        });
    
        try {
            // Prima cerca il test senza condizioni per vedere se esiste
            const testExists = await this.model.findOne({ token });
            logger.debug('Raw test search result:', {
                exists: !!testExists,
                test: testExists ? {
                    id: testExists._id,
                    expiresAt: testExists.expiresAt,
                    used: testExists.used
                } : null
            });
    
            // Poi cerca con tutte le condizioni
            const test = await this.model.findOne({
                token,
                expiresAt: { $gt: new Date() },
                used: false
            }).populate('studentId');
    
            logger.info('Token verification result:', {
                found: !!test,
                expired: testExists ? new Date() > testExists.expiresAt : null,
                used: testExists ? testExists.used : null
            });
    
            if (!test) {
                logger.warn('Invalid or expired token:', { 
                    token,
                    testExists: !!testExists,
                    reason: testExists ? 
                        (testExists.used ? 'Token already used' : 
                         new Date() > testExists.expiresAt ? 'Token expired' : 
                         'Unknown') : 
                        'Token not found'
                });
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o scaduto'
                );
            }
    
            return test;
        } catch (error) {
            logger.error('Token verification failed:', {
                error: error.message,
                stack: error.stack,
                token,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
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