// src/models/School.js
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
    min: 1,
    max: 40
  },
  activatedAt: Date,
  deactivatedAt: Date,
  notes: String
});

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]$/.test(v);
      },
      message: 'Sezione deve essere una lettera maiuscola'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYears: [sectionAcademicYearSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const schoolSchema = new mongoose.Schema({
  // Campi esistenti
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
  
  // Nuovi campi
  academicYears: [academicYearSchema],
  sections: [sectionSchema],
  defaultMaxStudentsPerClass: {
    type: Number,
    default: 25,
    min: 1,
    max: 40
  },
  
  // Campi esistenti da mantenere
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

// Validatori e middleware
schoolSchema.pre('save', function(next) {
  // Verifica presenza admin
  if (!this.manager) {
    next(new Error('La scuola deve avere un manager'));
  }
  
  // Verifica coerenza tipo scuola e anni
  if (this.schoolType === 'middle_school' && this.sections.length > 0) {
    const hasInvalidYears = this.sections.some(section => 
      section.academicYears.some(ay => ay.maxStudents > 30)
    );
    if (hasInvalidYears) {
      next(new Error('Scuola media non può avere più di 30 studenti per classe'));
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

