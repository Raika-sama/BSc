const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{4}\/\d{4}$/.test(v);
            },
            message: 'Anno accademico deve essere nel formato YYYY/YYYY'
        }
    },
    status: {
        type: String,
        enum: ['active', 'planned', 'archived'],
        default: 'planned'
    },
    startDate: Date,
    endDate: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const sectionAcademicYearSchema = new mongoose.Schema({
    year: String,
    status: {
        type: String,
        enum: ['active', 'planned', 'archived'],
        default: 'planned'
    },
    maxStudents: {
        type: Number,
        min: 15,  // Aggiornato per allinearsi con i requisiti UI
        max: 35   // Aggiornato per allinearsi con i requisiti UI
    },
    activatedAt: Date,
    deactivatedAt: Date,
    notes: String
});

const sectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true   // Rimossa la validazione stringente
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxStudents: {      // Aggiunto per supportare il formato semplificato
        type: Number,
        min: 15,
        max: 35
    },
    academicYears: [sectionAcademicYearSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    deactivatedAt: {
        type: Date,
        validate: {
            validator: function(value) {
                // Se il valore è null, la sezione deve essere attiva
                if (value === null) {
                    return this.isActive === true;
                }
                // Se c'è una data, la sezione deve essere inattiva
                return this.isActive === false;
            },
            message: 'La data di disattivazione deve essere coerente con lo stato della sezione'
        }
    }
});

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome scuola richiesto'],
        unique: true,
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
    
    academicYears: [academicYearSchema],
    sections: [sectionSchema],
    defaultMaxStudentsPerClass: {
        type: Number,
        default: 25,
        min: 15,
        max: 35
    },
    
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    users: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health']
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    deactivatedAt: {
        type: Date,
        default: null
    },
    deactivationReason: {
        type: String,
        trim: true
    },
    deactivationNotes: {
        type: String,
        trim: true
    },
    reactivatedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Validatori e middleware
schoolSchema.pre('save', function(next) {
    // Aggiungi una verifica per una flag skipManagerValidation
    if (this._skipManagerValidation === true || this.isModified('schoolType') || this.isModified('institutionType')) {
      return next();
    }
    
    if (!this.manager) {
      return next(new Error('La scuola deve avere un manager'));
    }
    next();


    // Verifica coerenza tipo scuola e numero studenti
    if (this.schoolType === 'middle_school') {
        const maxStudentsLimit = 30;
        const hasInvalidSections = this.sections.some(section => 
            (section.maxStudents && section.maxStudents > maxStudentsLimit) ||
            section.academicYears.some(ay => ay.maxStudents > maxStudentsLimit)
        );
        
        if (hasInvalidSections) {
            next(new Error('Scuola media non può avere più di 30 studenti per classe'));
            return;
        }
    }
    
    next();
});

// Indici
schoolSchema.index({ name: 1 }, { unique: true });
schoolSchema.index({ 'sections.name': 1 });
schoolSchema.index({ 'academicYears.year': 1 });

const School = mongoose.model('School', schoolSchema);
module.exports = School;