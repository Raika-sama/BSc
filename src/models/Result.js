// 1. Importazioni
const mongoose = require('mongoose');

// 2. Schema Base dei Risultati
const baseResultSchema = new mongoose.Schema({
    // Dati principali
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
    collection: 'results',
    timestamps: true 
});

// 3. Indici
baseResultSchema.index({ tipo: 1, dataCompletamento: -1 });
baseResultSchema.index({ classe: 1, tipo: 1 });
baseResultSchema.index({ scuola: 1, tipo: 1 });
baseResultSchema.index({ studentId: 1, tipo: 1 });
baseResultSchema.index({ token: 1 }, { sparse: true });

// 4. Middleware di validazione base
baseResultSchema.pre('save', function(next) {
    if ((this.token && !this.expiresAt) || (!this.token && this.expiresAt)) {
        next(new Error('Token e expiresAt devono essere presenti insieme'));
    }
    if (!this.studentId) {
        next(new Error('StudentId è richiesto'));
    }
    next();
});

// 5. Virtual properties
baseResultSchema.virtual('isCompleto').get(function() {
    return this.completato && this.dataCompletamento;
});

// 6. Schema specifico per CSI
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
            enum: ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    punteggiDimensioni: {  // Modificato da punteggi a punteggiDimensioni per allineamento
        elaborazione: Number,
        creativita: Number,
        preferenzaVisiva: Number,
        decisione: Number,
        autonomia: Number
    },
    metadataCSI: {  // Modificato da metadata a metadataCSI per essere più specifico
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

// 7. Middleware CSI
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

// 8. Metodi CSI
csiResultSchema.methods.validateAnswer = async function(answerData) {
    const config = await mongoose.model('CSIConfig').getActiveConfig();
    return {
        isValid: config.validateAnswer(answerData.timeSpent),
        config: config
    };
};

// 9. Validazioni CSI
csiResultSchema.path('risposte').validate(function(risposte) {
    const ids = risposte.map(r => r.questionId);
    return new Set(ids).size === ids.length;
}, 'Non possono esserci risposte duplicate per la stessa domanda');

// 10. Virtuals CSI
csiResultSchema.virtual('totalRisposte').get(function() {
    return this.risposte.length;
});

csiResultSchema.virtual('progress').get(function() {
    return {
        answered: this.risposte.length,
        total: 0,
        remaining: 0,
        percentage: 0
    };
});

// 11. Creazione modelli nell'ordine corretto
let Result, CSIResult;

// Verifica se il modello Result esiste già
if (mongoose.models.Result) {
    Result = mongoose.models.Result;
} else {
    Result = mongoose.model('Result', baseResultSchema);
}

// Verifica se il discriminator CSI esiste già
if (Result.discriminators && Result.discriminators.CSI) {
    CSIResult = Result.discriminators.CSI;
} else {
    CSIResult = Result.discriminator('CSI', csiResultSchema);
}

module.exports = {
    Result,
    CSIResult
};