// src/engines/CSI/engine/CSIEngine.js

const BaseEngine = require('../../core/BaseEngine');
const CSIScorer = require('./CSIScorer');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

class CSIEngine extends BaseEngine {
    constructor(Test, Result) {
        super(Test, Result);
        this.scorer = new CSIScorer();
        this.testType = 'CSI';
    }

    /**
     * Override del metodo verifyToken per aggiungere logica specifica CSI
     */
    async verifyToken(token) {
        try {
            // Usa il metodo della classe base
            const result = await super.verifyToken(token);
            
            // Verifica aggiuntiva specifica per CSI
            if (result.test && result.test.tipo !== this.testType) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido per test CSI'
                );
            }

            return result;
        } catch (error) {
            logger.error('Error verifying CSI token:', {
                error: error.message,
                stack: error.stack,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw error;
        }
    }

    /**
     * Inizializza un nuovo test CSI
     */
    async initializeTest(params) {
        try {
            const { studentId, testId } = params;
    
            logger.debug('Initializing CSI test:', { studentId, testId });
    
            // Verifica disponibilità
            const availability = await this.verifyTestAvailability(studentId);
            if (!availability.available) {
                throw createError(
                    ErrorTypes.VALIDATION.TEST_NOT_AVAILABLE,
                    availability.message
                );
            }
    
            // Carica o crea test
            let test;
            if (testId) {
                test = await this.Test.findById(testId);
            } else {
                const questions = await this._loadQuestions();
                
                test = await this.Test.create({
                    tipo: this.testType,
                    domande: questions,
                    configurazione: {
                        tempoLimite: 30,
                        tentativiMax: 1,
                        cooldownPeriod: 168,
                        randomizzaDomande: true,
                        mostraRisultatiImmediati: false
                    }
                });
            }
    
            // Crea result usando solo studentId
            const result = await this.Result.create({
                studentId,
                test: test._id,
                dataInizio: new Date(),
                completato: false,
                risposte: []
            });
    
            return { test, result };
        } catch (error) {
            logger.error('Error initializing CSI test:', {
                error: error.message,
                params
            });
            throw error;
        }
    }

    /**
     * Processa una risposta
     */
    async processAnswer(testId, answer) {
        try {
            const result = await this.Result.findOne({
                test: testId,
                completato: false
            });

            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Test non trovato o già completato'
                );
            }

            // Validazione risposta
            if (answer.value < 1 || answer.value > 5) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Valore risposta non valido'
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
            logger.error('Error processing CSI answer:', {
                error: error.message,
                testId,
                answer
            });
            throw error;
        }
    }

    /**
     * Completa il test
     */
    async completeTest(testId) {
        try {
            const result = await this.Result.findOne({
                test: testId,
                completato: false
            }).populate('test');

            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Test non trovato o già completato'
                );
            }

            // Verifica completezza
            if (result.risposte.length !== result.test.domande.length) {
                throw createError(
                    ErrorTypes.VALIDATION.INCOMPLETE_TEST,
                    'Test incompleto'
                );
            }

            // Calcola punteggi
            const scores = await this.scorer.calculateScores(result.risposte);
            const profile = this.scorer.generateProfile(scores);
            
            // Aggiorna result
            result.punteggi = scores;
            result.completato = true;
            result.dataCompletamento = new Date();
            result.analytics = {
                tempoTotale: this._calculateTotalTime(result.risposte),
                profile: profile
            };

            await result.save();
            return result;
        } catch (error) {
            logger.error('Error completing CSI test:', {
                error: error.message,
                testId
            });
            throw error;
        }
    }

    /**
     * Carica le domande del test
     */
    // In CSIEngine.js

    async _loadQuestions() {
        try {
            return [
                {
                    id: 1,
                    testo: "Prima di iniziare una ricerca, leggo diverse fonti per farmi un'idea generale dell'argomento",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 2,
                    testo: "Preferisco avere regole chiare e precise prima di iniziare un lavoro",
                    tipo: "likert",
                    categoria: "Creatività",
                    metadata: { polarity: "+" }
                },
                {
                    id: 3,
                    testo: "Capisco velocemente i concetti senza bisogno di molte spiegazioni",
                    tipo: "likert",
                    categoria: "Creatività",
                    metadata: { polarity: "-" }
                },
                {
                    id: 4,
                    testo: "Mi piace pianificare tutto nei minimi dettagli prima di agire",
                    tipo: "likert",
                    categoria: "Creatività",
                    metadata: { polarity: "+" }
                },
                {
                    id: 5,
                    testo: "Mi capita spesso di avere intuizioni improvvise che mi aiutano a risolvere problemi",
                    tipo: "likert",
                    categoria: "Creatività",
                    metadata: { polarity: "-" }
                },
                {
                    id: 6,
                    testo: "Preferisco seguire un approccio strutturato per affrontare un compito complesso",
                    tipo: "likert",
                    categoria: "Creatività",
                    metadata: { polarity: "+" }
                },
                {
                    id: 7,
                    testo: "Mi concentro sui dettagli prima di considerare il quadro generale",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "+" }
                },
                {
                    id: 8,
                    testo: "Riesco a sintetizzare rapidamente le informazioni in una visione complessiva",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 9,
                    testo: "Mi piace scomporre un problema in parti più piccole per risolverlo",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "+" }
                },
                {
                    id: 10,
                    testo: "Preferisco affrontare i problemi considerando tutti gli aspetti contemporaneamente",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 11,
                    testo: "Mi sento più a mio agio seguendo un metodo sequenziale per risolvere problemi",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "+" }
                },
                {
                    id: 12,
                    testo: "Capisco meglio un argomento se prima mi viene presentata una visione generale",
                    tipo: "likert",
                    categoria: "Elaborazione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 13,
                    testo: "Rispondo immediatamente alle domande senza pensarci troppo",
                    tipo: "likert",
                    categoria: "Decisione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 14,
                    testo: "Preferisco riflettere attentamente prima di dare una risposta",
                    tipo: "likert",
                    categoria: "Decisione",
                    metadata: { polarity: "+" }
                },
                {
                    id: 15,
                    testo: "Mi capita di agire rapidamente senza considerare tutte le conseguenze",
                    tipo: "likert",
                    categoria: "Decisione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 16,
                    testo: "Valuto attentamente tutte le opzioni prima di prendere una decisione",
                    tipo: "likert",
                    categoria: "Decisione",
                    metadata: { polarity: "+" }
                },
                {
                    id: 17,
                    testo: "Mi piace risolvere problemi velocemente anche se non ho tutte le informazioni",
                    tipo: "likert",
                    categoria: "Decisione",
                    metadata: { polarity: "-" }
                },
                {
                    id: 18,
                    testo: "Prima di completare un compito, mi assicuro di aver analizzato tutti i dettagli",
                    tipo: "likert",
                    categoria: "Decisione",
                    metadata: { polarity: "+" }
                },
                {
                    id: 19,
                    testo: "Ricordo meglio le informazioni se sono presentate in forma di immagini o grafici",
                    tipo: "likert",
                    categoria: "Preferenza Visiva",
                    metadata: { polarity: "+" }
                },
                {
                    id: 20,
                    testo: "Preferisco leggere spiegazioni dettagliate piuttosto che osservare schemi",
                    tipo: "likert",
                    categoria: "Preferenza Visiva",
                    metadata: { polarity: "+" }
                },
                {
                    id: 21,
                    testo: "Capisco meglio un argomento guardando un video piuttosto che leggendo un testo",
                    tipo: "likert",
                    categoria: "Preferenza Visiva",
                    metadata: { polarity: "+" }
                },
                {
                    id: 22,
                    testo: "Mi aiuta prendere appunti dettagliati durante le lezioni",
                    tipo: "likert",
                    categoria: "Preferenza Visiva",
                    metadata: { polarity: "-" }
                },
                {
                    id: 23,
                    testo: "Preferisco usare mappe mentali per organizzare le mie idee",
                    tipo: "likert",
                    categoria: "Preferenza Visiva",
                    metadata: { polarity: "+" }
                },
                {
                    id: 24,
                    testo: "Mi trovo a mio agio leggendo testi lunghi con molte spiegazioni",
                    tipo: "likert",
                    categoria: "Preferenza Visiva",
                    metadata: { polarity: "-" }
                },
                {
                    id: 25,
                    testo: "Preferisco che qualcuno mi guidi passo passo in un nuovo compito",
                    tipo: "likert",
                    categoria: "Autonomia",
                    metadata: { polarity: "-" }
                },
                {
                    id: 26,
                    testo: "Mi piace gestire autonomamente i miei tempi e le mie attività",
                    tipo: "likert",
                    categoria: "Autonomia",
                    metadata: { polarity: "+" }
                },
                {
                    id: 27,
                    testo: "Trovo difficile organizzarmi senza indicazioni esterne",
                    tipo: "likert",
                    categoria: "Autonomia",
                    metadata: { polarity: "-" }
                },
                {
                    id: 28,
                    testo: "Mi sento motivato quando ho il controllo totale su quello che faccio",
                    tipo: "likert",
                    categoria: "Autonomia",
                    metadata: { polarity: "+" }
                },
                {
                    id: 29,
                    testo: "Ho bisogno di supervisione frequente per portare a termine un lavoro",
                    tipo: "likert",
                    categoria: "Autonomia",
                    metadata: { polarity: "-" }
                },
                {
                    id: 30,
                    testo: "Riesco a completare un progetto da solo senza bisogno di supporto",
                    tipo: "likert",
                    categoria: "Autonomia",
                    metadata: { polarity: "+" }
                }
            ];
            } catch (error) {
                logger.error('Error loading CSI questions:', error);
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Errore nel caricamento delle domande'
                );
            }
        }

    /**
     * Calcola il tempo totale del test
     */
    _calculateTotalTime(answers) {
        return answers.reduce((total, answer) => total + (answer.tempoRisposta || 0), 0);
    }
}

module.exports = CSIEngine;