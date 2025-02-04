const mongoose = require('mongoose');

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
        polarity: {
            type: String,
            required: true,
            enum: ['+', '-']
        },
        weight: {
            type: Number,
            required: true,
            default: 1
        }
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

// Indexes for efficient queries
csiQuestionSchema.index({ version: 1, active: 1 });
csiQuestionSchema.index({ categoria: 1 });
csiQuestionSchema.index({ id: 1 }, { unique: true });

// Validation middleware
csiQuestionSchema.pre('save', function(next) {
    // Ensure version follows semver pattern
    const semverPattern = /^(\d+\.)?(\d+\.)?(\*|\d+)$/;
    if (!semverPattern.test(this.version)) {
        next(new Error('Version must follow semantic versioning pattern (e.g., 1.0.0)'));
    }
    next();
});

const CSIQuestion = mongoose.model('CSIQuestion', csiQuestionSchema);

module.exports = CSIQuestion;