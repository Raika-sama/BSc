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
        });

        // Se l'opzione populateQuestions è impostata esplicitamente a false, non facciamo populate
        if (this.options && this.options.populateQuestions === false) {
            logger.debug('Skipping populate for query with populateQuestions=false');
            return next();
        }

        // Se sono richieste esplicitamente le domande tramite opzioni di population specifiche,
        // utilizziamo quelle, altrimenti non facciamo populate automatico
        if (this.options && this.options.populate && 
            (this.options.populate.path === 'domande.questionRef' || 
            (Array.isArray(this.options.populate) && 
            this.options.populate.some(p => p.path === 'domande.questionRef')))) {
            
            logger.debug('Using explicit populate options for questions');
            // Mantieni le opzioni di populate esistenti
            return next();
        }
        
        // Altrimenti, non facciamo alcun populate automatico delle domande
        logger.debug('Using questions directly from test model, skipping question populate');
        next();
    } catch (error) {
        logger.error('Error in Test populate middleware:', {
            error: error.message,
            stack: error.stack,
            query: this.getQuery(),
        });
        // Non blocchiamo la query anche in caso di errore
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