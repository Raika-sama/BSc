// src/repositories/TestRepository.js
const crypto = require('crypto'); // Aggiungi questo import
const BaseRepository = require('./base/BaseRepository');
const Test = require('../models/Test');
const { Result, CSIResult } = require('../models'); // Aggiorna l'import
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class TestRepository extends BaseRepository {
    constructor() {
        super(Test);
        this.Result = Result;
        this.CSIResult = CSIResult;
    }

    /**
     * Trova un test tramite token
     * @param {string} token - Token del test
     * @returns {Promise<Object>} Test trovato
     */
    async findByToken(token) {
        try {
            logger.debug('Finding test by token:', {
                token: token.substring(0, 10) + '...'
            });

            const result = await this.Result.findOne({
                token,
                expiresAt: { $gt: new Date() }
            }).populate('studentId');

            return result;
        } catch (error) {
            logger.error('Error finding test by token:', {
                error: error.message,
                token: token.substring(0, 10) + '...'
            });
            throw error;
        }
    }

    /**
     * Verifica se un token è valido e utilizzabile
     * @param {string} token - Token da verificare
     * @returns {Promise<Object>} Stato validità token
     */
    async isTokenValid(token) {
        try {
            logger.debug('Checking token validity');
            
            const test = await this.findByToken(token);
            return {
                isValid: !!test && !test.used,
                test
            };
        } catch (error) {
            logger.error('Error checking token validity:', {
                error: error.message
            });
            return { isValid: false, test: null };
        }
    }

    async verifyToken(token) {
        try {
            // Cerca in entrambi i modelli
            let result = await this.CSIResult.findOne({
                token,
                used: false,
                expiresAt: { $gt: new Date() }
            });

            if (!result) {
                result = await this.Result.findOne({
                    token,
                    used: false,
                    expiresAt: { $gt: new Date() }
                });
            }

            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o scaduto'
                );
            }

            return result;
        } catch (error) {
            logger.error('Error verifying token:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw error;
        }
    }
    
    /**
     * Marca un token come utilizzato
     * @param {string} token - Token da marcare
     * @returns {Promise<boolean>} Successo operazione
     */
    async markTokenAsUsed(token) {
        try {
            // Cerca e aggiorna in entrambi i modelli
            let result = await this.CSIResult.findOneAndUpdate(
                { token },
                { used: true },
                { new: true }
            );

            if (!result) {
                result = await this.Result.findOneAndUpdate(
                    { token },
                    { used: true },
                    { new: true }
                );
            }

            return result;
        } catch (error) {
            logger.error('Error marking token as used:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw error;
        }
    }


    /**
     * Salva un nuovo token di test
     * @param {Object} tokenData - Dati del token
     * @returns {Promise<Object>} Test creato
     */
    async saveTestToken(data) {
        try {
            const token = this.generateToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore
    
            const result = await this.Result.create({
                studentId: data.studentId,
                tipo: data.testType,
                token,
                expiresAt,
                used: false,
                config: data.config, // Salviamo la configurazione
                status: 'initialized'
            });
    
            return {
                token,
                expiresAt,
                _id: result._id
            };
        } catch (error) {
            logger.error('Error saving test token:', {
                error: error.message,
                data
            });
            throw error;
        }
    }


    /**
     * Recupera risultati base di un test
     * @param {string} testId - ID del test
     * @returns {Promise<Array>} Array di risultati
     */
    async getBaseResults(testId) {
        try {
            return await this.Result.find({ 
                test: testId,
                completato: true 
            })
            .select('studentId dataCompletamento')
            .populate('studentId', 'firstName lastName');
        } catch (error) {
            logger.error('Error getting base results:', {
                error: error.message,
                testId
            });
            throw error;
        }
    }

    /**
     * Verifica se uno studente può sostenere un test
     * @param {string} studentId - ID dello studente
     * @param {string} testType - Tipo di test
     * @returns {Promise<Object>} Stato disponibilità test
     */
    async checkTestAvailability(studentId, testType) {
        try {
            // Usa il modello corretto in base al tipo di test
            const ResultModel = testType === 'CSI' ? this.CSIResult : this.Result;
            
            const lastTest = await ResultModel.findOne({
                studentId,
                tipo: testType,
                completato: true
            }).sort({ dataCompletamento: -1 });

            if (!lastTest) {
                return { available: true };
            }

            // Calcola quando sarà disponibile il prossimo test
            const cooldownPeriod = 30 * 24 * 60 * 60 * 1000; // 30 giorni in millisecondi
            const nextAvailableDate = new Date(lastTest.dataCompletamento.getTime() + cooldownPeriod);
            const now = new Date();

            return {
                available: now >= nextAvailableDate,
                nextAvailableDate: nextAvailableDate,
                lastTestDate: lastTest.dataCompletamento
            };
        } catch (error) {
            logger.error('Error checking test availability:', {
                error: error.message,
                studentId,
                testType
            });
            throw error;
        }
    }


    /**
     * Genera un token univoco
     * @private
     */
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = TestRepository;