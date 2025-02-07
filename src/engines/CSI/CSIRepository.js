// src/engines/CSI/repositories/CSIRepository.js
const crypto = require('crypto'); // Aggiungi questo import in cima
const CSIQuestion = require('./models/CSIQuestion');
const { Test, Result, CSIResult } = require('../../models'); // usa l'index.js centralizzato
const CSIConfig = require('./models/CSIConfig');  // Aggiungiamo l'import
const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const TestRepository = require('../../repositories/TestRepository');

class CSIRepository extends TestRepository {
    constructor() {
        super();
        this.questionModel = CSIQuestion;
        this.resultModel = CSIResult;    // Nota: ho corretto anche il nome della proprietà
        this.resultModel = mongoose.model('Result').discriminators['CSI']; // Usa il discriminator corretto
        this.configModel = CSIConfig;    // Aggiungiamo il model per la config
        this.Test = Test; // Aggiungi questa riga
        logger.debug('CSIRepository initialized with models:', {
            hasQuestionModel: !!this.questionModel,
            hasResultModel: !!this.resultModel,
            hasConfigModel: !!this.configModel,
            hasTestModel: !!this.Test
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
        logger.debug('Checking CSI test availability:', { 
            studentId,
            hasResultModel: !!this.resultModel,
            modelName: this.resultModel?.modelName
        });

        if (!this.resultModel) {
            throw new Error('Result model not initialized');
        }

        const lastTest = await this.resultModel.findOne({
            studentId,
            tipo: 'CSI',
            completato: true
        }).sort({ dataCompletamento: -1 });

        logger.debug('Last test found:', {
            found: !!lastTest,
            completionDate: lastTest?.dataCompletamento
        });

        if (!lastTest) {
            return { available: true };
        }

        const cooldownPeriod = 30 * 24 * 60 * 60 * 1000; // 30 giorni
        const nextAvailableDate = new Date(lastTest.dataCompletamento.getTime() + cooldownPeriod);
        const now = new Date();

        const availability = {
            available: now >= nextAvailableDate,
            nextAvailableDate,
            lastTestDate: lastTest.dataCompletamento
        };

        logger.debug('Availability check result:', availability);

        return availability;
    } catch (error) {
        logger.error('Error checking CSI test availability:', {
            error: error.message,
            studentId,
            modelState: {
                hasResultModel: !!this.resultModel,
                modelName: this.resultModel?.modelName
            }
        });
        throw createError(
            ErrorTypes.DATABASE.QUERY_ERROR,
            'Errore nella verifica disponibilità test CSI',
            { originalError: error.message }
        );
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
        logger.debug('Saving CSI test token with data:', {
            studentId: testData.studentId,
            tipo: testData.tipo
        });

        // Genera un nuovo token
        const token = crypto.randomBytes(32).toString('hex');

        // Ottieni o crea la configurazione attiva
        let activeConfig = await this.configModel.findOne({ active: true });
        if (!activeConfig) {
            activeConfig = await this.configModel.create({
                version: '1.0.0',
                active: true,
                scoring: {
                    categorie: [
                        {
                            nome: 'Elaborazione',
                            pesoDefault: 1,
                            min: 1,
                            max: 5,
                            interpretazioni: []
                        },
                        // aggiungi altre categorie predefinite
                    ]
                },
                validazione: {
                    tempoMinimoDomanda: 2000,
                    tempoMassimoDomanda: 300000,
                    numeroMinimoDomande: 20,
                    sogliaRisposteVeloci: 5
                },
                interfaccia: {
                    istruzioni: 'Rispondi alle seguenti domande selezionando un valore da 1 a 5',
                    mostraProgressBar: true,
                    permettiTornaIndietro: false
                }
            });
        }

        // Crea il Test
        const newTest = await this.Test.create({
            tipo: 'CSI',
            studentId: testData.studentId,
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

        // Crea il Result
        const newResult = await this.resultModel.create({
            tipo: 'CSI',
            studentId: testData.studentId,
            token: token,
            testRef: newTest._id,
            config: activeConfig._id,
            expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)),
            risposte: [],
            completato: false,
            dataInizio: new Date()
        });

        return {
            token,
            expiresAt: newResult.expiresAt,
            testId: newTest._id,
            resultId: newResult._id
        };
    } catch (error) {
        logger.error('Error saving CSI test token:', {
            error: error.message,
            studentId: testData.studentId
        });
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
        logger.debug('Adding answer:', {
            token: token.substring(0, 10) + '...',
            answerData
        });

        // Verifica che il test esista e non sia completato
        const test = await this.resultModel.findOne({ 
            token,
            completato: false
        });

        if (!test) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Test non trovato o già completato'
            );
        }

        // Verifica che la risposta non sia già presente
        const esisteRisposta = test.risposte.some(r => r.questionId === answerData.questionId);
        if (esisteRisposta) {
            throw createError(
                ErrorTypes.VALIDATION.DUPLICATE_ANSWER,
                'Risposta già presente per questa domanda'
            );
        }

        // Verifica il tempo di risposta
        const config = await this.configModel.findOne({ active: true });
        if (config && answerData.timeSpent) {
            const tempoValido = config.validateAnswer(answerData.timeSpent);
            if (!tempoValido) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_RESPONSE_TIME,
                    'Tempo di risposta non valido'
                );
            }
        }

        // Aggiunge la risposta
        const result = await this.resultModel.findOneAndUpdate(
            { token },
            {
                $push: {
                    risposte: {
                        questionId: answerData.questionId,
                        value: answerData.value,
                        timeSpent: answerData.timeSpent,
                        categoria: answerData.categoria,
                        timestamp: answerData.timestamp || new Date()
                    }
                }
            },
            { 
                new: true,
                runValidators: true
            }
        );

        logger.debug('Answer added successfully:', {
            testId: result._id,
            answersCount: result.risposte.length
        });

        return result;
    } catch (error) {
        logger.error('Error adding answer:', {
            error: error.message,
            token: token.substring(0, 10) + '...'
        });
        throw error;
    }
}



async getTestStatus(token) {
    try {
        const test = await this.resultModel.findOne({ token });
        if (!test) {
            return null;
        }

        return {
            total: test.test.domande.length,
            answered: test.risposte.length,
            remaining: test.test.domande.length - test.risposte.length,
            isComplete: test.completato,
            canSubmitMore: !test.completato && test.risposte.length < test.test.domande.length
        };
    } catch (error) {
        logger.error('Error getting test status:', {
            error: error.message,
            token: token.substring(0, 10) + '...'
        });
        throw error;
    }
}

}

module.exports = CSIRepository;