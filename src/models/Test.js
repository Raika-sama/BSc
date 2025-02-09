// src/models/Test.js
const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

// Prima della definizione dello schema
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
        sparse: true,
        index: true  // importante per le performance
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

// Aggiungi questo pre-save middleware
// Middleware di validazione
// Nel middleware pre-save
testSchema.pre('save', async function(next) {
    // Verifica che i modelli delle domande esistano
    for (const domanda of this.domande) {
        if (!mongoose.modelNames().includes(domanda.questionModel)) {
            throw new Error(`Model ${domanda.questionModel} non registrato`);
        }
    }
    next();
});

// Nel middleware per populate
testSchema.pre(/^find/, function(next) {
    if (this.options.populateQuestions === false) {
        return next();
    }

    // Verifica che i modelli necessari siano registrati
    const registeredModels = mongoose.modelNames();
    const populateOptions = {
        path: 'domande.questionRef',
        model: function(doc) {
            const modelName = doc.questionModel || 'CSIQuestion';
            // Verifica che il modello sia disponibile
            if (!registeredModels.includes(modelName)) {
                return 'CSIQuestion'; // Fallback al modello di default
            }
            return modelName;
        }
    };

    this.populate(populateOptions);
    next();
});

// Metodo per calcolare tempo rimanente
testSchema.methods.getTempoRimanente = function(dataInizio) {
    if (!this.configurazione.tempoLimite) return null;
    const tempoPassato = (Date.now() - dataInizio) / 60000;
    return Math.max(0, this.configurazione.tempoLimite - tempoPassato);
};

const Test = mongoose.model('Test', testSchema);

module.exports = Test;