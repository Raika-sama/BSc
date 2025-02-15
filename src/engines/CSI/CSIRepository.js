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
        // Chiamiamo il costruttore della classe padre (TestRepository)
        super(mongoose.model('Test'));
        
        // Logging iniziale per debugging
        logger.debug('Initializing CSIRepository...', {
            availableModels: mongoose.modelNames(),
            resultDiscriminators: mongoose.model('Result').discriminators 
                ? Object.keys(mongoose.model('Result').discriminators)
                : 'No discriminators'
        });
    
        try {
            // Step 1: Verifica del modello Result base
            const ResultModel = mongoose.model('Result');
            if (!ResultModel) {
                throw new Error('Result model not found');
            }
    
            // Step 2: Verifica e acquisizione del discriminatore CSI
            this.resultModel = ResultModel.discriminators?.CSI;
            if (!this.resultModel) {
                throw new Error('CSI discriminator not found in Result model');
            }
    
            // Step 3: Verifica che il discriminatore sia configurato correttamente
            if (this.resultModel.modelName !== 'CSI' || 
                this.resultModel.baseModelName !== 'Result' ||
                this.resultModel.collection.name !== 'results') {
                throw new Error('CSI discriminator is not properly configured');
            }
    
            // Step 4: Verifica della presenza di tutti i modelli necessari
            const requiredModels = ['Test', 'CSIConfig', 'CSIQuestion'];
            const missingModels = requiredModels.filter(model => !mongoose.models[model]);
            if (missingModels.length > 0) {
                throw new Error(`Missing required models: ${missingModels.join(', ')}`);
            }
    
            // Step 5: Logging dettagliato della configurazione del modello
            logger.debug('CSIRepository initialized:', {
                resultModel: {
                    name: ResultModel.modelName,
                    discriminators: Object.keys(ResultModel.discriminators || {})
                },
                csiModel: {
                    name: this.resultModel.modelName,
                    schema: !!this.resultModel.schema,
                    collection: this.resultModel.collection.name,
                    baseModel: this.resultModel.baseModelName
                }
            });
    
            // Step 6: Verifica dettagliata del modello CSI
            logger.debug('CSI Result Model verification:', {
                modelName: this.resultModel.modelName,      // Deve essere 'CSI'
                baseModel: this.resultModel.baseModelName,  // Deve essere 'Result'
                collection: this.resultModel.collection.name, // Deve essere 'results'
                hasSchema: !!this.resultModel.schema,
                schemaOptions: this.resultModel.schema.options,
                discriminatorKey: this.resultModel.schema.options.discriminatorKey
            });
    
        } catch (error) {
            // Logging dettagliato in caso di errore durante l'inizializzazione
            logger.error('Failed to initialize CSIRepository:', {
                error: error.message,
                stack: error.stack,
                availableModels: mongoose.modelNames(),
                resultModel: mongoose.models.Result ? {
                    name: mongoose.models.Result.modelName,
                    hasDiscriminators: !!mongoose.models.Result.discriminators
                } : 'Not found'
            });
            throw error;
        }
    }

    
    async addAnswer(token, answerData) {
        try {
            logger.debug('Starting addAnswer operation:', { 
                token: token.substring(0, 10),
                answerData,
                modelInfo: {
                    resultModel: this.resultModel?.modelName,
                    discriminator: this.resultModel?.schema?.discriminatorKey
                }
            });
    
            // 1. Trova il risultato per il token
            const result = await this.resultModel.collection.findOne({
                token,
                tipo: 'CSI',
                completato: false
            });
    
            if (!result) {
                throw new Error('Test non trovato o già completato');
            }
    
            logger.debug('Found result document:', {
                resultId: result._id,
                testRef: result.testRef,
                testRefType: typeof result.testRef
            });
    
            // 2. Trova il test di riferimento - Gestisce sia String che ObjectId
            const testRef = typeof result.testRef === 'string' ? 
                new mongoose.Types.ObjectId(result.testRef) : 
                result.testRef;
    
            const test = await mongoose.model('Test').collection.findOne({
                _id: testRef
            });
    
            if (!test) {
                logger.error('Test reference not found:', {
                    testRef: result.testRef,
                    testRefType: typeof result.testRef,
                    resultId: result._id
                });
                throw new Error('Test reference not found');
            }
    
            logger.debug('Found test document:', {
                testId: test._id,
                questionCount: test.domande?.length,
                questionData: test.domande ? test.domande.slice(0, 1) : null // Log della prima domanda per debug
            });
    
            // 3. Aggiorna il documento con la nuova risposta
            const updateOperation = await this.resultModel.collection.updateOne(
                { _id: result._id },
                {
                    $push: {
                        risposte: {
                            ...answerData,
                            _id: new mongoose.Types.ObjectId(),
                            timestamp: new Date()
                        }
                    }
                }
            );
    
            logger.debug('Update operation result:', {
                matched: updateOperation.matchedCount,
                modified: updateOperation.modifiedCount,
                newAnswer: answerData
            });
    
            // 4. Recupera il documento aggiornato
            const updatedResult = await this.resultModel.collection.findOne({
                _id: result._id
            });
    
            // Aggiungi il test al risultato per la risposta
            updatedResult.test = {
                _id: test._id,
                domande: test.domande || [],
                configurazione: test.configurazione
            };
    
            logger.debug('AddAnswer operation completed:', {
                responseId: updatedResult._id,
                answersCount: updatedResult.risposte?.length,
                testId: updatedResult.test._id,
                latestAnswer: updatedResult.risposte[updatedResult.risposte.length - 1]
            });
    
            return updatedResult;
    
        } catch (error) {
            logger.error('Error in addAnswer:', {
                error: error.message,
                stack: error.stack,
                token: token.substring(0, 10),
                modelStatus: {
                    hasModel: !!this.resultModel,
                    modelName: this.resultModel?.modelName,
                    availableModels: mongoose.modelNames()
                }
            });
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
        logger.debug('Saving CSI test token:', { 
            studentId: testData.studentId 
        });

        const token = crypto.randomBytes(32).toString('hex');
        
        // 1. Recupera configurazione e domande
        const [activeConfig, questions] = await Promise.all([
            mongoose.model('CSIConfig').findOne({ active: true }),
            mongoose.model('CSIQuestion').find({ active: true }).lean()
        ]);

        if (!activeConfig) {
            throw new Error('No active CSI configuration found');
        }

        // 2. Crea il test base
        const newTest = await mongoose.model('Test').create({
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
                cooldownPeriod: 24 * 60 * 60 * 1000, // 24 ore
                randomizzaDomande: false,
                mostraRisultatiImmediati: false,
                istruzioni: activeConfig.interfaccia.istruzioni,
                questionVersion: '1.0.0'
            },
            csiConfig: activeConfig._id,
            active: true,
            versione: '1.0.0'
        });

        logger.debug('Created new test:', { 
            testId: newTest._id 
        });

        // 3. Crea il risultato CSI usando il discriminator
        if (!this.resultModel) {
            throw new Error('CSI Result model not properly initialized');
        }

        const newResult = await this.resultModel.create({
            tipo: 'CSI',
            studentId: testData.studentId,
            token,
            testRef: newTest._id,
            config: activeConfig._id,
            expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 ore
            risposte: [],
            completato: false,
            dataInizio: new Date()
        });

        logger.debug('Created new CSI result:', {
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
        logger.error('Error saving test token:', {
            error: error.message,
            stack: error.stack,
            data: testData
        });
        throw new Error('Errore nel salvataggio del token CSI');
    }
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







async findByToken(token) {
    try {
        logger.debug('Finding test by token:', { 
            token: token.substring(0, 10) + '...',
            modelName: this.resultModel.modelName
        });

        // Usa una query diretta senza populate
        const result = await this.resultModel
            .findOne({ 
                token,
                tipo: 'CSI',
                expiresAt: { $gt: new Date() }
            })
            .select({
                _id: 1,
                token: 1,
                testRef: 1,
                studentId: 1,
                risposte: 1,
                completato: 1,
                dataInizio: 1,
                expiresAt: 1,
                tipo: 1
            })
            .lean()
            .exec();

        if (!result) {
            logger.debug('No result found for token');
            return null;
        }

        logger.debug('Find by token result:', {
            found: true,
            testId: result._id,
            testRef: result.testRef,
            testToken: result.token,
            expires: result.expiresAt,
            fields: Object.keys(result)
        });

        return result;

    } catch (error) {
        logger.error('Error in findByToken:', {
            error: error.message,
            stack: error.stack,
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
        logger.debug('Updating CSI result:', { 
            token,
            updateData: {
                isCompleted: updateData.completato,
                hasScores: !!updateData.punteggiDimensioni,
                hasMetadata: !!updateData.metadataCSI
            }
        });
        
        // Valida la struttura dei punteggi prima dell'aggiornamento
        if (updateData.punteggiDimensioni) {
            ['elaborazione', 'creativita', 'preferenzaVisiva', 'decisione', 'autonomia'].forEach(dim => {
                const score = updateData.punteggiDimensioni[dim];
                if (!score || typeof score.score !== 'number') {
                    throw new Error(`Invalid score structure for dimension ${dim}`);
                }
            });
        }

        const result = await this.resultModel.findOneAndUpdate(
            { token },
            updateData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            logger.error('Result not found for token:', { token });
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Risultato non trovato'
            );
        }

        logger.debug('Result updated successfully:', {
            resultId: result._id,
            isCompleted: result.completato,
            hasScores: !!result.punteggiDimensioni
        });

        return result;
    } catch (error) {
        logger.error('Error updating CSI result:', {
            error: error.message,
            stack: error.stack,
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


}

module.exports = CSIRepository;