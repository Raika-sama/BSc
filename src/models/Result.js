const mongoose = require('mongoose');

// 2. Schema Base dei Risultati
const baseResultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    testRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    token: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    accessMethod: {
        type: String,
        enum: ['account', 'token'],
        required: true
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
    punteggiDimensioni: {
        elaborazione: {
            score: Number,
            level: String,
            interpretation: String
        },
        creativita: {
            score: Number,
            level: String,
            interpretation: String
        },
        preferenzaVisiva: {
            score: Number,
            level: String,
            interpretation: String
        },
        decisione: {
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
        tempoTotaleDomande: Number,
        tempoMedioRisposta: Number,
        completamentoPercentuale: {
            type: Number,
            default: 0
        },
        pattern: mongoose.Schema.Types.Mixed,
        versioneAlgoritmo: String,
        calcolatoIl: Date,
        profiloCognitivo: {
            stiliDominanti: [String],
            raccomandazioni: [String],
            interpretazioneGlobale: String
        }
    }
}, {
    toJSON: { virtuals: false },
    toObject: { virtuals: false }
});

// Funzione migliorata per ottenere o creare il modello Result
function getOrCreateResultModel() {
    try {
        // Se il modello esiste già, lo restituiamo
        if (mongoose.models.Result) {
            return mongoose.models.Result;
        }
        
        // Altrimenti creiamo un nuovo modello con opzioni per il discriminatore
        const ResultModel = mongoose.model('Result', baseResultSchema);
        
        // Forza la creazione del discriminatore subito
        ResultModel.discriminator('CSI', csiResultSchema);
        
        return ResultModel;
    } catch (error) {
        console.error('Errore nella creazione del modello Result:', error);
        throw error;
    }
}

// Funzione migliorata per ottenere o creare il discriminatore CSI
function getOrCreateCSIModel(ResultModel) {
    try {
        // Se il discriminatore esiste già, lo restituiamo
        if (ResultModel.discriminators?.CSI) {
            return ResultModel.discriminators.CSI;
        }
        
        // Altrimenti creiamo un nuovo discriminatore
        const CSIModel = ResultModel.discriminator('CSI', csiResultSchema);
        
        // Verifica che il discriminatore sia stato creato correttamente
        if (!ResultModel.discriminators?.CSI) {
            throw new Error('Failed to create CSI discriminator');
        }
        
        return CSIModel;
    } catch (error) {
        console.error('Errore nella creazione del discriminatore CSI:', error);
        throw error;
    }
}

// Funzione per verificare che i modelli siano stati registrati correttamente
function verifyModels(ResultModel, CSIModel) {
    if (!ResultModel || !CSIModel) {
        throw new Error('Models not properly initialized');
    }
    
    if (!ResultModel.discriminators?.CSI) {
        throw new Error('CSI discriminator not properly registered');
    }
    
    return true;
}

// Esportazione degli schemi e dei modelli con verifica
module.exports = {
    baseResultSchema,
    csiResultSchema,
    getModels: () => {
        const ResultModel = getOrCreateResultModel();
        const CSIModel = getOrCreateCSIModel(ResultModel);
        
        // Verifica che i modelli siano stati creati correttamente
        verifyModels(ResultModel, CSIModel);
        
        return {
            Result: ResultModel,
            CSIResult: CSIModel
        };
    }
};