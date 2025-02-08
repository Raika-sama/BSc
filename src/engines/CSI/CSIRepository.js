// src/engines/CSI/repositories/CSIRepository.js
const mongoose = require('mongoose'); // Aggiungi questo import
const crypto = require('crypto'); // Aggiungi questo import in cima
const { CSIQuestion } = require('./models/CSIQuestion');
const { Test } = require('../../models/Test');
const CSIConfig = require('./models/CSIConfig');const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const TestRepository = require('../../repositories/TestRepository');

class CSIRepository extends TestRepository {
    constructor() {
          // 1. Prima otteniamo il modello Result
          const ResultModel = mongoose.model('Result');
          if (!ResultModel) {
              throw new Error('Result model not found');
          }
  
          // 2. Chiamiamo il costruttore del parent con il modello Test
          super(mongoose.model('Test'));
  
          // 3. Otteniamo il discriminator CSI
          this.resultModel = ResultModel.discriminators?.['CSI'];
          if (!this.resultModel) {
              throw new Error('CSI discriminator not found in Result model');
          }
  
          // 4. Otteniamo gli altri modelli necessari
          this.questionModel = mongoose.model('CSIQuestion');
          this.configModel = mongoose.model('CSIConfig');
  
          logger.debug('CSIRepository initialized:', {
              hasResultModel: !!this.resultModel,
              resultModelName: this.resultModel.modelName,
              discriminatorKey: this.resultModel.schema.discriminatorMapping?.key,
              hasQuestionModel: !!this.questionModel,
              hasConfigModel: !!this.configModel
          });
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
 * Verifica disponibilità test per uno studente
 */
async checkAvailability(studentId) {
    try {
        logger.debug('Checking CSI test availability:', { studentId });

        const lastTest = await this.resultModel.findOne({
            studentId,
            tipo: 'CSI',
            completato: true
        }).sort({ dataCompletamento: -1 });

        if (!lastTest) {
            return { available: true };
        }

        const cooldownPeriod = 30 * 24 * 60 * 60 * 1000;
        const nextAvailableDate = new Date(lastTest.dataCompletamento.getTime() + cooldownPeriod);
        const now = new Date();

        return {
            available: now >= nextAvailableDate,
            nextAvailableDate,
            lastTestDate: lastTest.dataCompletamento
        };
    } catch (error) {
        logger.error('Error checking availability:', error);
        throw error;
    }
}



  /**
     * Override del metodo saveTestToken per gestire specifiche CSI
     */
 /**
 * Override del metodo saveTestToken per gestire specifiche CSI
 */
 async saveTestToken(testData) {
    try {
        const token = crypto.randomBytes(32).toString('hex');
        
        // Recupera configurazione e domande
        const [activeConfig, questions] = await Promise.all([
            this.configModel.findOne({ active: true }),
            this.questionModel.find({}).lean()
        ]);

        if (!activeConfig) {
            throw new Error('No active CSI configuration found');
        }

        // Crea il test base
        const newTest = await this.model.create({
            tipo: 'CSI',
            studentId: testData.studentId,
            domande: questions.map(q => ({
                questionRef: q._id,
                questionModel: 'CSIQuestion',
                order: q.id,
                version: '1.0.0'
            })),
            configurazione: {
                tempoLimite: activeConfig.validazione.tempoMassimoDomanda,
                tentativiMax: 1,
                cooldownPeriod: 24 * 60 * 60 * 1000,
                randomizzaDomande: false,
                mostraRisultatiImmediati: false,
                istruzioni: activeConfig.interfaccia.istruzioni,
                questionVersion: '1.0.0'
            },
            csiConfig: activeConfig._id,
            active: true,
            versione: '1.0.0'
        });

        // Crea il risultato CSI
        const newResult = await this.resultModel.create({
            tipo: 'CSI',
            studentId: testData.studentId,
            token,
            testRef: newTest._id,
            config: activeConfig._id,
            expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
            risposte: [],
            completato: false,
            dataInizio: new Date()
        });

        logger.debug('Created new CSI test:', {
            testId: newTest._id,
            resultId: newResult._id,
            token: token.substring(0, 10) + '...'
        });

        return {
            token,
            expiresAt: newResult.expiresAt,
            testId: newTest._id,
            resultId: newResult._id
        };
    } catch (error) {
        logger.error('Error saving test token:', error);
        throw createError(
            ErrorTypes.DATABASE.SAVE_ERROR,
            'Errore nel salvataggio del token CSI',
            { originalError: error.message }
        );
    }
}




async findByToken(token) {
    try {
        logger.debug('Finding test by token:', { 
            token: token.substring(0, 10) + '...',
            modelName: this.resultModel.modelName
        });

        // Aggiungiamo più dettagli alla query
        const test = await this.resultModel.findOne({ 
            token,
            tipo: 'CSI',
            expiresAt: { $gt: new Date() } // verifica che non sia scaduto
        });
        
        logger.debug('Find by token result:', {
            found: !!test,
            testId: test?._id,
            testToken: test?.token,
            expires: test?.expiresAt
        });

        return test;
    } catch (error) {
        logger.error('Error finding test by token:', {
            error: error.message,
            token: token.substring(0, 10) + '...'
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

async update(token, updateData) {
    try {
        logger.debug('Updating CSI result:', { token, updateData });
        
        const result = await this.resultModel.findOneAndUpdate(
            { token },
            updateData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Risultato non trovato'
            );
        }

        return result;
    } catch (error) {
        logger.error('Error updating CSI result:', {
            error: error.message,
            token
        });
        throw error;
    }
}

async updateByToken(token, updateData) {
    try {
        const result = await this.resultModel.findOneAndUpdate(
            { token: token }, // cerca per token
            updateData,
            { new: true }
        );

        if (!result) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Test non trovato'
            );
        }

        return result;
    } catch (error) {
        logger.error('Error updating test by token:', {
            error: error.message,
            token: token
        });
        throw createError(
            ErrorTypes.DATABASE.UPDATE_ERROR,
            'Errore nell\'aggiornamento di Test',
            { originalError: error.message }
        );
    }
}

async addAnswer(token, answerData) {
    try {
        logger.debug('Adding answer:', { token, answerData });

        // Usa il modello Result per trovare il documento
        const result = await this.resultModel.findOne({ 
            token,
            completato: false
        }).populate('testRef');

        if (!result) {
            throw new Error('Test non trovato o già completato');
        }

        // Aggiungi la risposta
        result.risposte.push(answerData);
        await result.save();

        return result;
    } catch (error) {
        logger.error('Error in addAnswer:', {
            error: error.message,
            token,
            answerData
        });
        throw error;
    }
}



}

module.exports = CSIRepository;