// src/engines/CSI/repositories/CSIRepository.js

const CSIQuestion = require('../models/CSIQuestion');
const { Result, CSIResult } = require('../../../models/Result');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

class CSIRepository {
    constructor() {
        this.questionModel = CSIQuestion;
        this.resultModel = CSIResult;
    }

    /**
     * Salva un nuovo risultato CSI
     */
    async saveResults(resultData) {
        try {
            logger.debug('Saving CSI test results:', { 
                studentId: resultData.studentId,
                testId: resultData._id 
            });

            const result = await this.resultModel.create({
                ...resultData,
                tipo: 'CSI'
            });

            logger.debug('CSI results saved successfully:', {
                resultId: result._id
            });

            return result;
        } catch (error) {
            logger.error('Error saving CSI results:', {
                error: error.message,
                resultData
            });
            throw createError(
                ErrorTypes.DATABASE.SAVE_ERROR,
                'Errore nel salvataggio dei risultati CSI',
                { originalError: error.message }
            );
        }
    }

    /**
     * Trova un risultato per token
     */
    async findByToken(token) {
        try {
            logger.debug('Finding CSI result by token:', {
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            const result = await this.resultModel.findOne({
                token,
                used: false,
                expiresAt: { $gt: new Date() }
            });

            return result;
        } catch (error) {
            logger.error('Error finding CSI result by token:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_ERROR,
                'Errore nella ricerca del risultato CSI',
                { originalError: error.message }
            );
        }
    }

    /**
     * Trova un risultato per ID
     */
    async findById(id) {
        try {
            return await this.resultModel.findById(id);
        } catch (error) {
            logger.error('Error finding CSI result by id:', {
                error: error.message,
                id
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_ERROR,
                'Errore nella ricerca del risultato CSI',
                { originalError: error.message }
            );
        }
    }

    /**
     * Aggiorna un risultato esistente
     */
    async update(id, updateData) {
        try {
            logger.debug('Updating CSI result:', { id });

            const result = await this.resultModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (!result) {
                throw createError(
                    ErrorTypes.DATABASE.NOT_FOUND,
                    'Risultato CSI non trovato'
                );
            }

            return result;
        } catch (error) {
            logger.error('Error updating CSI result:', {
                error: error.message,
                id,
                updateData
            });
            throw error;
        }
    }

    /**
     * Trova risultati per studente
     */
    async findByStudent(studentId) {
        try {
            return await this.resultModel.find({
                studentId,
                tipo: 'CSI'
            }).sort({ dataCompletamento: -1 });
        } catch (error) {
            logger.error('Error finding CSI results for student:', {
                error: error.message,
                studentId
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_ERROR,
                'Errore nella ricerca dei risultati CSI dello studente',
                { originalError: error.message }
            );
        }
    }

    /**
     * Verifica disponibilità test per uno studente
     */
    async checkAvailability(studentId) {
        try {
            const lastTest = await this.resultModel.findOne({
                studentId,
                tipo: 'CSI',
                completato: true
            }).sort({ dataCompletamento: -1 });

            if (!lastTest) {
                return { available: true };
            }

            const cooldownPeriod = 30 * 24 * 60 * 60 * 1000; // 30 giorni
            const nextAvailableDate = new Date(lastTest.dataCompletamento.getTime() + cooldownPeriod);
            const now = new Date();

            return {
                available: now >= nextAvailableDate,
                nextAvailableDate,
                lastTestDate: lastTest.dataCompletamento
            };
        } catch (error) {
            logger.error('Error checking CSI test availability:', {
                error: error.message,
                studentId
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_ERROR,
                'Errore nella verifica disponibilità test CSI',
                { originalError: error.message }
            );
        }
    }
}

module.exports = CSIRepository;