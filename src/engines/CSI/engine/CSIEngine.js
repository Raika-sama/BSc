// src/engines/CSI/engine/CSIEngine.js

const BaseEngine = require('../../core/BaseEngine');
const CSIScorer = require('./CSIScorer');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

class CSIEngine extends BaseEngine {
    constructor() {
        super();
        this.scorer = new CSIScorer();
        this.testType = 'CSI';
    }

    /**
     * Crea un nuovo test CSI
     * @override
     */
    async createTest(params) {
        try {
            const { studentId, classId, schoolType } = params;

            // Carica template domande in base al tipo di scuola
            const questions = await this._loadQuestions(schoolType);
            
            const test = await this.testModel.create({
                tipo: this.testType,
                stato: 'published',
                targetGrade: schoolType,
                domande: questions,
                configurazione: {
                    tempoLimite: 30, // 30 minuti
                    tentativiMax: 1,
                    cooldownPeriod: 168, // 1 settimana
                    randomizzaDomande: true,
                    mostraRisultatiImmediati: false
                }
            });

            // Crea result iniziale
            await this.resultModel.create({
                utente: studentId,
                test: test._id,
                classe: classId,
                dataInizio: new Date(),
                completato: false
            });

            return test;
        } catch (error) {
            logger.error('Error creating CSI test', { error, params });
            throw error;
        }
    }

    /**
     * Processa una singola risposta
     * @override
     */
    async processAnswer(testId, answer) {
        try {
            const result = await this.resultModel.findOne({
                test: testId,
                completato: false
            });

            if (!result) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato o già completato'
                );
            }

            // Valida risposta
            if (answer.value < 1 || answer.value > 5) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Valore risposta non valido per scala Likert 1-5'
                );
            }

            // Aggiungi risposta
            result.risposte.push({
                domanda: answer.questionIndex,
                risposta: answer.value,
                tempoRisposta: answer.timeSpent
            });

            await result.save();
            return result;
        } catch (error) {
            logger.error('Error processing answer', { error, testId, answer });
            throw error;
        }
    }

    /**
     * Completa il test e calcola risultati
     * @override
     */
    async completeTest(testId) {
        try {
            const result = await this.resultModel.findOne({
                test: testId,
                completato: false
            }).populate('test');

            if (!result) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Test non trovato o già completato'
                );
            }

            // Verifica completezza test
            if (result.risposte.length !== result.test.domande.length) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Test incompleto - non tutte le domande hanno risposta'
                );
            }

            // Calcola punteggi
            const scores = await this.scorer.calculateScores(result.risposte);
            
            // Genera profilo
            const profile = this.scorer.generateProfile(scores);
            
            // Analizza pattern di risposta
            const responseAnalysis = this.scorer.analyzeResponsePattern(result.risposte);

            // Aggiorna result
            result.punteggi = scores;
            result.analytics = {
                tempoTotale: this._calculateTotalTime(result.risposte),
                domandePerse: 0,
                pattern: responseAnalysis,
                metadata: {
                    profile: profile
                }
            };
            result.completato = true;
            result.dataCompletamento = new Date();

            await result.save();
            return result;
        } catch (error) {
            logger.error('Error completing test', { error, testId });
            throw error;
        }
    }

    /**
     * Genera report dettagliato
     * @override
     */
    async generateReport(testId) {
        try {
            const result = await this.resultModel.findById(testId)
                .populate('test')
                .populate('utente', 'firstName lastName email');

            if (!result) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Risultato test non trovato'
                );
            }

            const profile = result.analytics.metadata.profile;
            
            return {
                student: {
                    name: `${result.utente.firstName} ${result.utente.lastName}`,
                    email: result.utente.email
                },
                scores: result.punteggi,
                profile: {
                    dimensions: profile.dimensions,
                    dominantStyle: profile.dominantStyle,
                    recommendations: profile.recommendations
                },
                analytics: {
                    completionTime: result.analytics.tempoTotale,
                    answerPattern: result.analytics.pattern,
                    date: result.dataCompletamento
                }
            };
        } catch (error) {
            logger.error('Error generating report', { error, testId });
            throw error;
        }
    }

    /**
     * Carica le domande appropriate per il tipo di scuola
     * @private
     */
    async _loadQuestions(schoolType) {
        try {
            // In una implementazione reale, queste domande verrebbero caricate da un database o file
            const questions = schoolType === 'middle_school' ? 
                this._getMiddleSchoolQuestions() : 
                this._getHighSchoolQuestions();

            if (questions.length === 0) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna domanda trovata per il tipo di scuola specificato'
                );
            }

            return questions;
        } catch (error) {
            logger.error('Error loading questions', { error, schoolType });
            throw error;
        }
    }

    /**
     * Utility per calcolare la media
     * @private
     */
    _calculateAverage(numbers) {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    /**
     * Calcola distribuzione risposte
     * @private
     */
    _calculateDistribution(values) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        values.forEach(v => distribution[v]++);
        return distribution;
    }

    /**
     * Calcola tempo totale del test
     * @private
     */
    _calculateTotalTime(answers) {
        return answers.reduce((total, answer) => total + (answer.tempoRisposta || 0), 0);
    }

    /**
     * Restituisce le domande per scuola media
     * @private
     */
    _getMiddleSchoolQuestions() {
        // Implementazione di esempio - in produzione caricare da DB/file
        return [
            {
                testo: "Prima di iniziare una ricerca, leggo diverse fonti per farmi un'idea generale dell'argomento",
                categoria: "Analitico/Globale",
                tipo: "likert",
                polarity: "-",
                peso: 1
            },
            // ... altre domande
        ];
    }

    /**
     * Restituisce le domande per scuola superiore
     * @private
     */
    _getHighSchoolQuestions() {
        // Implementazione di esempio - in produzione caricare da DB/file
        return [
            {
                testo: "Per analizzare un testo letterario, lo divido in sezioni e studio ogni parte separatamente",
                categoria: "Analitico/Globale",
                tipo: "likert",
                polarity: "+",
                peso: 1
            },
            // ... altre domande
        ];
    }
    // Aggiungi questo metodo alla classe CSIEngine

/**
 * Salva il token del test per uno studente
 */
async saveTestToken(params) {
    try {
        const { token, studentId, testType, expiresAt } = params;
        
        logger.debug('Saving test token', { studentId, testType });

        // Crea un nuovo test con il token
        const test = await this.testModel.create({
            token,
            tipo: testType,
            stato: 'pending',
            studentId,
            expiresAt,
            created: new Date()
        });

        logger.info('Test token saved successfully', { 
            testId: test._id,
            studentId 
        });

        return test;
    } catch (error) {
        logger.error('Error saving test token', { 
            error,
            studentId: params.studentId 
        });
        throw createError(
            ErrorTypes.DATABASE.SAVE_ERROR,
            'Errore nel salvare il token del test'
        );
    }
}
}

module.exports = CSIEngine;