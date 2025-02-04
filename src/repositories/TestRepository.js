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

    /**
     * Marca un token come utilizzato
     * @param {string} token - Token da marcare
     * @returns {Promise<boolean>} Successo operazione
     */
    async markTokenAsUsed(token) {
        try {
            logger.debug('Marking token as used:', {
                token: token.substring(0, 10) + '...'
            });

            const result = await this.Result.updateOne(
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
            logger.error('Error marking token as used:', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Salva un nuovo token di test
     * @param {Object} tokenData - Dati del token
     * @returns {Promise<Object>} Test creato
     */
    async saveTestToken(tokenData) {
        try {
            logger.debug('Saving new test token:', {
                studentId: tokenData.studentId,
                testType: tokenData.testType
            });

            // Verifica preliminare
            if (!tokenData.studentId || !tokenData.testType) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'StudentId e testType sono richiesti'
                );
            }

            const result = await this.Result.create({
                ...tokenData,
                token: this._generateToken(),
                used: false,
                created: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ore
            });

            logger.info('Test token created successfully:', {
                resultId: result._id,
                token: result.token.substring(0, 10) + '...'
            });

            return result;
        } catch (error) {
            logger.error('Error saving test token:', {
                error: error.message,
                tokenData
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
            const lastResult = await this.Result
                .findOne({
                    studentId,
                    'test.tipo': testType,
                    completato: true
                })
                .sort({ dataCompletamento: -1 });

            if (!lastResult) {
                return { available: true };
            }

            const hoursSinceLastTest = 
                (Date.now() - lastResult.dataCompletamento.getTime()) / 
                (1000 * 60 * 60);

            return {
                available: hoursSinceLastTest >= 24,
                nextAvailableDate: lastResult.dataCompletamento.getTime() + (24 * 60 * 60 * 1000)
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
    _generateToken() {
        return require('crypto').randomBytes(32).toString('hex');
    }
}

module.exports = TestRepository;