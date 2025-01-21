// src/engines/CSI/engine/CSIEngine.js

const BaseEngine = require('../../core/BaseEngine');
const CSIScorer = require('./CSIScorer');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

class CSIEngine extends BaseEngine {
    constructor(testRepository, testModel, resultModel) {
        super(testRepository, testModel, resultModel); // Passa le dipendenze al BaseEngine
        this.scorer = new CSIScorer();
        this.testType = 'CSI';
        this.testRepository = testRepository; // Assicurati che testRepository sia disponibile
    }

   // Questo metodo dovrebbe essere aggiunto o corretto
   async verifyToken(token) {
        try {
            // Delega la verifica al repository
            const test = await this.testRepository.verifyToken(token);
            return test;
        } catch (error) {
            logger.error('Engine: Error verifying token:', { 
                error: error.message,
                stack: error.stack
            });
            throw error; // Propaga l'errore al controller
        }
    }

    /**
     * Crea un nuovo test CSI
     * @override
     */
    async createTest(params) {
        try {
            const { studentId, classId } = params;

            // Carica template domande
            const questions = await this._loadQuestions();
            
            const test = await this.testModel.create({
                tipo: this.testType,
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
    async _loadQuestions() {
        try {
            // In una implementazione reale, queste domande verrebbero caricate da un database o file
            const questions = this._getQuestions();

            if (questions.length === 0) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessuna domanda trovata'
                );
            }

            return questions;
        } catch (error) {
            logger.error('Error loading questions', { error });
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
     * Restituisce le domande
     * @private
     */
    _getQuestions() {
        return [
            {
                id: 1,
                text: "Prima di iniziare una ricerca, leggo diverse fonti per farmi un'idea generale dell'argomento",
                category: "Elaborazione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 2,
                text: "Preferisco avere regole chiare e precise prima di iniziare un lavoro",
                category: "Creatività",
                type: "likert",
                polarity: "+"
            },
            {
                id: 3,
                text: "Capisco velocemente i concetti senza bisogno di molte spiegazioni",
                category: "Creatività",
                type: "likert",
                polarity: "-"
            },
            {
                id: 4,
                text: "Mi piace pianificare tutto nei minimi dettagli prima di agire",
                category: "Creatività",
                type: "likert",
                polarity: "+"
            },
            {
                id: 5,
                text: "Mi capita spesso di avere intuizioni improvvise che mi aiutano a risolvere problemi",
                category: "Creatività",
                type: "likert",
                polarity: "-"
            },
            {
                id: 6,
                text: "Preferisco seguire un approccio strutturato per affrontare un compito complesso",
                category: "Creatività",
                type: "likert",
                polarity: "+"
            },
            {
                id: 7,
                text: "Mi concentro sui dettagli prima di considerare il quadro generale",
                category: "Elaborazione",
                type: "likert",
                polarity: "+"
            },
            {
                id: 8,
                text: "Riesco a sintetizzare rapidamente le informazioni in una visione complessiva",
                category: "Elaborazione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 9,
                text: "Mi piace scomporre un problema in parti più piccole per risolverlo",
                category: "Elaborazione",
                type: "likert",
                polarity: "+"
            },
            {
                id: 10,
                text: "Preferisco affrontare i problemi considerando tutti gli aspetti contemporaneamente",
                category: "Elaborazione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 11,
                text: "Mi sento più a mio agio seguendo un metodo sequenziale per risolvere problemi",
                category: "Elaborazione",
                type: "likert",
                polarity: "+"
            },
            {
                id: 12,
                text: "Capisco meglio un argomento se prima mi viene presentata una visione generale",
                category: "Elaborazione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 13,
                text: "Rispondo immediatamente alle domande senza pensarci troppo",
                category: "Decisione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 14,
                text: "Preferisco riflettere attentamente prima di dare una risposta",
                category: "Decisione",
                type: "likert",
                polarity: "+"
            },
            {
                id: 15,
                text: "Mi capita di agire rapidamente senza considerare tutte le conseguenze",
                category: "Decisione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 16,
                text: "Valuto attentamente tutte le opzioni prima di prendere una decisione",
                category: "Decisione",
                type: "likert",
                polarity: "+"
            },
            {
                id: 17,
                text: "Mi piace risolvere problemi velocemente anche se non ho tutte le informazioni",
                category: "Decisione",
                type: "likert",
                polarity: "-"
            },
            {
                id: 18,
                text: "Prima di completare un compito, mi assicuro di aver analizzato tutti i dettagli",
                category: "Decisione",
                type: "likert",
                polarity: "+"
            },
            {
                id: 19,
                text: "Ricordo meglio le informazioni se sono presentate in forma di immagini o grafici",
                category: "Preferenza Visiva",
                type: "likert",
                polarity: "+"
            },
            {
                id: 20,
                text: "Preferisco leggere spiegazioni dettagliate piuttosto che osservare schemi",
                category: "Preferenza Visiva",
                type: "likert",
                polarity: "+"
            },
            {
                id: 21,
                text: "Capisco meglio un argomento guardando un video piuttosto che leggendo un testo",
                category: "Preferenza Visiva",
                type: "likert",
                polarity: "+"
            },
            {
                id: 22,
                text: "Mi aiuta prendere appunti dettagliati durante le lezioni",
                category: "Preferenza Visiva",
                type: "likert",
                polarity: "-"
            },
            {
                id: 23,
                text: "Preferisco usare mappe mentali per organizzare le mie idee",
                category: "Preferenza Visiva",
                type: "likert",
                polarity: "+"
            },
            {
                id: 24,
                text: "Mi trovo a mio agio leggendo testi lunghi con molte spiegazioni",
                category: "Preferenza Visiva",
                type: "likert",
                polarity: "-"
            },
            {
                id: 25,
                text: "Preferisco che qualcuno mi guidi passo passo in un nuovo compito",
                category: "Autonomia",
                type: "likert",
                polarity: "-"
            },
            {
                id: 26,
                text: "Mi piace gestire autonomamente i miei tempi e le mie attività",
                category: "Autonomia",
                type: "likert",
                polarity: "+"
            },
            {
                id: 27,
                text: "Trovo difficile organizzarmi senza indicazioni esterne",
                category: "Autonomia",
                type: "likert",
                polarity: "-"
            },
            {
                id: 28,
                text: "Mi sento motivato quando ho il controllo totale su quello che faccio",
                category: "Autonomia",
                type: "likert",
                polarity: "+"
            },
            {
                id: 29,
                text: "Ho bisogno di supervisione frequente per portare a termine un lavoro",
                category: "Autonomia",
                type: "likert",
                polarity: "-"
            },
            {
                id: 30,
                text: "Riesco a completare un progetto da solo senza bisogno di supporto",
                category: "Autonomia",
                type: "likert",
                polarity: "+"
            }
        ];
    }

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