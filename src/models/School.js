// src/models/School.js
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome scuola richiesto'],
        unique: true, // Questo crea l'indice unico
        trim: true
    },
    schoolType: {
        type: String,
        enum: ['middle_school', 'high_school'],
        required: true
    },
    institutionType: {
        type: String,
        enum: ['scientific', 'classical', 'artistic', 'none'],
        default: 'none'
    },
    sections: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida!`
        }
    }],
    numberOfYears: {
        type: Number,
        validate: {
            validator: function(v) {
                return this.schoolType === 'middle_school' ? v === 3 : v === 5;
            },
            message: props => 'Numero di anni non valido per il tipo di scuola'
        }
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    province: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    users: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['teacher', 'admin'],
            required: true
        }
    }],
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indici
schoolSchema.index({ 'users.user': 1 });
schoolSchema.index({ 'users.role': 1 });
schoolSchema.index({ manager: 1 });

// Middleware pre-save per validazione
schoolSchema.pre('save', function(next) {
    // Verifica presenza admin
    const hasAdmin = this.users.some(user => user.role === 'admin');
    if (!hasAdmin) {
        next(new Error('La scuola deve avere almeno un admin'));
    }
    next();
});

const School = mongoose.model('School', schoolSchema);
module.exports = School;

