const mongoose = require('mongoose');

/**
 * Schema per i risultati dei singoli test
 */
const testResultItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        description: 'Nome o percorso del test'
    },
    status: {
        type: String,
        enum: ['passed', 'failed', 'skipped', 'pending'],
        required: true,
        description: 'Stato del test'
    },
    message: {
        type: String,
        description: 'Messaggio associato al risultato del test'
    },
    duration: {
        type: Number,
        description: 'Durata del test in ms'
    }
}, { _id: false });

/**
 * Schema principale per i risultati dei test
 */
const testResultSchema = new mongoose.Schema({
    testType: {
        type: String,
        required: true,
        enum: ['unit', 'integration', 'all'],
        description: 'Tipo di test (unit, integration, all)'
    },
    testPath: {
        type: String,
        required: true,
        description: 'Percorso o pattern del test eseguito'
    },
    executedAt: {
        type: Date,
        default: Date.now,
        description: 'Data e ora di esecuzione del test'
    },
    success: {
        type: Boolean,
        required: true,
        description: 'Indica se tutti i test sono passati'
    },
    results: {
        type: [testResultItemSchema],
        default: [],
        description: 'Risultati dettagliati dei test'
    },
    passedTests: {
        type: Number,
        default: 0,
        description: 'Numero di test passati'
    },
    failedTests: {
        type: Number,
        default: 0,
        description: 'Numero di test falliti'
    },
    totalTests: {
        type: Number,
        default: 0,
        description: 'Numero totale di test eseguiti'
    },
    duration: {
        type: Number,
        description: 'Durata totale in secondi'
    },
    rawOutput: {
        type: String,
        description: 'Output completo del test'
    }
}, {
    timestamps: true
});

// Indici per ottimizzare le query più comuni
testResultSchema.index({ testType: 1, executedAt: -1 });
testResultSchema.index({ success: 1 });
testResultSchema.index({ 'results.name': 1 });

// Metodi virtuali per informazioni aggiuntive
testResultSchema.virtual('passRate').get(function() {
    if (this.totalTests === 0) return 0;
    return (this.passedTests / this.totalTests) * 100;
});

// Esportazione del modello
const TestResult = mongoose.model('TestResult', testResultSchema);
module.exports = TestResult;