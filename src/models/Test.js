// src/models/Test.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
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
    _id: false
});

const testSchema = new mongoose.Schema({
    nome: {
        type: String,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['CSI', 'FUTURE_TEST_1', 'FUTURE_TEST_2']
    },
    descrizione: {
        type: String,
        trim: true
    },
    domande: [{
        questionRef: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'domande.questionModel'
        },
        questionModel: {
            type: String,
            required: true,
            enum: ['CSIQuestion', 'FutureTestQuestion']
        },
        originalQuestion: questionSchema,
        order: Number,
        version: String
    }],
    configurazione: {
        tempoLimite: Number,
        tentativiMax: Number,
        cooldownPeriod: Number,
        randomizzaDomande: Boolean,
        mostraRisultatiImmediati: Boolean,
        istruzioni: String,
        metadataSchema: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        questionVersion: {
            type: String,
            required: true,
            default: '1.0.0'
        },
        // Aggiungi questo campo
        configRef: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'tipo'
        }
    },
    versione: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    token: {
        type: String,
        unique: true,
        sparse: true,
        index: true  // importante per le performance
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    risposte: [{
        questionId: Number,
        value: Number,
        timeSpent: Number,
        categoria: String,
        timestamp: Date
    }],
    active: {
        type: Boolean,
        default: true
    },
    csiConfig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CSIConfig',
        required: function() {
            return this.tipo === 'CSI';
        }
    }
}, {
    timestamps: true
});

// Indici
testSchema.index({ tipo: 1, active: 1 });
testSchema.index({ 'configurazione.questionVersion': 1 });

// Aggiungi questo pre-save middleware
// Middleware di validazione
testSchema.pre('save', async function(next) {
    if (this.tipo === 'CSI') {
        try {
            const CSIConfig = mongoose.model('CSIConfig');
            const config = await CSIConfig.findOne({ active: true });
            
            if (!config) {
                throw new Error('Nessuna configurazione CSI attiva trovata');
            }

            // Salva il riferimento alla configurazione
            this.configurazione.configRef = config._id;
            
            // Imposta i metadati di base dalla configurazione
            // Verifichiamo che le proprietà esistano prima di accedervi
            this.configurazione.metadataSchema = {
                categorie: config.scoring?.categorie?.map(c => c.nome) || [],
                scaleLikert: config.scoring?.categorie?.[0]?.max || 5, // valore di default se non presente
                pesoDefault: config.scoring?.categorie?.[0]?.pesoDefault || 1
            };

            // Imposta anche altri valori di default se non specificati
            if (!this.configurazione.tempoLimite) {
                this.configurazione.tempoLimite = config.validazione?.tempoMassimoDomanda || 300000;
            }
            
            if (this.configurazione.tentativiMax === undefined) {
                this.configurazione.tentativiMax = 1;
            }

            if (this.configurazione.cooldownPeriod === undefined) {
                this.configurazione.cooldownPeriod = 24 * 60 * 60 * 1000; // 24 ore in ms
            }

            if (this.configurazione.randomizzaDomande === undefined) {
                this.configurazione.randomizzaDomande = false;
            }

            if (this.configurazione.mostraRisultatiImmediati === undefined) {
                this.configurazione.mostraRisultatiImmediati = false;
            }

            if (!this.configurazione.istruzioni) {
                this.configurazione.istruzioni = config.interfaccia?.istruzioni || 
                    'Rispondi alle seguenti domande selezionando un valore da 1 a 5';
            }

        } catch (error) {
            logger.error('Error in Test pre-save middleware:', {
                error: error.message,
                testId: this._id,
                tipo: this.tipo
            });
            next(error);
            return;
        }
    }
    next();
});

// Middleware per populate automatico delle domande
testSchema.pre(/^find/, function(next) {
    if (this.options.populateQuestions !== false) {
        this.populate({
            path: 'domande.questionRef',
            model: '$domande.questionModel'
        });
    }
    next();
});

// Middleware di validazione
testSchema.pre('save', async function(next) {
    if (this.tipo === 'CSI') {
        try {
            const CSIConfig = mongoose.model('CSIConfig');
            const config = await CSIConfig.getActiveConfig();
            
            if (!config) {
                throw new Error('Nessuna configurazione CSI attiva trovata');
            }

            // Salva il riferimento alla configurazione
            this.configurazione.configRef = config._id;
            
            // Imposta i metadati di base dalla configurazione
            this.configurazione.metadataSchema = {
                categorie: config.scoring.categorie.map(c => c.nome),
                scaleLikert: config.scoring.categorie[0].max,
                pesoDefault: config.scoring.categorie[0].pesoDefault
            };
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Metodo per calcolare tempo rimanente
testSchema.methods.getTempoRimanente = function(dataInizio) {
    if (!this.configurazione.tempoLimite) return null;
    const tempoPassato = (Date.now() - dataInizio) / 60000;
    return Math.max(0, this.configurazione.tempoLimite - tempoPassato);
};

const Test = mongoose.model('Test', testSchema);

module.exports = Test;