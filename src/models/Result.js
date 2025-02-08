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
        index: true
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
    collection: 'results',  // Specifica esplicitamente la collection
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

baseResultSchema.virtual('isCompleto').get(function() {
    return this.completato && this.dataCompletamento;
});

// Crea i modelli nell'ordine corretto
const Result = mongoose.model('Result', baseResultSchema);

// Schema specifico per CSI
const csiResultSchema = new mongoose.Schema({
    testRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: [true, 'Il riferimento al test è obbligatorio']
    },
    config: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CSIConfig',
        required: [true, 'Il riferimento alla configurazione è obbligatorio']
    },
    risposte: [{
        questionId: {
            type: Number,
            required: [true, 'ID domanda obbligatorio']
        },
        value: {
            type: Number,
            required: [true, 'Valore risposta obbligatorio'],
            min: [1, 'Il valore minimo è 1'],
            max: [5, 'Il valore massimo è 5']
        },
        timeSpent: {
            type: Number,
            required: [true, 'Tempo di risposta obbligatorio'],
            min: [0, 'Il tempo non può essere negativo']
        },
        categoria: {
            type: String,
            required: [true, 'Categoria obbligatoria'],
            enum: {
                values: ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia'],
                message: 'Categoria non valida'
            }
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    punteggi: {
        elaborazione: Number,
        creativita: Number,
        preferenzaVisiva: Number,
        decisione: Number,
        autonomia: Number
    },
    metadata: {
        tempoTotaleDomande: Number,
        tempoMedioRisposta: Number,
        completamentoPercentuale: {
            type: Number,
            default: 0
        },
        pattern: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Aggiungiamo i metodi e i virtual PRIMA di creare il discriminator
csiResultSchema.pre('save', async function(next) {
    if (!this.config) {
        try {
            const CSIConfig = mongoose.model('CSIConfig');
            const config = await CSIConfig.findOne({ active: true });
            if (config) {
                this.config = config._id;
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

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
    
    if (!this.populated('testRef')) {
        await this.populate({
            path: 'testRef',
            populate: {
                path: 'domande.questionRef',
                model: 'CSIQuestion'
            }
        });
    }
    
    this.risposte.push(answerData);
    return this.save();
};

// Validazioni e virtual
csiResultSchema.path('risposte').validate(function(risposte) {
    const ids = risposte.map(r => r.questionId);
    return new Set(ids).size === ids.length;
}, 'Non possono esserci risposte duplicate per la stessa domanda');

csiResultSchema.virtual('totalRisposte').get(function() {
    return this.risposte.length;
});

csiResultSchema.virtual('progress').get(function() {
    if (!this.testRef || !this.testRef.domande) return { total: 0, answered: 0, remaining: 0, percentage: 0 };
    return {
        total: this.testRef.domande.length,
        answered: this.risposte.length,
        remaining: this.testRef.domande.length - this.risposte.length,
        percentage: (this.risposte.length / this.testRef.domande.length) * 100
    };
});


const CSIResult = Result.discriminator('CSI', csiResultSchema);

module.exports = {
    Result,
    CSIResult
};