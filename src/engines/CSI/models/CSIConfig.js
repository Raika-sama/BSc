// src/engines/CSI/models/CSIConfig.js
const mongoose = require('mongoose');

const interpretazioneSchema = new mongoose.Schema({
    range: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        }
    },
    level: {
        type: String,
        required: true,
        enum: ['Basso', 'Medio-Basso', 'Medio', 'Medio-Alto', 'Alto']
    },
    description: String
}, { _id: false });

const categoriaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        enum: ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia']
    },
    pesoDefault: {
        type: Number,
        required: true,
        default: 1
    },
    min: {
        type: Number,
        required: true,
        default: 1
    },
    max: {
        type: Number,
        required: true,
        default: 5
    },
    interpretazioni: [interpretazioneSchema]
}, { _id: false });

const csiConfigSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d+\.\d+\.\d+$/.test(v);
            },
            message: props => `${props.value} non è una versione valida (usa il formato semver x.y.z)`
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    scoring: {
        categorie: [categoriaSchema],
        algoritmo: {
            version: {
                type: String,
                required: true,
                default: '1.0.0'
            },
            parametri: {
                type: Map,
                of: mongoose.Schema.Types.Mixed,
                default: () => new Map([
                    ['pesoTempoRisposta', 0.3],
                    ['sogliaConsistenza', 0.7]
                ])
            }
        }
    },
    validazione: {
        tempoMinimoDomanda: {
            type: Number,
            required: true,
            default: 2000 // 2 secondi in ms
        },
        tempoMassimoDomanda: {
            type: Number,
            required: true,
            default: 300000 // 5 minuti in ms
        },
        numeroMinimoDomande: {
            type: Number,
            required: true,
            default: 20
        },
        sogliaRisposteVeloci: {
            type: Number,
            required: true,
            default: 5 // numero massimo di risposte troppo veloci consentite
        }
    },
    interfaccia: {
        istruzioni: {
            type: String,
            required: true,
            default: 'Rispondi alle seguenti domande selezionando un valore da 1 a 5'
        },
        mostraProgressBar: {
            type: Boolean,
            default: true
        },
        permettiTornaIndietro: {
            type: Boolean,
            default: false
        }
    },
    analytics: {
        metriche: [{
            type: String,
            enum: ['tempoMedio', 'consistenza', 'pattern', 'completamento']
        }],
        pattern: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: () => new Map([
                ['checkConsistenza', true],
                ['checkTempi', true],
                ['checkPattern', true]
            ])
        }
    }
}, {
    timestamps: true
});

// Indici
csiConfigSchema.index({ version: 1, active: 1 });
csiConfigSchema.index({ active: 1, 'scoring.algoritmo.version': 1 });

// Middleware per garantire una sola configurazione attiva
csiConfigSchema.pre('save', async function(next) {
    if (this.active) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { active: false }
        );
    }
    next();
});

// Metodi statici
csiConfigSchema.statics.getActiveConfig = async function() {
    return await this.findOne({ active: true }).sort({ version: -1 });
};

// Metodi di istanza
csiConfigSchema.methods.validateAnswer = function(tempoRisposta) {
    return tempoRisposta >= this.validazione.tempoMinimoDomanda && 
           tempoRisposta <= this.validazione.tempoMassimoDomanda;
};

csiConfigSchema.methods.validateTestSetup = function(test) {
    return {
        isValid: test.domande.length >= this.validazione.numeroMinimoDomande,
        minQuestions: this.validazione.numeroMinimoDomande,
        currentQuestions: test.domande.length
    };
};

const CSIConfig = mongoose.model('CSIConfig', csiConfigSchema);

module.exports = CSIConfig;