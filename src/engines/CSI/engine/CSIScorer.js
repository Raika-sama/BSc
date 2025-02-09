// src/engines/CSI/engine/CSIScorer.js

const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');

class CSIScorer {
    constructor() {
        this.version = "1.0.0";  // Aggiungiamo versione
        this.categoryMapping = {
            'Elaborazione': 'analitico',
            'Creatività': 'sistematico',
            'Preferenza Visiva': 'verbale',
            'Decisione': 'impulsivo',
            'Autonomia': 'dipendente'
        };

         // Soglie per l'interpretazione
         this.thresholds = {
            veryLow: 20,    // Sotto il 20%
            low: 40,        // 20-40%
            medium: 60,     // 40-60%
            high: 80        // 60-80%, sopra 80% = molto alto
        };

        // Range risposte
        this.responseRange = {
            min: 1,
            max: 5
        };

        // Tempo risposte (ms)
        this.responseTime = {
            min: 2000,      // 2 secondi
            max: 300000,    // 5 minuti
            suspicious: 1000 // risposte sotto 1 secondo sono sospette
        };
    }

/**
     * Calcola il risultato completo del test
     */
calculateTestResult(answers) {
    try {
        logger.debug('Calculating complete test result', {
            answersCount: answers.length,
            sampleAnswer: answers[0]  // Aggiungi per debug
        });

        // Verifica la struttura delle risposte
        if (!Array.isArray(answers) || answers.length === 0) {
            throw new Error('Invalid answers format: must be non-empty array');
        }

        // Verifica la struttura di ogni risposta
        answers.forEach((answer, index) => {
            if (!answer.value || !answer.timeSpent || !answer.question?.categoria) {
                logger.error('Invalid answer structure:', { answer, index });
                throw new Error(`Invalid answer structure at index ${index}`);
            }
        });

        const scores = this.calculateScores(answers);
        const pattern = this.analyzeResponsePattern(answers);
        const profile = this.generateProfile(scores);

        logger.debug('Calculation completed:', {
            hasScores: !!scores,
            hasPattern: !!pattern,
            hasProfile: !!profile
        });

        return {
            punteggiDimensioni: {
                elaborazione: this._formatDimensionScore('elaborazione', scores.analitico),
                creativita: this._formatDimensionScore('creativita', scores.sistematico),
                preferenzaVisiva: this._formatDimensionScore('preferenzaVisiva', scores.verbale),
                decisione: this._formatDimensionScore('decisione', scores.impulsivo),
                autonomia: this._formatDimensionScore('autonomia', scores.dipendente)
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
     */
analyzeResponsePattern(answers) {
    try {
        const timePattern = this._analyzeTimePattern(answers);
        const consistency = this._calculateConsistency(answers);
        const validity = this._validateResponses(answers);

        return {
            isValid: validity.isValid,
            consistency,
            timePattern,
            warnings: [...validity.warnings, ...timePattern.warnings]
        };
    } catch (error) {
        logger.error('Error analyzing response pattern:', { error });
        throw error;
    }
}

/**
 * Calcola i punteggi per ogni dimensione
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

        // Calcola i punteggi per ogni categoria
        return {
            analitico: this._calculateDimensionScore(mappedAnswers, 'Elaborazione'),
            sistematico: this._calculateDimensionScore(mappedAnswers, 'Creatività'),
            verbale: this._calculateDimensionScore(mappedAnswers, 'Preferenza Visiva'),
            impulsivo: this._calculateDimensionScore(mappedAnswers, 'Decisione'),
            dipendente: this._calculateDimensionScore(mappedAnswers, 'Autonomia')
        };
    } catch (error) {
        logger.error('Error calculating scores:', {
            error: error.message,
            stack: error.stack,
            answers: answers.map(a => ({ value: a.value }))
        });
        throw error;
    }
}


    /**
     * Formatta il punteggio di una dimensione
     */
    _formatDimensionScore(dimension, score) {
        const level = this._determineLevel(score);
        return {
            score,
            level,
            interpretation: this._getInterpretation(dimension, level)
        };
    }


 /**
 * Calcola il punteggio per una categoria specifica
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

            // Applica il peso
            return total + (value * (answer.peso || 1));
        }, 0);

        // Calcola il punteggio massimo possibile per questa dimensione
        const maxPossibleScore = dimensionAnswers.reduce((total, answer) => 
            total + (5 * (answer.peso || 1)), 0);

        // Normalizza il punteggio su scala 0-100
        const normalizedScore = Math.round((rawScore / maxPossibleScore) * 100);

        logger.debug(`Dimension score calculated for ${dimension}:`, {
            rawScore,
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


    _calculateTheoreticalRange(numberOfQuestions) {
        return {
            min: this.responseRange.min * numberOfQuestions, // Somma dei minimi possibili
            max: this.responseRange.max * numberOfQuestions  // Somma dei massimi possibili
        };
    }

    _determineDominantStyles(scores) {
        const threshold = 70; // soglia per considerare uno stile dominante
        return Object.entries(scores)
            .filter(([_, score]) => score.score >= threshold)
            .map(([style]) => style);
    }

    _generateRecommendations(scores) {
        const recommendations = [];
        Object.entries(scores).forEach(([dimension, score]) => {
            const dimensionRecs = this._getRecommendations(dimension, score.score);
            recommendations.push(...dimensionRecs);
        });
        return recommendations;
    }

    _generateGlobalInterpretation(scores, dominantStyles) {
        if (dominantStyles.length === 0) {
            return "Nessuno stile di apprendimento dominante identificato";
        }

        return `Stile di apprendimento prevalente: ${dominantStyles.join(', ')}. ` +
               `Si consiglia di focalizzarsi su attività che valorizzino questi aspetti.`;
    }

    _validateResponses(answers) {
        const warnings = [];
        const isValid = answers.every(answer => {
            const isValidTime = answer.tempoRisposta >= this.responseTime.min && 
                              answer.tempoRisposta <= this.responseTime.max;
            const isValidValue = answer.valore >= this.responseRange.min && 
                               answer.valore <= this.responseRange.max;
            
            if (!isValidTime) warnings.push(`Tempo risposta non valido per domanda ${answer.domanda.id}`);
            if (!isValidValue) warnings.push(`Valore risposta non valido per domanda ${answer.domanda.id}`);
            
            return isValidTime && isValidValue;
        });

        return { isValid, warnings };
    }

    /**
     * Normalizza un punteggio su scala 0-100
     * @private
     */
    _normalizeScore(score, range) {
        // Normalizza il punteggio sulla scala 0-100 usando il range teorico
        const normalized = ((score - range.min) / (range.max - range.min)) * 100;
        return Math.round(normalized);
    }

    _mapAnswersToCategories(answers) {
        logger.debug('Raw answers received:', {
            count: answers.length,
            sampleAnswer: answers[0],
            structure: answers[0] ? Object.keys(answers[0]) : []
        });
    
        return answers.map(answer => {
            // Verifica se l'answer ha la struttura corretta
            if (!answer.domanda && !answer.question) {
                logger.error('Missing domanda in answer:', { answer });
                throw new Error('Struttura risposta non valida: manca domanda');
            }
    
            // Usa domanda se disponibile, altrimenti usa question
            const questionData = answer.domanda || answer.question;
    
            return {
                value: answer.value,
                timeSpent: answer.timeSpent,
                categoria: questionData.categoria,
                peso: questionData.peso || 1,
                polarity: questionData.polarity || '+'
            };
        });
    }
    


    /**
     * Determina il livello per un punteggio
     * @private
     */
/**
     * Determina il livello in base al punteggio
     */
_determineLevel(score) {
    if (score >= this.thresholds.high) return 'Alto';
    if (score >= this.thresholds.medium) return 'Medio-Alto';
    if (score >= this.thresholds.low) return 'Medio';
    if (score >= this.thresholds.veryLow) return 'Medio-Basso';
    return 'Basso';
}

    /**
     * Determina lo stile dominante
     * @private
     */
    _determineDominantStyle(scores) {
        const maxScore = Math.max(...Object.values(scores));
        return Object.entries(scores)
            .filter(([_, score]) => score === maxScore)
            .map(([dim]) => dim);
    }

    /**
     * Genera interpretazione per una dimensione
     * @private
     */
    _getInterpretation(dimension, score) {
        const level = this._determineLevel(score);
        const interpretations = {
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
    
        return interpretations[dimension]?.[level] || 
            "Interpretazione non disponibile per questa dimensione";
    }

    _calculateConsistency(answers) {
        if (!answers || answers.length === 0) return 0;
    
        // Calcola deviazione standard dei tempi di risposta
        const times = answers.map(a => a.timeSpent);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
    
        // Analizza pattern di risposta
        const values = answers.map(a => a.value);
        const hasVariation = new Set(values).size > 1;
        const hasExtremesOnly = values.every(v => v === 1 || v === 5);
    
        return {
            isConsistent: !hasExtremesOnly && hasVariation,
            timeConsistency: stdDev < avgTime, // Se la deviazione è minore della media, consideriamo consistente
            confidence: hasVariation ? 1 : 0.5
        };
    }
    
     /**
     * Analizza il pattern temporale delle risposte
     */
     _analyzeTimePattern(answers) {
        const times = answers.map(a => a.tempoRisposta);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const tooFastResponses = times.filter(t => t < this.responseTime.suspicious).length;
        const warnings = [];

        if (tooFastResponses > answers.length * 0.2) {
            warnings.push('Troppe risposte rapide rilevate');
        }

        return {
            averageTime: avgTime,
            suspicious: tooFastResponses > 5,
            tooFastResponses,
            warnings,
            pattern: {
                consistent: this._checkTimeConsistency(times),
                avgTimePerQuestion: avgTime
            }
        };
    }

    /**
     * Genera raccomandazioni basate sui punteggi
     * @private
     */
    _getRecommendations(dimension, score) {
        const level = this._determineLevel(score);
        const recommendations = {
            analitico: {
                alto: [
                    "Utilizza schemi e mappe concettuali dettagliate",
                    "Dividi i compiti complessi in sotto-task"
                ],
                medio: [
                    "Alterna tra analisi dettagliata e visione d'insieme",
                    "Usa sia approcci analitici che sintetici"
                ],
                basso: [
                    "Parti dalla visione d'insieme prima dei dettagli",
                    "Usa rappresentazioni grafiche e mappe mentali"
                ]
            },
            // ... altre dimensioni
        };

        return recommendations[dimension]?.[level] || [];
    }



    /**
     * Verifica la consistenza dei tempi
     */
    _checkTimeConsistency(times) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const stdDev = Math.sqrt(
            times.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / times.length
        );
        return stdDev < avg * 0.5;
    }

    /**
     * Genera il profilo cognitivo
     */
    generateProfile(scores) {
        const dominantStyles = this._determineDominantStyles(scores);
        const recommendations = this._generateRecommendations(scores);

        return {
            stiliDominanti: dominantStyles,
            raccomandazioni: recommendations,
            interpretazioneGlobale: this._generateGlobalInterpretation(scores, dominantStyles)
        };
    }

}

module.exports = CSIScorer;