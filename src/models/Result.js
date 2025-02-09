const mongoose = require('mongoose');

// 2. Schema Base dei Risultati
const baseResultSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true
    },
    testRef: {
        type: String,
        required: true
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
    timestamps: true,
    toJSON: { virtuals: false },
    toObject: { virtuals: false }
});

// 3. Indici
baseResultSchema.index({ tipo: 1, dataCompletamento: -1 });
baseResultSchema.index({ studentId: 1, tipo: 1 });
baseResultSchema.index({ token: 1 }, { sparse: true });

// 6. Schema specifico per CSI
const csiResultSchema = new mongoose.Schema({
    testRef: {
        type: String,
        required: [true, 'Il riferimento al test è obbligatorio']
    },
    config: {
        type: String,
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
    punteggiDimensioni: {
        elaborazione: Number,
        creativita: Number,
        preferenzaVisiva: Number,
        decisione: Number,
        autonomia: Number
    },
    metadataCSI: {
        tempoTotaleDomande: Number,
        tempoMedioRisposta: Number,
        completamentoPercentuale: {
            type: Number,
            default: 0
        },
        pattern: mongoose.Schema.Types.Mixed
    }
}, {
    toJSON: { virtuals: false },
    toObject: { virtuals: false }
});

// Funzione per ottenere o creare il modello Result
function getOrCreateResultModel() {
    if (mongoose.models.Result) {
        return mongoose.models.Result;
    }
    return mongoose.model('Result', baseResultSchema);
}

// Funzione per ottenere o creare il discriminatore CSI
function getOrCreateCSIModel(ResultModel) {
    if (ResultModel.discriminators && ResultModel.discriminators.CSI) {
        return ResultModel.discriminators.CSI;
    }
    return ResultModel.discriminator('CSI', csiResultSchema);
}

// Esportazione degli schemi e dei modelli
module.exports = {
    baseResultSchema,
    csiResultSchema,
    getModels: () => {
        const ResultModel = getOrCreateResultModel();
        const CSIResultModel = getOrCreateCSIModel(ResultModel);
        return {
            Result: ResultModel,
            CSIResult: CSIResultModel
        };
    }
};