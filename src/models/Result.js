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
        sparse: true,
        index: true // Importante!
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
    test: {
        tipo: {
            type: String,
            required: true,
            enum: ['CSI']
        },
        config: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CSIConfig',
            required: true
        },
        domande: [{
            id: Number,
            testo: String,
            categoria: {
                type: String,
                enum: ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia']
            },
            metadata: metadataSchema // useremo lo stesso schema di CSIQuestion
        }]
    },
    risposte: [{
        questionId: {
            type: Number,
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        timeSpent: {
            type: Number,
            required: true,
            validate: {
                validator: async function(timeSpent) {
                    const config = await mongoose.model('CSIConfig').getActiveConfig();
                    return timeSpent >= config.validazione.tempoMinimoDomanda &&
                           timeSpent <= config.validazione.tempoMassimoDomanda;
                },
                message: 'Tempo di risposta non valido'
            }
        },
        categoria: {
            type: String,
            required: true,
            enum: ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

// Crea il modello base
const Result = mongoose.model('Result', baseResultSchema);

// Crea il discriminatore per CSI
const CSIResult = Result.discriminator('CSI', csiResultSchema);

csiResultSchema.methods.validateAnswer = async function(answerData) {
    const config = await mongoose.model('CSIConfig').getActiveConfig();
    return {
        isValid: config.validateAnswer(answerData.timeSpent),
        config: config
    };
};

csiResultSchema.methods.addAnswer = async function(answerData) {
    const validation = await this.validateAnswer(answerData);
    if (!validation.isValid) {
        throw new Error('Risposta non valida: tempo di risposta fuori dai limiti');
    }
    
    this.risposte.push(answerData);
    return this.save();
};

csiResultSchema.virtual('progress').get(function() {
    return {
        total: this.test.domande.length,
        answered: this.risposte.length,
        remaining: this.test.domande.length - this.risposte.length,
        percentage: (this.risposte.length / this.test.domande.length) * 100
    };
});

module.exports = {
    Result,
    CSIResult
};