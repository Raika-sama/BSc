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
    // Rimuoviamo utente e usiamo studentId come campo principale
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
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
        tempoRisposta: Number
    }],
    punteggi: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: function() { return this.completato; }  // Required solo se completato
    },
    analytics: {
        tempoTotale: Number,
        domandePerse: Number,
        pattern: [Number],
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    },
    token: {
        type: String,
        unique: true,
        sparse: true
    },
    expiresAt: {
        type: Date
    },
    used: {
        type: Boolean,
        default: false
    },
    completato: {
        type: Boolean,
        default: false
    },
    dataInizio: {
        type: Date,
        default: Date.now
    },
    dataCompletamento: Date
}, {
    timestamps: true
});

// Middleware pre-save per validazione
resultSchema.pre('save', function(next) {
    // Verifica token e expiresAt solo se uno dei due è presente
    if ((this.token && !this.expiresAt) || (!this.token && this.expiresAt)) {
        const err = new Error('Token e expiresAt devono essere presenti insieme');
        next(err);
    }
    
    // Verifica sempre studentId
    if (!this.studentId) {
        const err = new Error('StudentId è richiesto');
        next(err);
    }
    
    next();
});

// Indici per ottimizzazione
testSchema.index({ tipo: 1, stato: 1 });
//testSchema.index({ nome: 1 }, { unique: true });

//resultSchema.index({ utente: 1, test: 1 });
resultSchema.index({ test: 1, dataCompletamento: -1 });
resultSchema.index({ classe: 1, test: 1 });
resultSchema.index({ scuola: 1, test: 1 });
resultSchema.index({ studentId: 1, test: 1 });     // Indice composto per query che coinvolgono studente e test

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