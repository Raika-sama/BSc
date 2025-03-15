// src/engines/CSI/engine/CSIScorer.js

/**
 * CSIScorer.js - Modulo avanzato per il calcolo dei punteggi del Cognitive Style Index (CSI)
 * 
 * Questo modulo implementa metodologie professionali per calcolare e interpretare i punteggi
 * del CSI basandosi sulle ricerche scientifiche nel campo degli stili cognitivi.
 * 
 * @version 2.0.0
 * @author Implementazione originale, aggiornato da Claude 3.7 Sonnet
 */

const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

/**
 * Classe CSIScorer - Gestisce calcolo, interpretazione e validazione degli stili cognitivi
 * 
 * Riferimenti scientifici:
 * 1. Allinson, C. W., & Hayes, J. (1996). The Cognitive Style Index: A measure of intuition‐analysis for organizational research.
 *    Journal of Management Studies, 33(1), 119-135.
 * 
 * 2. Riding, R., & Cheema, I. (1991). Cognitive styles—an overview and integration. Educational Psychology, 11(3-4), 193-215.
 * 
 * 3. Sternberg, R. J., & Grigorenko, E. L. (1997). Are cognitive styles still in style? American Psychologist, 52(7), 700-712.
 * 
 * 4. Peterson, E. R., Rayner, S. G., & Armstrong, S. J. (2009). Researching the psychology of cognitive style and learning style: 
 *    Is there really a future?. Learning and Individual Differences, 19(4), 518-523.
 */
