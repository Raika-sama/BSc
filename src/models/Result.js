// src/models/Result.js
const mongoose = require('mongoose');

// Schema base comune a tutti i risultati
const baseResultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
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
    dataCompletamento: Date,
    analytics: {
        tempoTotale: Number,
        domandePerse: Number,
        pattern: [Number],
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    }
}, { 
    discriminatorKey: 'tipo',
    timestamps: true 
});

// Indici comuni
baseResultSchema.index({ tipo: 1, dataCompletamento: -1 });
baseResultSchema.index({ classe: 1, tipo: 1 });
baseResultSchema.index({ scuola: 1, tipo: 1 });
baseResultSchema.index({ studentId: 1, tipo: 1 });
baseResultSchema.index({ token: 1 }, { sparse: true });

// Middleware di validazione base
baseResultSchema.pre('save', function(next) {
    if ((this.token && !this.expiresAt) || (!this.token && this.expiresAt)) {
        next(new Error('Token e expiresAt devono essere presenti insieme'));
    }
    if (!this.studentId) {
        next(new Error('StudentId è richiesto'));
    }
    next();
});

// Virtual per stato completamento
baseResultSchema.virtual('isCompleto').get(function() {
    return this.completato && this.dataCompletamento;
});

// Schema specifico per CSI
const csiResultSchema = new mongoose.Schema({
    risposte: [{
        domanda: {
            id: Number,
            categoria: String,
            testo: String
        },
        valore: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        tempoRisposta: Number
    }],
    punteggiDimensioni: {
        creativita: {
            score: Number,
            level: String,
            interpretation: String
        },
        elaborazione: {
            score: Number,
            level: String,
            interpretation: String
        },
        decisione: {
            score: Number,
            level: String,
            interpretation: String
        },
        preferenzaVisiva: {
            score: Number,
            level: String,
            interpretation: String
        },
        autonomia: {
            score: Number,
            level: String,
            interpretation: String
        }
    },
    metadataCSI: {
        versioneAlgoritmo: String,
        calcolatoIl: Date,
        pattern: {
            isValid: Boolean,
            consistency: Boolean,
            timePattern: {
                averageTime: Number,
                suspicious: Boolean,
                tooFastResponses: Number,
                pattern: {
                    consistent: Boolean,
                    avgTimePerQuestion: Number
                }
            }
        },
        profiloCognitivo: {
            stiliDominanti: [String],
            raccomandazioni: [String]
        },
        warnings: [String]
    }
});

// Crea il modello base
const Result = mongoose.model('Result', baseResultSchema);

// Crea il discriminatore per CSI
const CSIResult = Result.discriminator('CSI', csiResultSchema);

module.exports = {
    Result,
    CSIResult
};