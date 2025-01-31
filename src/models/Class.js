// src/models/Class.js
const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  status: {
    type: String,
    enum: ['active', 'transferred', 'graduated'],
    default: 'active'
  }
});

const classSchema = new mongoose.Schema({
  // Campi esistenti
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: async function(v) {
        const school = await this.model('School').findById(this.schoolId);
        return school.schoolType === 'middle_school' ? v <= 3 : v <= 5;
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
  
  // Nuovi campi
  academicYear: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}\/\d{4}$/.test(v);
      },
      message: props => `${props.value} non è un anno accademico valido`
    }
  },
  status: {
    type: String,
    enum: ['active', 'planned', 'archived'],
    default: 'planned'
  },
  students: [studentRecordSchema],
  capacity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: async function(v) {
        const school = await this.model('School').findById(this.schoolId);
        const section = school.sections.find(s => s.name === this.section);
        const academicYearConfig = section?.academicYears.find(
          ay => ay.year === this.academicYear
        );
        return v <= (academicYearConfig?.maxStudents || school.defaultMaxStudentsPerClass);
      },
      message: 'Capacità eccede il limite massimo configurato'
    }
  },
  
  // Campi esistenti da mantenere
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  mainTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mainTeacherIsTemporary: {     // Nuovo campo
      type: Boolean,
      default: false
  },
  previousMainTeacher: {         // Nuovo campo per storico
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indici
classSchema.index({ schoolId: 1, year: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ mainTeacher: 1 });
classSchema.index({ status: 1 });

// Virtual per conteggio studenti attivi
classSchema.virtual('activeStudentsCount').get(function() {
  return this.students.filter(s => s.status === 'active').length;
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;