class CSIScorer {
    constructor() {
        this.version = "2.0.0";  // Versione aggiornata
        
        // Mapping delle categorie alle dimensioni
        this.categoryMapping = {
            'Elaborazione': 'elaborazione',
            'Creatività': 'creativita',
            'Preferenza Visiva': 'preferenzaVisiva',
            'Decisione': 'decisione',
            'Autonomia': 'autonomia'
        };
        
        // Mapping inverso per retrocompatibilità
        this.legacyMapping = {
            'Elaborazione': 'analitico',
            'Creatività': 'sistematico',
            'Preferenza Visiva': 'verbale',
            'Decisione': 'impulsivo',
            'Autonomia': 'dipendente'
        };

        // Mapping completo delle dimensioni con metadata avanzato
        this.dimensions = {
            'elaborazione': {
                name: 'Elaborazione',
                leftExtreme: 'Analitico',
                rightExtreme: 'Globale',
                description: 'Modalità di elaborazione delle informazioni',
                interpretations: {
                    low: 'Tendenza ad analizzare sistematicamente le informazioni in parti discrete.',
                    medium: 'Bilanciamento tra analisi dettagliata e visione d\'insieme.',
                    high: 'Tendenza a processare le informazioni come un insieme, focalizzandosi sul quadro generale.'
                },
                recommendations: {
                    low: [
                        "Integra metodi di visualizzazione globale come mappe mentali per vedere il quadro d'insieme",
                        "Pratica l'identificazione di pattern e connessioni tra concetti diversi"
                    ],
                    medium: [
                        "Alterna consapevolmente tra analisi dettagliata e visione d'insieme a seconda del contesto",
                        "Utilizza sia approcci analitici che sintetici nei diversi contesti di apprendimento"
                    ],
                    high: [
                        "Integra strumenti di analisi dettagliata come liste di controllo e schemi gerarchici",
                        "Dedica tempo specifico all'analisi dei dettagli importanti che potrebbero essere trascurati"
                    ]
                }
            },
            'creativita': {
                name: 'Creatività',
                leftExtreme: 'Sistematico',
                rightExtreme: 'Intuitivo',
                description: 'Approccio alla risoluzione dei problemi',
                interpretations: {
                    low: 'Preferenza per approcci metodici e strutturati alla risoluzione dei problemi.',
                    medium: 'Capacità di utilizzare sia metodi sistematici che intuitivi a seconda del contesto.',
                    high: 'Preferenza per soluzioni innovative e approcci non convenzionali.'
                },
                recommendations: {
                    low: [
                        "Sperimenta con tecniche di pensiero laterale e brainstorming senza giudizio",
                        "Dedica tempo all'esplorazione di soluzioni alternative anche quando hai già identificato un metodo"
                    ],
                    medium: [
                        "Sviluppa consapevolezza di quando è meglio usare un approccio metodico o uno più intuitivo",
                        "Alterna deliberatamente tra fasi di strutturazione e fasi di esplorazione libera"
                    ],
                    high: [
                        "Integra strumenti di organizzazione e pianificazione per concretizzare le tue idee creative",
                        "Sviluppa metodologie per verificare sistematicamente la validità delle tue intuizioni"
                    ]
                }
            },
            'preferenzaVisiva': {
                name: 'Preferenza Visiva',
                leftExtreme: 'Verbale',
                rightExtreme: 'Visivo',
                description: 'Preferenza nella modalità di apprendimento',
                interpretations: {
                    low: 'Preferenza per informazioni testuali e descrizioni verbali.',
                    medium: 'Utilizzo bilanciato di informazioni testuali e visive.',
                    high: 'Preferenza per immagini, diagrammi e rappresentazioni visive delle informazioni.'
                },
                recommendations: {
                    low: [
                        "Integra rappresentazioni visive come diagrammi e mappe concettuali nel tuo studio",
                        "Prova a trasformare le informazioni testuali in schemi o infografiche"
                    ],
                    medium: [
                        "Alterna consapevolmente tra rappresentazioni visive e verbali dello stesso contenuto",
                        "Sviluppa ulteriormente entrambe le modalità di apprendimento per massimizzare la flessibilità"
                    ],
                    high: [
                        "Complementa le rappresentazioni visive con sintesi scritte dei concetti chiave",
                        "Pratica l'articolazione verbale di ciò che comprendi visivamente per consolidare l'apprendimento"
                    ]
                }
            },
            'decisione': {
                name: 'Decisione',
                leftExtreme: 'Impulsivo',
                rightExtreme: 'Riflessivo',
                description: 'Stile decisionale',
                interpretations: {
                    low: 'Tendenza a prendere decisioni rapide, basate sull\'intuizione immediata.',
                    medium: 'Bilanciamento tra rapidità decisionale e riflessione.',
                    high: 'Preferenza per decisioni ponderate dopo attenta valutazione delle opzioni.'
                },
                recommendations: {
                    low: [
                        "Implementa brevi pause di riflessione prima di prendere decisioni importanti",
                        "Utilizza liste pro/contro per valutare opzioni in modo più sistematico"
                    ],
                    medium: [
                        "Calibra deliberatamente il tempo di riflessione in base all'importanza della decisione",
                        "Sviluppa consapevolezza delle situazioni in cui è vantaggioso decidere rapidamente o ponderare con cura"
                    ],
                    high: [
                        "Stabilisci limiti di tempo per le fasi di analisi per evitare l'indecisione",
                        "Pratica il processo decisionale rapido in contesti a basso rischio per sviluppare questa capacità"
                    ]
                }
            },
            'autonomia': {
                name: 'Autonomia',
                leftExtreme: 'Dipendente',
                rightExtreme: 'Indipendente',
                description: 'Autonomia nell\'apprendimento',
                interpretations: {
                    low: 'Preferenza per strutture di apprendimento guidate e supporto esterno.',
                    medium: 'Bilanciamento tra autonomia e ricerca di guida quando necessario.',
                    high: 'Forte indipendenza e autodirezione nei processi di apprendimento.'
                },
                recommendations: {
                    low: [
                        "Sviluppa gradualmente la tua autonomia attraverso progetti con livelli incrementali di indipendenza",
                        "Stabilisci checkpoint di auto-revisione prima di cercare feedback esterni"
                    ],
                    medium: [
                        "Identifica consapevolmente quando è più produttivo lavorare in autonomia o cercare guida",
                        "Alterna tra periodi di studio indipendente e momenti di confronto con altri"
                    ],
                    high: [
                        "Integra feedback esterni in momenti strategici del tuo percorso di apprendimento",
                        "Bilancia la tua indipendenza con opportunità di apprendimento collaborativo"
                    ]
                }
            }
        };

        // Soglie per l'interpretazione - versione migliorata
        this.thresholds = {
            veryLow: 20,    // Sotto il 20%
            low: 35,        // 20-35%
            mediumLow: 45,  // 35-45%
            medium: 55,     // 45-55%
            mediumHigh: 65, // 55-65%
            high: 80        // 65-80%, sopra 80% = molto alto
        };

        // Range risposte
        this.responseRange = {
            min: 1,
            max: 5
        };

        // Tempo risposte (ms)
        this.responseTime = {
            min: 2000,       // 2 secondi
            max: 300000,     // 5 minuti
            suspicious: 1000 // risposte sotto 1 secondo sono sospette
        };
        
        // Constanti di normalizzazione
        this.normalization = {
            scaleMin: 0,
            scaleMax: 100,
            scaleCenter: 50  // Punto centrale della scala normalizzata
        };
    }

