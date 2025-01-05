// src/models/Test.js
const testSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    descrizione: {
        type: String,
        trim: true
    },
    domande: [{
        testo: {
            type: String,
            required: true
        },
        opzioni: [{
            type: String,
            required: true
        }],
        rispostaCorretta: {
            type: String
        }
    }]
}, {
    timestamps: true
});

const resultSchema = new mongoose.Schema({
    utente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    risposte: [{
        domanda: {
            type: Number,
            required: true
        },
        risposta: {
            type: String,
            required: true
        }
    }],
    punteggio: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    data: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indici per ottimizzazione ricerche
resultSchema.index({ utente: 1, test: 1 });
resultSchema.index({ data: -1 });

const Test = mongoose.model('Test', testSchema);
const Result = mongoose.model('Result', resultSchema);

module.exports = {
    Test,
    Result
};

// src/models/index.js
const School = require('./School');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const { Test, Result } = require('./Test');

module.exports = {
    School,
    User,
    Class,
    Student,
    Test,
    Result
};