// src/engines/CSI/repositories/CSIRepository.js

const CSIQuestion = require('./models/CSIQuestion');
const { Result, CSIResult } = require('../../models'); // usa l'index.js centralizzato
const CSIConfig = require('./models/CSIConfig');  // Aggiungiamo l'import
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const TestRepository = require('../../repositories/TestRepository');

class CSIRepository extends TestRepository {
    constructor() {
        super();
        this.questionModel = CSIQuestion;
        this.resultModel = CSIResult;    // Nota: ho corretto anche il nome della proprietà
        this.configModel = CSIConfig;    // Aggiungiamo il model per la config
        this.resultModel = CSIResult;

    }

/**
     * Recupera la configurazione attiva
     */
async getActiveConfiguration() {
    try {
        logger.debug('Getting active CSI configuration');
        const config = await this.configModel.findOne({ active: true });
        return config || null;
    } catch (error) {
        logger.error('Error getting CSI configuration:', {
            error: error.message
        });
        throw error;
    }
}

  /**
     * Override del metodo saveTestToken per gestire specifiche CSI
     */
  async saveTestToken(testData) {
    try {
        const tokenData = await super.saveTestToken({
            ...testData,
            testType: 'CSI'
        });

        return tokenData;
    } catch (error) {
        logger.error('Error saving CSI test token:', {
            error: error.message,
            studentId: testData.studentId
        });
        throw error;
    }
}

/**
 * Aggiorna la configurazione
 */
async updateConfiguration(configData) {
    try {
        logger.debug('Updating CSI configuration with data:', {
            version: configData.version
        });

        // Verifica se esiste una configurazione attiva
        let config = await this.configModel.findOne({ active: true });

        if (config) {
            // Se esiste, aggiorniamo
            Object.assign(config, configData);
            config = await config.save();
        } else {
            // Se non esiste, ne creiamo una nuova
            config = new this.configModel({
                ...configData,
                active: true,
                version: configData.version || '1.0.0'
            });
            config = await config.save();
        }

        logger.debug('Configuration updated successfully:', {
            id: config._id,
            version: config.version
        });

        return config;
    } catch (error) {
        logger.error('Error updating configuration:', {
            error: error.message,
            data: configData
        });
        throw createError(
            ErrorTypes.DATABASE.UPDATE_ERROR,
            'Errore nell\'aggiornamento della configurazione CSI',
            { originalError: error.message }
        );
    }
}

  /**
     * Salva i risultati di un test CSI
     */
  async saveResults(resultData) {
    try {
        logger.debug('Saving CSI test results:', { 
            studentId: resultData.studentId,
            testId: resultData._id 
        });

        // Adatta i dati al nuovo schema
        const csiResultData = {
            ...resultData,
            tipo: 'CSI', // Necessario per il discriminatore
            punteggiDimensioni: {
                creativita: this._formatDimensionScore(resultData.scores.creativita),
                elaborazione: this._formatDimensionScore(resultData.scores.elaborazione),
                decisione: this._formatDimensionScore(resultData.scores.decisione),
                preferenzaVisiva: this._formatDimensionScore(resultData.scores.preferenzaVisiva),
                autonomia: this._formatDimensionScore(resultData.scores.autonomia)
            },
            metadataCSI: {
                versioneAlgoritmo: '1.0.0',
                calcolatoIl: new Date(),
                pattern: this._analyzePattern(resultData.risposte),
                profiloCognitivo: this._determineProfile(resultData.scores)
            }
        };

        const result = await this.resultModel.create(csiResultData);

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
 * Calcola i punteggi CSI per le risposte date
 */
async calculateScores(answers) {
    try {
        logger.debug('Calculating CSI scores:', { 
            answersCount: answers.length 
        });

        const rawScores = {
            elaborazione: this._calculateCategoryScore(answers, 'Elaborazione'),
            creativita: this._calculateCategoryScore(answers, 'Creatività'),
            preferenzaVisiva: this._calculateCategoryScore(answers, 'Preferenza Visiva'),
            decisione: this._calculateCategoryScore(answers, 'Decisione'),
            autonomia: this._calculateCategoryScore(answers, 'Autonomia')
        };

        // Interpreta i punteggi
        const interpretedScores = {
            elaborazione: this._interpretScore(rawScores.elaborazione),
            creativita: this._interpretScore(rawScores.creativita),
            preferenzaVisiva: this._interpretScore(rawScores.preferenzaVisiva),
            decisione: this._interpretScore(rawScores.decisione),
            autonomia: this._interpretScore(rawScores.autonomia)
        };

        logger.debug('Scores calculated and interpreted:', { 
            rawScores,
            interpretedScores 
        });

        return interpretedScores;
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
 * Formatta il punteggio di una dimensione
 * @private
 */
_formatDimensionScore(score) {
    return {
        score: score.value,
        level: score.level,
        interpretation: score.interpretation
    };
}

/**
 * Interpreta un punteggio numerico
 * @private
 */
_interpretScore(score) {
    let level, interpretation;

    if (score >= 80) {
        level = 'Alto';
        interpretation = 'Forte predisposizione';
    } else if (score >= 60) {
        level = 'Medio-Alto';
        interpretation = 'Buona predisposizione';
    } else if (score >= 40) {
        level = 'Medio';
        interpretation = 'Predisposizione nella media';
    } else if (score >= 20) {
        level = 'Medio-Basso';
        interpretation = 'Predisposizione limitata';
    } else {
        level = 'Basso';
        interpretation = 'Scarsa predisposizione';
    }

    return {
        value: score,
        level,
        interpretation
    };
}

/**
 * Analizza il pattern delle risposte
 * @private
 */
_analyzePattern(risposte) {
    const tempiRisposta = risposte.map(r => r.tempoRisposta);
    const avgTime = tempiRisposta.reduce((a, b) => a + b, 0) / tempiRisposta.length;
    const tooFastResponses = tempiRisposta.filter(t => t < 2000).length; // risposte sotto i 2 secondi

    return {
        isValid: tooFastResponses < 5,
        consistency: true, // implementa la logica di consistenza
        timePattern: {
            averageTime: avgTime,
            suspicious: tooFastResponses > 5,
            tooFastResponses,
            pattern: {
                consistent: this._checkTimeConsistency(tempiRisposta),
                avgTimePerQuestion: avgTime
            }
        }
    };
}

/**
 * Determina il profilo cognitivo
 * @private
 */
_determineProfile(scores) {
    const stiliDominanti = Object.entries(scores)
        .filter(([_, score]) => score.value >= 70)
        .map(([dimensione]) => dimensione);

    return {
        stiliDominanti,
        raccomandazioni: this._generateRecommendations(scores)
    };
}

/**
 * Verifica la consistenza dei tempi di risposta
 * @private
 */
_checkTimeConsistency(tempi) {
    const avg = tempi.reduce((a, b) => a + b, 0) / tempi.length;
    const stdDev = Math.sqrt(
        tempi.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / tempi.length
    );
    return stdDev < avg * 0.5; // consideriamo consistente se la deviazione standard è < 50% della media
}

/**
 * Genera raccomandazioni basate sui punteggi
 * @private
 */
_generateRecommendations(scores) {
    const recommendations = [];
    // Implementa la logica per generare raccomandazioni basate sui punteggi
    return recommendations;
}
}

module.exports = CSIRepository;