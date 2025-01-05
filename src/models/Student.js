// src/models/Student.js
const mongoose = require('mongoose');

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
    }
}, {
    timestamps: true
});

// Indici per ottimizzazione query
studentSchema.index({ classId: 1 });
studentSchema.index({ schoolId: 1 });
studentSchema.index({ mainTeacher: 1 });
studentSchema.index({ teachers: 1 });
studentSchema.index({ email: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;