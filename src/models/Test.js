// src/models/Test.js
const mongoose = require('mongoose');

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
        }
    },
    versione: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indici
testSchema.index({ tipo: 1, active: 1 });
testSchema.index({ 'configurazione.questionVersion': 1 });

// Middleware per populate automatico delle domande
testSchema.pre(/^find/, function(next) {
    if (this.options.populateQuestions !== false) {
        this.populate({
            path: 'domande.questionRef',
            model: '$domande.questionModel'
        });
    }
    next();
});

// Middleware di validazione
testSchema.pre('save', function(next) {
    if (this.tipo === 'CSI' && !this.configurazione.metadataSchema) {
        this.configurazione.metadataSchema = {
            categorie: ['Analitico/Globale', 'Sistematico/Intuitivo', 
                       'Verbale/Visivo', 'Impulsivo/Riflessivo', 
                       'Dipendente/Indipendente'],
            scaleLikert: 5,
            pesoDefault: 1
        };
    }
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