    /**
     * Calcola il risultato completo del test
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Risultato completo
     */
    calculateTestResult(answers) {
        try {
            logger.debug('Calculating complete test result', {
                answersCount: answers.length,
                sampleAnswer: answers[0]
            });

            // Verifica la struttura delle risposte
            if (!Array.isArray(answers) || answers.length === 0) {
                throw new Error('Invalid answers format: must be non-empty array');
            }

            // Verifica la struttura di ogni risposta e fornisce un messaggio di errore dettagliato
            answers.forEach((answer, index) => {
                // Gestione più flessibile della struttura
                const hasValue = 'value' in answer || 'valore' in answer;
                const hasTimeSpent = 'timeSpent' in answer || 'tempoRisposta' in answer;
                const hasCategory = (answer.question && 'categoria' in answer.question) || 
                                   (answer.domanda && 'categoria' in answer.domanda);
                
                if (!hasValue || !hasTimeSpent || !hasCategory) {
                    const missingFields = [];
                    if (!hasValue) missingFields.push('value/valore');
                    if (!hasTimeSpent) missingFields.push('timeSpent/tempoRisposta');
                    if (!hasCategory) missingFields.push('question.categoria/domanda.categoria');
                    
                    logger.error('Invalid answer structure:', { 
                        answer, 
                        index, 
                        missingFields 
                    });
                    
                    throw new Error(`Invalid answer structure at index ${index}: missing ${missingFields.join(', ')}`);
                }
            });

            // Calcola i punteggi dimensionali
            const scores = this.calculateScores(answers);
            
            // Analizza il pattern di risposta
            const pattern = this.analyzeResponsePattern(answers);
            
            // Genera il profilo cognitivo
            const profile = this.generateProfile(scores);

            logger.debug('Calculation completed:', {
                hasScores: !!scores,
                hasPattern: !!pattern,
                hasProfile: !!profile
            });

            // Format dei risultati - nuova versione
            return {
                punteggiDimensioni: {
                    elaborazione: this._formatDimensionScore('elaborazione', scores.elaborazione || scores.analitico),
                    creativita: this._formatDimensionScore('creativita', scores.creativita || scores.sistematico),
                    preferenzaVisiva: this._formatDimensionScore('preferenzaVisiva', scores.preferenzaVisiva || scores.verbale),
                    decisione: this._formatDimensionScore('decisione', scores.decisione || scores.impulsivo),
                    autonomia: this._formatDimensionScore('autonomia', scores.autonomia || scores.dipendente)
                },
                // Manteniamo anche il formato legacy per retrocompatibilità
                punteggi: {
                    analitico: scores.elaborazione || scores.analitico,
                    sistematico: scores.creativita || scores.sistematico,
                    verbale: scores.preferenzaVisiva || scores.verbale,
                    impulsivo: scores.decisione || scores.impulsivo,
                    dipendente: scores.autonomia || scores.dipendente
                },
                metadataCSI: {
                    versioneAlgoritmo: this.version,
                    calcolatoIl: new Date(),
                    pattern,
                    profiloCognitivo: profile
                }
            };
        } catch (error) {
            logger.error('Error calculating test result:', { 
                error: error.message,
                stack: error.stack,
                sampleAnswer: answers[0] 
            });
            throw createError(
                ErrorTypes.PROCESSING.CALCULATION_ERROR,
                'Errore nel calcolo del risultato del test',
                { originalError: error.message }
            );
        }
    }

    /**
     * Analizza il pattern di risposta
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Pattern di risposta
     */
    analyzeResponsePattern(answers) {
        try {
            const timePattern = this._analyzeTimePattern(answers);
            const consistency = this._calculateConsistency(answers);
            const validity = this._validateResponses(answers);

            // Aggiungiamo analisi della varianza per le dimensioni
            const dimensionalVariance = this._analyzeDimensionalVariance(answers);

            return {
                isValid: validity.isValid,
                consistency,
                timePattern,
                dimensionalVariance,
                warnings: [...validity.warnings, ...timePattern.warnings, ...dimensionalVariance.warnings]
            };
        } catch (error) {
            logger.error('Error analyzing response pattern:', { error });
            throw error;
        }
    }

    /**
     * Calcola i punteggi per ogni dimensione
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Punteggi per ogni dimensione
     */
    calculateScores(answers) {
        try {
            // Mappa le risposte per categoria
            const mappedAnswers = this._mapAnswersToCategories(answers);
            
            logger.debug('Mapped answers:', {
                count: mappedAnswers.length,
                categories: [...new Set(mappedAnswers.map(a => a.categoria))],
                sampleMapped: mappedAnswers[0]
            });

            // Risultati sia nel formato nuovo che in quello legacy per retrocompatibilità
            const result = {};
            
            // Calcola i punteggi per le dimensioni nel nuovo formato
            Object.keys(this.dimensions).forEach(dimensionKey => {
                const dimension = this.dimensions[dimensionKey];
                const categoryName = dimension.name;
                result[dimensionKey] = this._calculateDimensionScore(mappedAnswers, categoryName);
            });
            
            // Aggiungi anche i punteggi nel formato legacy
            Object.entries(this.legacyMapping).forEach(([categoryName, legacyDimension]) => {
                if (!result[legacyDimension]) {
                    result[legacyDimension] = this._calculateDimensionScore(mappedAnswers, categoryName);
                }
            });
            
            return result;
        } catch (error) {
            logger.error('Error calculating scores:', {
                error: error.message,
                stack: error.stack,
                answersCount: answers.length
            });
            throw error;
        }
    }

