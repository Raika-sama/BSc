// src/models/Student.js
const mongoose = require('mongoose');

// Schema per lo storico dei cambi classe
const classChangeHistorySchema = new mongoose.Schema({
    fromClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    toClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    fromSection: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        }
    },
    toSection: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        }
    },
    fromYear: Number,
    toYear: Number,
    date: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        trim: true
    }
});

const studentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['M', 'F'],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} non è un'email valida!`
        }
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    section: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        }
    },
    mainTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    notes: {
        type: String,
        trim: true
    },
    needsClassAssignment: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Nuovi campi per gestione classe
    currentYear: {
        type: Number,
        required: true,
        default: 1,
        validate: {
            validator: async function(v) {
                // Recupera la scuola per verificare il tipo
                const School = mongoose.model('School');
                const school = await School.findById(this.schoolId);
                if (!school) return false;
                
                // Valida in base al tipo di scuola
                if (school.schoolType === 'middle_school') {
                    return v >= 1 && v <= 3;
                } else if (school.schoolType === 'high_school') {
                    return v >= 1 && v <= 5;
                }
                return false;
            },
            message: props => `L'anno ${props.value} non è valido per il tipo di scuola`
        }
    },
    lastClassChangeDate: {
        type: Date
    },
    classChangeHistory: [classChangeHistorySchema]
}, {
    timestamps: true
});

// Indici esistenti
studentSchema.index({ classId: 1 });
studentSchema.index({ schoolId: 1 });
studentSchema.index({ mainTeacher: 1 });
studentSchema.index({ teachers: 1 });
studentSchema.index({ email: 1 }, { unique: true });

// Nuovo indice per ottimizzare le query sul currentYear
studentSchema.index({ currentYear: 1 });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;