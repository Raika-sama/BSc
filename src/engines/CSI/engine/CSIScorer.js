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

        this.dimensions = {
            ANALITICO: 'Analitico/Globale',
            SISTEMATICO: 'Sistematico/Intuitivo',
            VERBALE: 'Verbale/Visivo',
            IMPULSIVO: 'Impulsivo/Riflessivo',
            DIPENDENTE: 'Dipendente/Indipendente'
        };
        this.thresholds = {
            low: 33,    // Sotto il 33% = livello basso
            medium: 66  // Tra 33% e 66% = livello medio, sopra 66% = livello alto
        };
    }

    /**
     * Calcola il punteggio per ogni dimensione
     * @param {Array} answers - Array di risposte con riferimenti alle domande
     * @returns {Object} Punteggi per ogni dimensione
     */
    calculateScores(answers) {
        try {
            // Mappa le risposte alle dimensioni corrette
            const mappedAnswers = answers.map(answer => ({
                ...answer,
                question: {
                    ...answer.question,
                    categoria: this.categoryMapping[answer.question.categoria] || answer.question.categoria
                }
            }));

            const scores = {
                analitico: this._calculateDimensionScore(mappedAnswers, 'analitico'),
                sistematico: this._calculateDimensionScore(mappedAnswers, 'sistematico'),
                verbale: this._calculateDimensionScore(mappedAnswers, 'verbale'),
                impulsivo: this._calculateDimensionScore(mappedAnswers, 'impulsivo'),
                dipendente: this._calculateDimensionScore(mappedAnswers, 'dipendente')
            };

            // Normalizza i punteggi
            Object.keys(scores).forEach(dim => {
                scores[dim] = this._normalizeScore(scores[dim]);
            });

            return scores;
        } catch (error) {
            logger.error('Error calculating CSI scores', { error });
            throw error;
        }
    }

    /**
     * Calcola il punteggio per una singola dimensione
     * @private
     */
    _calculateDimensionScore(answers, dimension) {
        const dimensionAnswers = answers.filter(a => 
            a.question.categoria === dimension
        );

        if (dimensionAnswers.length === 0) return 0;

        const score = dimensionAnswers.reduce((total, answer) => {
            const value = answer.question.polarity === '+' ? 
                answer.value : 
                (6 - answer.value); // Inverti punteggio per domande negative

            return total + (value * (answer.question.peso || 1));
        }, 0);

        return score / dimensionAnswers.length;
    }

    /**
     * Normalizza un punteggio su scala 0-100
     * @private
     */
    _normalizeScore(score) {
        return Math.round((score / 5) * 100);
    }

    /**
     * Genera il profilo dello studente basato sui punteggi
     * @param {Object} scores - Punteggi calcolati
     * @returns {Object} Profilo dettagliato
     */
    generateProfile(scores) {
        const profile = {
            dimensions: {},
            dominantStyle: this._determineDominantStyle(scores),
            recommendations: []
        };

        // Genera le dimensioni del profilo con valori numerici
        Object.entries(scores).forEach(([dimension, score]) => {
            profile.dimensions[dimension] = {
                score: score, // Assicuriamoci che sia un numero
                level: this._determineLevel(score),
                interpretation: this._getInterpretation(dimension, score)
            };
        });

        // Aggiungi raccomandazioni
        Object.entries(scores).forEach(([dimension, score]) => {
            profile.recommendations.push(
                ...this._getRecommendations(dimension, score)
            );
        });

        return profile;
    }

    /**
     * Determina il livello per un punteggio
     * @private
     */
    _determineLevel(score) {
        if (score <= this.thresholds.low) return 'basso';
        if (score <= this.thresholds.medium) return 'medio';
        return 'alto';
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
    
    // Implementiamo _analyzeTimePattern
    _analyzeTimePattern(answers) {
        if (!answers || answers.length === 0) {
            return { averageTime: 0, suspicious: true };
        }
    
        const times = answers.map(a => a.timeSpent);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        
        // Identifica risposte troppo veloci (< 1 secondo)
        const tooFastResponses = times.filter(t => t < 1).length;
        const tooFastPercentage = (tooFastResponses / times.length) * 100;
    
        return {
            averageTime: avgTime,
            suspicious: tooFastPercentage > 20, // Suspicious se più del 20% delle risposte sono troppo veloci
            tooFastResponses,
            pattern: {
                consistent: Math.max(...times) - Math.min(...times) < avgTime * 2,
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
     * Analizza il pattern di risposta per validità
     * @param {Array} answers - Array di risposte
     * @returns {Object} Analisi della validità
     */
    analyzeResponsePattern(answers) {
        return {
            isValid: true, // Implementa logica di validazione
            consistency: this._calculateConsistency(answers),
            timePattern: this._analyzeTimePattern(answers),
            warnings: [] // Array di possibili warning
        };
    }

    /**
     * Calcola la consistenza delle risposte
     * @private
     */
    _calculateConsistency(answers) {
        // Implementa logica per verificare la consistenza delle risposte
        return true;
    }

    /**
     * Analizza il pattern temporale delle risposte
     * @private
     */
    _analyzeTimePattern(answers) {
        // Implementa analisi dei tempi di risposta
        return {
            averageTime: 0,
            suspicious: false
        };
    }
}

module.exports = CSIScorer;