// src/engines/CSI/repositories/CSIRepository.js

const CSIQuestion = require('./models/CSIQuestion');
const Result = require('../../models/Result');
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');

class CSIRepository {
    constructor() {
        this.questionModel = CSIQuestion;
        this.resultModel = Result;
    }

    // Il resto dei metodi rimane uguale ma aggiungiamo log più dettagliati
    async getQuestions(version = '1.0.0') {
        try {
            logger.debug('CSIRepository: Fetching questions', { version });
            // ... resto del codice ...
        } catch (error) {
            logger.error('CSIRepository: Error fetching questions', {
                error: error.message,
                version
            });
            throw error;
        }
    }
    /**
     * Recupera le domande attive per una specifica versione
     * @param {string} version - Versione delle domande da recuperare
     * @returns {Promise<Array>} Array di domande
     */
    async getQuestions(version = '1.0.0') {
        try {
            logger.debug('Fetching CSI questions:', { version });

            const questions = await this.questionModel
                .find({
                    version,
                    active: true
                })
                .select({
                    id: 1,
                    testo: 1,
                    categoria: 1,
                    tipo: 1,
                    metadata: 1,
                    weight: 1,
                    version: 1
                })
                .sort({ id: 1 })
                .lean();

            logger.debug('Retrieved questions:', { 
                count: questions.length,
                version 
            });

            return questions;
        } catch (error) {
            logger.error('Error fetching CSI questions:', {
                error: error.message,
                version
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero delle domande CSI',
                { originalError: error.message }
            );
        }
    }

    /**
     * Salva i risultati di un test CSI
     * @param {Object} resultData - Dati del risultato da salvare
     * @returns {Promise<Object>} Risultato salvato
     */
    async saveResults(resultData) {
        try {
            logger.debug('Saving CSI test results:', { 
                studentId: resultData.studentId,
                testId: resultData.testId 
            });

            const result = await this.resultModel.create({
                ...resultData,
                tipo: 'CSI',
                dataCompletamento: new Date()
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
     * Recupera la configurazione del test CSI
     * @returns {Promise<Object>} Configurazione del test
     */
    async getTestConfiguration() {
        return {
            timeLimit: 30, // minuti
            questionLimit: 30,
            minQuestions: 25,
            scoreRange: {
                min: 0,
                max: 100
            },
            categories: [
                'Elaborazione',
                'Creatività',
                'Preferenza Visiva',
                'Decisione',
                'Autonomia'
            ],
            version: '1.0.0'
        };
    }

    /**
     * Calcola i punteggi CSI per le risposte date
     * @param {Array} answers - Array di risposte
     * @returns {Promise<Object>} Punteggi calcolati
     */
    async calculateScores(answers) {
        try {
            logger.debug('Calculating CSI scores:', { 
                answersCount: answers.length 
            });

            // Implementazione del calcolo punteggi
            // Nota: questa è una versione semplificata, il calcolo reale
            // dovrebbe essere implementato secondo le specifiche del test CSI
            const scores = {
                elaborazione: this._calculateCategoryScore(answers, 'Elaborazione'),
                creativita: this._calculateCategoryScore(answers, 'Creatività'),
                preferenzaVisiva: this._calculateCategoryScore(answers, 'Preferenza Visiva'),
                decisione: this._calculateCategoryScore(answers, 'Decisione'),
                autonomia: this._calculateCategoryScore(answers, 'Autonomia')
            };

            logger.debug('Scores calculated successfully:', { scores });

            return scores;
        } catch (error) {
            logger.error('Error calculating CSI scores:', {
                error: error.message,
                answersCount: answers.length
            });
            throw createError(
                ErrorTypes.PROCESSING.CALCULATION_ERROR,
                'Errore nel calcolo dei punteggi CSI',
                { originalError: error.message }
            );
        }
    }

    /**
     * Calcola il punteggio per una specifica categoria
     * @private
     */
    _calculateCategoryScore(answers, category) {
        const categoryAnswers = answers.filter(a => a.question.categoria === category);
        if (categoryAnswers.length === 0) return 0;

        const totalScore = categoryAnswers.reduce((sum, answer) => {
            const value = answer.value;
            const weight = answer.question.metadata?.weight || 1;
            return sum + (value * weight);
        }, 0);

        return (totalScore / categoryAnswers.length) * 20; // Normalizza su scala 0-100
    }
}

module.exports = CSIRepository;


//il metodo calculateScores() è una versione semplificata - andrà implementato secondo le specifiche esatte del test CSI.