    /**
     * Formatta il punteggio di una dimensione
     * @param {string} dimension - Nome della dimensione
     * @param {number} score - Punteggio
     * @returns {Object} Punteggio formattato
     * @private
     */
    _formatDimensionScore(dimension, score) {
        const level = this._determineLevel(score);
        const dimInfo = this.dimensions[dimension] || {
            name: dimension,
            leftExtreme: 'Sinistra',
            rightExtreme: 'Destra',
            description: 'Dimensione generica'
        };
        
        // Determina l'interpretazione basata sul punteggio
        let interpretation;
        if (score < this.thresholds.low) {
            interpretation = dimInfo.interpretations?.low;
        } else if (score < this.thresholds.high) {
            interpretation = dimInfo.interpretations?.medium;
        } else {
            interpretation = dimInfo.interpretations?.high;
        }
        
        // Se l'interpretazione non è disponibile, usa il metodo legacy
        if (!interpretation) {
            interpretation = this._getInterpretation(dimension, level);
        }
        
        return {
            score,
            level,
            interpretation,
            leftExtreme: dimInfo.leftExtreme,
            rightExtreme: dimInfo.rightExtreme
        };
    }

    /**
     * Calcola il punteggio per una categoria specifica
     * @param {Array} answers - Array di oggetti risposta
     * @param {string} dimension - Nome della dimensione
     * @returns {number} Punteggio normalizzato
     * @private
     */
    _calculateDimensionScore(answers, dimension) {
        try {
            const dimensionAnswers = answers.filter(a => a.categoria === dimension);

            if (dimensionAnswers.length === 0) {
                logger.warn(`No answers found for dimension ${dimension}`);
                return 0;
            }

            // Calcola il punteggio grezzo
            const rawScore = dimensionAnswers.reduce((total, answer) => {
                // Gestisce la polarità della domanda
                const value = answer.polarity === '+' ? 
                    answer.value : 
                    (6 - answer.value); // Inverte il punteggio per domande negative

                // Applica il peso della domanda
                return total + (value * (answer.peso || 1));
            }, 0);

            // Calcola il punteggio massimo possibile per questa dimensione
            const maxPossibleScore = dimensionAnswers.reduce((total, answer) => 
                total + (this.responseRange.max * (answer.peso || 1)), 0);
                
            // Calcola il punteggio minimo possibile per questa dimensione
            const minPossibleScore = dimensionAnswers.reduce((total, answer) => 
                total + (this.responseRange.min * (answer.peso || 1)), 0);

            // Normalizza il punteggio su scala 0-100
            const normalizedScore = Math.round(
                ((rawScore - minPossibleScore) / (maxPossibleScore - minPossibleScore)) * 
                (this.normalization.scaleMax - this.normalization.scaleMin) + 
                this.normalization.scaleMin
            );

            logger.debug(`Dimension score calculated for ${dimension}:`, {
                rawScore,
                minPossibleScore,
                maxPossibleScore,
                normalizedScore,
                answersCount: dimensionAnswers.length
            });

            return normalizedScore;
        } catch (error) {
            logger.error(`Error calculating dimension score for ${dimension}:`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Calcola il range teorico per un numero di domande
     * @param {number} numberOfQuestions - Numero di domande
     * @returns {Object} Range teorico
     * @private
     */
    _calculateTheoreticalRange(numberOfQuestions) {
        return {
            min: this.responseRange.min * numberOfQuestions, // Somma dei minimi possibili
            max: this.responseRange.max * numberOfQuestions  // Somma dei massimi possibili
        };
    }

    /**
     * Determina gli stili dominanti
     * @param {Object} scores - Punteggi delle dimensioni
     * @returns {Array} Stili dominanti
     * @private
     */
    _determineDominantStyles(scores) {
        // Soglia per considerare uno stile come dominante - consideriamo lo scostamento dal centro
        const threshold = 15; // scostamento minimo dal centro (50)
        const dominantStyles = [];
        
        // Verifica ogni dimensione
        Object.entries(scores).forEach(([key, score]) => {
            // Salta le dimensioni che non sono nel formato nuovo
            if (!this.dimensions[key] && !Object.values(this.legacyMapping).includes(key)) {
                return;
            }
            
            // Calcola lo scostamento dal centro
            const deviation = Math.abs(score.score - this.normalization.scaleCenter);
            
            // Se lo scostamento è significativo
            if (deviation >= threshold) {
                // Trova il nome della dimensione e la direzione
                const dimension = this.dimensions[key] || 
                                this._findDimensionByLegacyName(key);
                
                if (!dimension) return;
                
                // Determina la direzione
                const direction = score.score > this.normalization.scaleCenter ? 
                                dimension.rightExtreme : 
                                dimension.leftExtreme;
                
                // Aggiungi lo stile dominante
                dominantStyles.push(`${dimension.name} (${direction})`);
            }
        });
        
        return dominantStyles;
    }
    
    /**
     * Trova la dimensione dal nome legacy
     * @param {string} legacyName - Nome legacy della dimensione
     * @returns {Object} Dimensione
     * @private
     */
    _findDimensionByLegacyName(legacyName) {
        const categoryEntry = Object.entries(this.legacyMapping)
            .find(([_, legacy]) => legacy === legacyName);
        
        if (!categoryEntry) return null;
        
        const categoryName = categoryEntry[0];
        const dimensionEntry = Object.entries(this.dimensions)
            .find(([_, dim]) => dim.name === categoryName);
        
        return dimensionEntry ? dimensionEntry[1] : null;
    }

    /**
     * Genera raccomandazioni in base ai punteggi
     * @param {Object} scores - Punteggi delle dimensioni
     * @returns {Array} Raccomandazioni
     * @private
     */
    _generateRecommendations(scores) {
        const recommendations = [];
        
        // Raccomandazione generale
        recommendations.push('Esplora strategie di apprendimento variegate che si adattino al tuo stile cognitivo specifico.');
        
        // Raccomandazioni per dimensione
        Object.entries(scores).forEach(([key, data]) => {
            // Salta le dimensioni che non sono nel formato nuovo e non hanno un mapping legacy
            if (!this.dimensions[key] && !Object.values(this.legacyMapping).includes(key)) {
                return;
            }
            
            const score = data.score;
            
            // Trova la dimensione
            const dimension = this.dimensions[key] || 
                            this._findDimensionByLegacyName(key);
            
            if (!dimension || !dimension.recommendations) return;
            
            // Determina il livello per le raccomandazioni
            let level;
            if (score < this.thresholds.low) {
                level = 'low';
            } else if (score < this.thresholds.high) {
                level = 'medium';
            } else {
                level = 'high';
            }
            
            // Aggiungi raccomandazioni specifiche per questa dimensione e livello
            const dimRecs = dimension.recommendations[level] || [];
            if (dimRecs.length > 0) {
                const randomIndex = Math.floor(Math.random() * dimRecs.length);
                recommendations.push(dimRecs[randomIndex]);
            }
        });
        
        // Aggiungi una raccomandazione generale alla fine
        recommendations.push('Ricorda che gli stili cognitivi non sono fissi e possono essere sviluppati con la pratica e l\'esperienza in diversi contesti.');
        
        return recommendations;
    }

    /**
     * Genera l'interpretazione globale del profilo
     * @param {Object} scores - Punteggi delle dimensioni
     * @param {Array} dominantStyles - Stili dominanti
     * @returns {string} Interpretazione globale
     * @private
     */
    _generateGlobalInterpretation(scores, dominantStyles) {
        if (dominantStyles.length === 0) {
            return "Il tuo profilo cognitivo è relativamente equilibrato, senza forti polarizzazioni " +
                   "verso specifiche dimensioni. Questa versatilità ti permette di adattarti a diversi " +
                   "contesti di apprendimento e risoluzione dei problemi.";
        }

        let interpretation = `Il tuo profilo cognitivo mostra `;
        
        if (dominantStyles.length === 1) {
            interpretation += `una chiara tendenza verso ${dominantStyles[0]}. `;
        } else {
            const lastStyle = dominantStyles.pop();
            interpretation += `tendenze marcate verso ${dominantStyles.join(', ')} e ${lastStyle}. `;
            dominantStyles.push(lastStyle); // Ripristina l'array originale
        }
        
        interpretation += `Questi stili influenzano il modo in cui elabori le informazioni, prendi decisioni ` +
                         `e interagisci con l'ambiente di apprendimento. Riconoscere questi pattern può ` +
                         `aiutarti a ottimizzare il tuo approccio all'apprendimento e alla risoluzione dei problemi.`;
        
        return interpretation;
    }

    /**
     * Valida le risposte
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Risultato della validazione
     * @private
     */
    _validateResponses(answers) {
        const warnings = [];
        let isValid = true;
        
        // Conta le risposte per ogni valore
        const valueCounts = answers.reduce((counts, answer) => {
            const value = answer.value || answer.valore;
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});
        
        // Verifica se c'è una distribuzione anomala di risposte
        const totalAnswers = answers.length;
        Object.entries(valueCounts).forEach(([value, count]) => {
            // Se più del 70% delle risposte sono uguali, è sospetto
            if (count / totalAnswers > 0.7) {
                warnings.push(`Pattern sospetto: ${count} risposte con valore ${value} (${Math.round(count/totalAnswers*100)}% del totale)`);
                isValid = false;
            }
        });
        
        // Verifica i tempi di risposta
        answers.forEach((answer, index) => {
            const time = answer.timeSpent || answer.tempoRisposta;
            
            if (time < this.responseTime.suspicious) {
                warnings.push(`Risposta ${index+1} troppo rapida (${time}ms)`);
                isValid = isValid && (time >= this.responseTime.min); // Non invalidare se è sopra il minimo
            }
            
            if (time > this.responseTime.max) {
                warnings.push(`Risposta ${index+1} troppo lenta (${time}ms)`);
                // Non invalidare per risposte lente, potrebbero essere legittime (interruzioni)
            }
        });
        
        return { isValid, warnings };
    }

    /**
     * Normalizza un punteggio su scala 0-100
     * @param {number} score - Punteggio grezzo
     * @param {Object} range - Range teorico
     * @returns {number} Punteggio normalizzato
     * @private
     */
    _normalizeScore(score, range) {
        // Normalizza il punteggio sulla scala 0-100 usando il range teorico
        const normalized = ((score - range.min) / (range.max - range.min)) * 
                          (this.normalization.scaleMax - this.normalization.scaleMin) + 
                          this.normalization.scaleMin;
        return Math.round(normalized);
    }

    /**
     * Mappa le risposte per categoria
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Array} Risposte mappate
     * @private
     */
    _mapAnswersToCategories(answers) {
        logger.debug('Raw answers received:', {
            count: answers.length,
            sampleAnswer: answers[0],
            structure: answers[0] ? Object.keys(answers[0]) : []
        });
    
        return answers.map(answer => {
            // Supporta entrambi i formati: domanda/question e value/valore
            const questionData = answer.domanda || answer.question || {};
            const value = 'value' in answer ? answer.value : answer.valore;
            const timeSpent = 'timeSpent' in answer ? answer.timeSpent : answer.tempoRisposta;
            
            // Verifica che i dati essenziali siano presenti
            if (questionData.categoria === undefined) {
                logger.error('Missing categoria in answer:', { answer });
                throw new Error('Struttura risposta non valida: manca categoria');
            }
    
            return {
                value: value,
                timeSpent: timeSpent,
                categoria: questionData.categoria,
                peso: questionData.peso || 1,
                polarity: questionData.polarity || '+'
            };
        });
    }
    
    /**
     * Determina il livello in base al punteggio
     * @param {number} score - Punteggio
     * @returns {string} Livello
     * @private
     */
    _determineLevel(score) {
        if (score >= this.thresholds.high) return 'Alto';
        if (score >= this.thresholds.mediumHigh) return 'Medio-Alto';
        if (score >= this.thresholds.medium) return 'Medio';
        if (score >= this.thresholds.mediumLow) return 'Medio-Basso';
        if (score >= this.thresholds.low) return 'Basso';
        return 'Molto Basso';
    }

    /**
     * Determina lo stile dominante
     * @param {Object} scores - Punteggi delle dimensioni
     * @returns {Array} Stili dominanti
     * @private
     */
    _determineDominantStyle(scores) {
        const maxScore = Math.max(...Object.values(scores));
        return Object.entries(scores)
            .filter(([_, score]) => score === maxScore)
            .map(([dim]) => dim);
    }

    /**
     * Genera interpretazione per una dimensione (metodo legacy)
     * @param {string} dimension - Nome della dimensione
     * @param {string} level - Livello
     * @returns {string} Interpretazione
     * @private
     */
    _getInterpretation(dimension, level) {
        // Mappa i livelli per la retrocompatibilità
        const simplifiedLevel = level.includes('Alto') ? 'alto' : 
                               level.includes('Medio') ? 'medio' : 'basso';
        
        // Mappa per retrocompatibilità vecchie -> nuove dimensioni
        const dimensionMapping = {
            'analitico': 'elaborazione',
            'sistematico': 'creativita',
            'verbale': 'preferenzaVisiva',
            'impulsivo': 'decisione',
            'dipendente': 'autonomia'
        };
        
        // Cerca informazioni sulla dimensione
        const mappedDimension = dimensionMapping[dimension] || dimension;
        const dimensionInfo = this.dimensions[mappedDimension];
        
        if (dimensionInfo && dimensionInfo.interpretations && 
            dimensionInfo.interpretations[simplifiedLevel]) {
            return dimensionInfo.interpretations[simplifiedLevel];
        }
        
        // Interpretazioni fallback
        const interpretations = {
            elaborazione: {
                alto: "Forte preferenza per un approccio dettagliato e metodico",
                medio: "Bilanciamento tra analisi dei dettagli e visione d'insieme",
                basso: "Tendenza a preferire una visione globale"
            },
            creativita: {
                alto: "Forte preferenza per approcci strutturati e pianificati",
                medio: "Bilanciamento tra pianificazione e spontaneità",
                basso: "Tendenza a preferire approcci intuitivi e flessibili"
            },
            preferenzaVisiva: {
                alto: "Forte preferenza per l'apprendimento attraverso il testo scritto",
                medio: "Bilanciamento tra apprendimento visivo e verbale",
                basso: "Tendenza a preferire l'apprendimento attraverso elementi visivi"
            },
            decisione: {
                alto: "Tendenza a prendere decisioni rapide e immediate",
                medio: "Bilanciamento tra riflessione e azione immediata",
                basso: "Forte tendenza alla riflessione prima dell'azione"
            },
            autonomia: {
                alto: "Preferenza per guidance e supporto esterno",
                medio: "Bilanciamento tra autonomia e necessità di supporto",
                basso: "Forte autonomia e indipendenza nell'apprendimento"
            },
            
            // Mappings legacy
            analitico: {
                alto: "Forte preferenza per un approccio dettagliato e metodico",
                medio: "Bilanciamento tra analisi dei dettagli e visione d'insieme",
                basso: "Tendenza a preferire una visione globale"
            },
            sistematico: {
                alto: "Forte preferenza per approcci strutturati e pianificati",
                medio: "Bilanciamento tra pianificazione e spontaneità",
                basso: "Tendenza a preferire approcci intuitivi e flessibili"
            },
            verbale: {
                alto: "Forte preferenza per l'apprendimento attraverso il testo scritto",
                medio: "Bilanciamento tra apprendimento visivo e verbale",
                basso: "Tendenza a preferire l'apprendimento attraverso elementi visivi"
            },
            impulsivo: {
                alto: "Tendenza a prendere decisioni rapide e immediate",
                medio: "Bilanciamento tra riflessione e azione immediata",
                basso: "Forte tendenza alla riflessione prima dell'azione"
            },
            dipendente: {
                alto: "Preferenza per guidance e supporto esterno",
                medio: "Bilanciamento tra autonomia e necessità di supporto",
                basso: "Forte autonomia e indipendenza nell'apprendimento"
            }
        };
    
        return interpretations[dimension]?.[simplifiedLevel] || 
            "Interpretazione non disponibile per questa dimensione";
    }

    /**
     * Calcola la consistenza delle risposte
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Consistenza
     * @private
     */
    _calculateConsistency(answers) {
        if (!answers || answers.length === 0) return {
            isConsistent: false,
            timeConsistency: false,
            confidence: 0
        };
    
        // Calcola deviazione standard dei tempi di risposta
        const times = answers.map(a => a.timeSpent || a.tempoRisposta);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
    
        // Analizza pattern di risposta
        const values = answers.map(a => a.value || a.valore);
        const uniqueValues = new Set(values);
        const hasVariation = uniqueValues.size > 1;
        const hasExtremesOnly = values.every(v => v === 1 || v === 5);
        const hasMiddleAnswersOnly = values.every(v => v === 3);
        
        // Log per debug
        logger.debug('Consistency analysis:', {
            avgTime,
            stdDev,
            uniqueValues: Array.from(uniqueValues),
            hasVariation,
            hasExtremesOnly,
            hasMiddleAnswersOnly
        });
    
        // Calcola indice di consistenza - tiene conto di:
        // 1. Variazione nelle risposte (valori diversi usati)
        // 2. Uso di valori estremi soltanto
        // 3. Uso del valore centrale soltanto
        // 4. Consistenza temporale (tempi di risposta)
        const valueConsistency = hasVariation && !hasExtremesOnly && !hasMiddleAnswersOnly;
        const timeConsistency = stdDev < avgTime * 0.7; // Deviazione standard non troppo alta
        
        // Calcola un punteggio di confidenza
        let confidence = 0.5; // Base
        if (valueConsistency) confidence += 0.25;
        if (timeConsistency) confidence += 0.25;
        if (hasMiddleAnswersOnly) confidence -= 0.3;
        if (hasExtremesOnly) confidence -= 0.3;
        
        // Limita tra 0 e 1
        confidence = Math.max(0, Math.min(1, confidence));
    
        return {
            isConsistent: valueConsistency,
            timeConsistency,
            confidence,
            metrics: {
                uniqueValuesCount: uniqueValues.size,
                totalQuestions: answers.length,
                avgTimePerQuestion: Math.round(avgTime / 1000), // in secondi
                timeDeviation: Math.round(stdDev / 1000) // in secondi
            }
        };
    }
    
    /**
     * Analizza la varianza tra le diverse dimensioni
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Analisi della varianza
     * @private
     */
    _analyzeDimensionalVariance(answers) {
        try {
            const mappedAnswers = this._mapAnswersToCategories(answers);
            const dimensionalScores = {};
            const warnings = [];
            
            // Calcola punteggi per ogni dimensione
            Object.keys(this.dimensions).forEach(dimKey => {
                const dimension = this.dimensions[dimKey];
                const score = this._calculateDimensionScore(mappedAnswers, dimension.name);
                dimensionalScores[dimKey] = score;
            });
            
            // Calcola varianza dei punteggi dimensionali
            const scores = Object.values(dimensionalScores);
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / scores.length;
            const stdDev = Math.sqrt(variance);
            
            // Verifica se c'è poca varianza tra le dimensioni (tutte molto simili)
            if (stdDev < 5) {
                warnings.push('Poca differenziazione tra le dimensioni. Il profilo potrebbe non riflettere accuratamente le preferenze cognitive.');
            }
            
            return {
                averageScore: avgScore,
                standardDeviation: stdDev,
                hasSignificantVariance: stdDev >= 5,
                warnings
            };
        } catch (error) {
            logger.error('Error in dimensional variance analysis:', error);
            return {
                hasSignificantVariance: true, // Assume true in caso di errore
                warnings: []
            };
        }
    }
    
    /**
     * Analizza il pattern temporale delle risposte
     * @param {Array} answers - Array di oggetti risposta
     * @returns {Object} Analisi temporale
     * @private
     */
    _analyzeTimePattern(answers) {
        // Estrai tempi di risposta supportando entrambi i formati
        const times = answers.map(a => a.timeSpent || a.tempoRisposta);
        
        // Calcola statistiche di base
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const tooFastResponses = times.filter(t => t < this.responseTime.suspicious).length;
        const warnings = [];

        // Verifica se troppe risposte sono troppo veloci
        if (tooFastResponses > answers.length * 0.2) {
            warnings.push(`Troppe risposte rapide rilevate (${tooFastResponses} su ${answers.length})`);
        }
        
        // Calcola mediana per identificare outlier
        const sortedTimes = [...times].sort((a, b) => a - b);
        const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
        
        // Conta outlier (risposte molto più lente della mediana)
        const outlierThreshold = median * 3;
        const outlierCount = times.filter(t => t > outlierThreshold).length;
        
        if (outlierCount > 0) {
            warnings.push(`Rilevate ${outlierCount} risposte con tempi anomali (molto più lunghe della mediana)`);
        }

        return {
            averageTime: avgTime,
            medianTime: median,
            suspicious: tooFastResponses > Math.min(5, answers.length * 0.2),
            tooFastResponses,
            outlierResponses: outlierCount,
            warnings,
            pattern: {
                consistent: this._checkTimeConsistency(times),
                avgTimePerQuestion: Math.round(avgTime / 1000) // in secondi
            }
        };
    }

    /**
     * Verifica la consistenza dei tempi
     * @param {Array} times - Array di tempi
     * @returns {boolean} Consistenza
     * @private
     */
    _checkTimeConsistency(times) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const stdDev = Math.sqrt(
            times.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / times.length
        );
        // Se la deviazione standard è minore del 50% della media, consideriamo i tempi consistenti
        return stdDev < avg * 0.5;
    }

    /**
     * Genera il profilo cognitivo
     * @param {Object} scores - Punteggi delle dimensioni
     * @returns {Object} Profilo cognitivo
     */
    generateProfile(scores) {
        // Prepariamo i punteggi formattati per l'analisi
        const formattedScores = {};
        
        // Converti i punteggi al formato usato dai metodi di analisi
        Object.entries(scores).forEach(([key, value]) => {
            // Per i punteggi già in formato oggetto
            if (typeof value === 'object' && value.score !== undefined) {
                formattedScores[key] = value;
            } else {
                // Per i punteggi in formato numerico
                formattedScores[key] = {
                    score: value,
                    level: this._determineLevel(value)
                };
            }
        });
        
        // Determina gli stili dominanti
        const dominantStyles = this._determineDominantStyles(formattedScores);
        
        // Genera raccomandazioni personalizzate
        const recommendations = this._generateRecommendations(formattedScores);
        
        // Crea l'interpretazione globale
        const globalInterpretation = this._generateGlobalInterpretation(formattedScores, dominantStyles);
        
        return {
            stiliDominanti: dominantStyles,
            raccomandazioni: recommendations,
            interpretazioneGlobale: globalInterpretation
        };
    }
}

module.exports = CSIScorer;