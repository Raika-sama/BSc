// models/CSIQuestion.js

const mongoose = require('mongoose');

// Schema per i metadati
const metadataSchema = new mongoose.Schema({
    polarity: {
        type: String,
        required: true,
        enum: ['+', '-'],
        default: '+'
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 1
    },
    difficultyLevel: {
        type: String,
        enum: ['facile', 'medio', 'difficile'],
        default: 'medio'
    },
    tags: [{
        type: String
    }],
    notes: {
        type: String
    },
    lastReviewDate: {
        type: Date
    }
}, { _id: false });

// Schema domanda CSI aggiornato
const csiQuestionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    testo: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true,
        enum: ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia']
    },
    tipo: {
        type: String,
        required: true,
        enum: ['likert'],
        default: 'likert'
    },
    metadata: {
        type: metadataSchema,
        required: true,
        default: () => ({})
    },
    version: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Metodi di utilità per i metadati
csiQuestionSchema.methods.updateMetadata = function(newMetadata) {
    this.metadata = { ...this.metadata.toObject(), ...newMetadata };
    return this.save();
};

csiQuestionSchema.methods.setDifficulty = function(level) {
    this.metadata.difficultyLevel = level;
    return this.save();
};

csiQuestionSchema.methods.addTag = function(tag) {
    if (!this.metadata.tags.includes(tag)) {
        this.metadata.tags.push(tag);
        return this.save();
    }
    return this;
};

csiQuestionSchema.methods.removeTag = function(tag) {
    this.metadata.tags = this.metadata.tags.filter(t => t !== tag);
    return this.save();
};

// Query helpers
csiQuestionSchema.query.byDifficulty = function(level) {
    return this.where('metadata.difficultyLevel').equals(level);
};

csiQuestionSchema.query.withTag = function(tag) {
    return this.where('metadata.tags').in([tag]);
};

csiQuestionSchema.query.recentlyReviewed = function(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.where('metadata.lastReviewDate').gte(date);
};

// Pre-save middleware per la validazione dei metadati
csiQuestionSchema.pre('save', function(next) {
    if (this.isModified('metadata')) {
        // Assicura che i valori di default siano impostati
        this.metadata.polarity = this.metadata.polarity || '+';
        this.metadata.weight = this.metadata.weight || 1;
        this.metadata.difficultyLevel = this.metadata.difficultyLevel || 'medio';
        this.metadata.tags = this.metadata.tags || [];
    }
    next();
});

const CSIQuestion = mongoose.model('CSIQuestion', csiQuestionSchema);

module.exports = {
    CSIQuestion,
    metadataSchema  // Esporta anche lo schema dei metadati
};