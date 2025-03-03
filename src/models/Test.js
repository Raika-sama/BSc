// src/models/Test.js
const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

// Mappa dei modelli di domande per tipo di test
const TEST_QUESTION_MODELS = {
    'CSI': 'CSIQuestion',
    'FUTURE_TEST_1': 'FutureTest1Question',
    'FUTURE_TEST_2': 'FutureTest2Question'
};

const availableQuestionModels = ['CSIQuestion', 'FutureTestQuestion'];

const questionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    testo: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['likert', 'multipla', 'aperta']
    },
    categoria: {
        type: String,
        required: true
    },
    opzioni: [{
        type: String
    }],
    peso: {
        type: Number,
        default: 1
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    _id: false
});

const testSchema = new mongoose.Schema({
    nome: {
        type: String,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['CSI', 'FUTURE_TEST_1', 'FUTURE_TEST_2']
    },
    descrizione: {
        type: String,
        trim: true
    },
    domande: [{
        questionRef: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'domande.questionModel'
        },
        questionModel: {
            type: String,
            required: true,
            enum: ['CSIQuestion', 'FutureTestQuestion']
        },
        originalQuestion: questionSchema,
        order: Number,
        version: String
    }],
    configurazione: {
        tempoLimite: Number,
        tentativiMax: Number,
        cooldownPeriod: Number,
        randomizzaDomande: Boolean,
        mostraRisultatiImmediati: Boolean,
        istruzioni: String,
        metadataSchema: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        questionVersion: {
            type: String,
            required: true,
            default: '1.0.0'
        },
        // Aggiungi questo campo
        configRef: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'tipo'
        }
    },
    versione: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    
        token: {
          type: String,
          unique: true,
          sparse: true,  // Permette null/undefined
          index: true
        },
        tokenEnabled: {
          type: Boolean,
          default: false  // Di default usiamo il nuovo sistema
        },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    risposte: [{
        questionId: Number,
        value: Number,
        timeSpent: Number,
        categoria: String,
        timestamp: Date
    }],
    active: {
        type: Boolean,
        default: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
    },
    attempts: {
        type: Number,
        default: 0
    },
    csiConfig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CSIConfig',
        required: function() {
            return this.tipo === 'CSI';
        }
    }
}, {
    timestamps: true
});

// Indici
testSchema.index({ tipo: 1, active: 1 });
testSchema.index({ 'configurazione.questionVersion': 1 });

// Middleware di validazione pre-save
testSchema.pre('save', async function(next) {
    try {
        // Verifica che i modelli delle domande esistano
        const registeredModels = mongoose.modelNames();
        for (const domanda of this.domande) {
            if (domanda.questionModel && !registeredModels.includes(domanda.questionModel)) {
                logger.warn(`Model ${domanda.questionModel} non registrato durante il salvataggio del test`);
                // Non blocchiamo il salvataggio, ma logghiamo un warning
            }
        }
        next();
    } catch (error) {
        logger.error('Error in test pre-save middleware:', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
});

// Middleware per populate migliorato con gestione degli errori e logging dettagliato
testSchema.pre(/^find/, function(next) {
    try {
        // Log dello stato iniziale
        logger.debug('Test pre-find middleware called:', {
            operationType: this.op,
            queryConditions: this.getQuery(),
            populateOptions: this.options?.populate,
            hasPopulateQuestions: this.options?.populateQuestions
        });

        // Se l'opzione populateQuestions è impostata esplicitamente a false, non facciamo populate
        if (this.options && this.options.populateQuestions === false) {
            logger.debug('Skipping populate for query with populateQuestions=false');
            return next();
        }

        // Verifica che i modelli necessari siano registrati
        const registeredModels = mongoose.modelNames();
        logger.debug('Current registered models:', {
            models: registeredModels,
            hasCSIQuestion: registeredModels.includes('CSIQuestion'),
            hasFutureTestQuestion: registeredModels.includes('FutureTestQuestion')
        });

        // Ottieni il tipo di test dalla query se disponibile
        const testType = this.getQuery().tipo;
        
        // Log del tipo di test e modello corrispondente
        logger.debug('Test type detection:', {
            testType,
            expectedModel: testType ? TEST_QUESTION_MODELS[testType] : 'unknown'
        });

        // Determina il modello da usare in base al tipo di test
        let modelToUse = null;
        if (testType && TEST_QUESTION_MODELS[testType]) {
            // Se il tipo è specificato e abbiamo un modello corrispondente, verifica che sia registrato
            const expectedModel = TEST_QUESTION_MODELS[testType];
            if (registeredModels.includes(expectedModel)) {
                modelToUse = expectedModel;
            }
        }

        // Se non abbiamo trovato un modello specifico, usa CSIQuestion come fallback se disponibile
        if (!modelToUse && registeredModels.includes('CSIQuestion')) {
            modelToUse = 'CSIQuestion';
            logger.debug('Using CSIQuestion as fallback model');
        }

        // Se non abbiamo nessun modello disponibile, salta il populate
        if (!modelToUse) {
            logger.warn('No suitable question model found, skipping populate', {
                testType,
                availableModels: registeredModels
            });
            return next();
        }

        // Configura il populate
        const populateOptions = {
            path: 'domande.questionRef',
            model: modelToUse,
            options: { lean: true },
            match: { active: true }
        };

        this.populate(populateOptions);
        
        logger.debug('Populate configuration applied:', {
            options: populateOptions,
            modelUsed: modelToUse,
            query: this.getQuery()
        });

        next();
    } catch (error) {
        logger.error('Error in Test populate middleware:', {
            error: error.message,
            stack: error.stack,
            query: this.getQuery(),
            modelNames: mongoose.modelNames()
        });
        // Non blocchiamo la query anche in caso di errore nel populate
        next();
    }
});

// Metodo per calcolare tempo rimanente
testSchema.methods.getTempoRimanente = function(dataInizio) {
    if (!this.configurazione.tempoLimite) return null;
    const tempoPassato = (Date.now() - dataInizio) / 60000;
    return Math.max(0, this.configurazione.tempoLimite - tempoPassato);
};

const Test = mongoose.model('Test', testSchema);

module.exports = Test;