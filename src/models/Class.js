// src/models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: function(v) {
                // Valida anno in base al tipo di scuola
                return this.schoolId.schoolType === 'middle_school' ? v <= 3 : v <= 5;
            },
            message: props => `${props.value} non è un anno valido per questo tipo di scuola`
        }
    },
    section: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        }
    },
    academicYear: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{4}\/\d{4}$/.test(v);
            },
            message: props => `${props.value} non è un anno accademico valido (formato: YYYY/YYYY)`
        }
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    mainTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indici composti per unicità classe
classSchema.index(
    { schoolId: 1, year: 1, section: 1, academicYear: 1 }, 
    { unique: true }
);
classSchema.index({ mainTeacher: 1 });
classSchema.index({ teachers: 1 });

// Middleware pre-save
classSchema.pre('save', function(next) {
    // Assicura che mainTeacher sia in teachers
    if (!this.teachers.includes(this.mainTeacher)) {
        this.teachers.push(this.mainTeacher);
    }
    next();
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;