// src/models/Test.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
    _id: true
});

const testSchema = new mongoose.Schema({
    nome: {
        type: String,
 //       required: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['CSI', 'FUTURE_TEST_1', 'FUTURE_TEST_2'],
        // Estendibile con nuovi tipi di test
    },
    descrizione: {
        type: String,
        trim: true
    },
    domande: [questionSchema],
    configurazione: {
        tempoLimite: Number,        // in minuti
        tentativiMax: Number,       // numero massimo di tentativi
        cooldownPeriod: Number,     // periodo di attesa tra tentativi (ore)
        randomizzaDomande: Boolean, // se randomizzare l'ordine delle domande
        mostraRisultatiImmediati: Boolean,
        istruzioni: String,
        metadataSchema: {           // schema per metadata specifico del tipo di test
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    },
    versione: {
        type: String,
        required: true,
        default: '1.0.0'
    }
}, {
    timestamps: true
});

const resultSchema = new mongoose.Schema({
    utente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    classe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    scuola: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    risposte: [{
        domanda: {
            type: Number,
            required: true
        },
        risposta: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        tempoRisposta: Number      // tempo in secondi per rispondere
    }],
    punteggi: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: true
    },
    analytics: {
        tempoTotale: Number,       // tempo totale del test in secondi
        domandePerse: Number,      // domande non risposte
        pattern: [Number],         // pattern di risposta per analisi
        metadata: {                // dati specifici per tipo di test
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    },
    completato: {
        type: Boolean,
        default: false
    },
    dataInizio: {
        type: Date,
        default: Date.now
    },
    token: {
        type: String,
        unique: true,
        sparse: true // permette null/undefined
    },
    expiresAt: {
        type: Date
    },
    used: {
        type: Boolean,
        default: false
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    dataCompletamento: Date
}, {
    timestamps: true
});

// Middleware pre-save per validazione
resultSchema.pre('save', function(next) {
    if (!this.token || !this.expiresAt || !this.studentId) {
        const err = new Error('Token, expiresAt e studentId sono richiesti');
        next(err);
    } else {
        next();
    }
});

// Indici per ottimizzazione
testSchema.index({ tipo: 1, stato: 1 });
testSchema.index({ nome: 1 }, { unique: true });

resultSchema.index({ utente: 1, test: 1 });
resultSchema.index({ test: 1, dataCompletamento: -1 });
resultSchema.index({ classe: 1, test: 1 });
resultSchema.index({ scuola: 1, test: 1 });

// Middleware pre-save per validazione
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

// Virtual per stato completamento
resultSchema.virtual('isCompleto').get(function() {
    return this.completato && this.dataCompletamento;
});

// Metodo per calcolare tempo rimanente
testSchema.methods.getTempoRimanente = function(dataInizio) {
    if (!this.configurazione.tempoLimite) return null;
    const tempoPassato = (Date.now() - dataInizio) / 60000; // in minuti
    return Math.max(0, this.configurazione.tempoLimite - tempoPassato);
};

const Test = mongoose.model('Test', testSchema);
const Result = mongoose.model('Result', resultSchema);

module.exports = {
    Test,
    Result
};