// src/models/Result.js
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
        required: function() { return this.completato; }
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
    metadata: {
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
        profile: {
            dimensions: {
                type: Map,
                of: {
                    score: Number,
                    level: String,
                    interpretation: String
                }
            },
            dominantStyle: [String],
            recommendations: [String]
        },
        warnings: [String]
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

// Indici
resultSchema.index({ test: 1, dataCompletamento: -1 });
resultSchema.index({ classe: 1, test: 1 });
resultSchema.index({ scuola: 1, test: 1 });
resultSchema.index({ studentId: 1, test: 1 });
resultSchema.index({ token: 1 }, { sparse: true });

// Middleware di validazione
resultSchema.pre('save', function(next) {
    if ((this.token && !this.expiresAt) || (!this.token && this.expiresAt)) {
        next(new Error('Token e expiresAt devono essere presenti insieme'));
    }
    if (!this.studentId) {
        next(new Error('StudentId è richiesto'));
    }
    next();
});

// Virtual per stato completamento
resultSchema.virtual('isCompleto').get(function() {
    return this.completato && this.dataCompletamento;
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;