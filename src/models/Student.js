const mongoose = require('mongoose');

/**
 * Schema per tracciare lo storico dei cambi di classe
 * Mantiene memoria di tutti i movimenti dello studente nel sistema
 */
const classChangeHistorySchema = new mongoose.Schema({
    fromClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        description: 'Classe di provenienza'
    },
    toClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        description: 'Classe di destinazione'
    },
    fromSection: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        },
        description: 'Sezione di provenienza (lettera maiuscola)'
    },
    toSection: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        },
        description: 'Sezione di destinazione (lettera maiuscola)'
    },
    fromYear: {
        type: Number,
        description: 'Anno scolastico di provenienza'
    },
    toYear: {
        type: Number,
        description: 'Anno scolastico di destinazione'
    },
    date: {
        type: Date,
        default: Date.now,
        description: 'Data del cambio classe'
    },
    reason: {
        type: String,
        trim: true,
        description: 'Motivazione del cambio classe'
    },
    academicYear: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{4}\/\d{4}$/.test(v);
            },
            message: props => `${props.value} non è un anno accademico valido (formato: YYYY/YYYY)`
        },
        description: 'Anno accademico in cui è avvenuto il cambio'
    }
});

/**
 * Schema principale dello studente
 */
const studentSchema = new mongoose.Schema({
    // Dati anagrafici
    firstName: {
        type: String,
        required: [true, 'Il nome è obbligatorio'],
        trim: true,
        description: 'Nome dello studente'
    },
    lastName: {
        type: String,
        required: [true, 'Il cognome è obbligatorio'],
        trim: true,
        description: 'Cognome dello studente'
    },
    gender: {
        type: String,
        enum: ['M', 'F'],
        required: [true, 'Il genere è obbligatorio'],
        description: 'Genere dello studente (M/F)'
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'La data di nascita è obbligatoria'],
        description: 'Data di nascita dello studente'
    },
    fiscalCode: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è un codice fiscale valido`
        },
        description: 'Codice fiscale dello studente (opzionale)'
    },

    // Contatti
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
        },
        description: 'Email dello studente per comunicazioni e accesso ai test'
    },
    parentEmail: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} non è un'email valida!`
        },
        description: 'Email del genitore/tutore (opzionale)'
    },

    // Collegamenti istituzionali
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        description: 'Riferimento alla scuola di appartenenza'
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        description: 'Riferimento alla classe corrente'
    },
    section: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^[A-Z]$/.test(v);
            },
            message: props => `${props.value} non è una sezione valida`
        },
        description: 'Sezione corrente'
    },
    currentYear: {
        type: Number,
        required: true,
        validate: {
            validator: async function(v) {
                const School = mongoose.model('School');
                const school = await School.findById(this.schoolId);
                if (!school) return false;
                return school.schoolType === 'middle_school' ? 
                    v >= 1 && v <= 3 : 
                    v >= 1 && v <= 5;
            },
            message: props => `${props.value} non è un anno valido per il tipo di scuola`
        },
        description: 'Anno scolastico corrente'
    },

    // Riferimenti ai docenti
    mainTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        description: 'Docente principale'
    },
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        description: 'Lista dei docenti associati'
    }],

    // Gestione stato e note
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'transferred', 'graduated'],
        default: 'pending',
        required: true,
        description: 'Stato corrente dello studente nel sistema'
    },
    notes: {
        type: String,
        trim: true,
        maxLength: [1000, 'Le note non possono superare i 1000 caratteri'],
        description: 'Note generali sullo studente'
    },
    needsClassAssignment: {
        type: Boolean,
        default: true,
        description: 'Flag per indicare se lo studente necessita di assegnazione a una classe'
    },

    // Storico e tracking
    lastClassChangeDate: {
        type: Date,
        description: 'Data dell\'ultimo cambio classe'
    },
    classChangeHistory: [classChangeHistorySchema],

    // Flag e metadati
    isActive: {
        type: Boolean,
        default: true,
        description: 'Flag per indicare se il record è attivo nel sistema'
    },
    specialNeeds: {
        type: Boolean,
        default: false,
        description: 'Flag per indicare eventuali necessità speciali'
    }
}, {
    timestamps: true,
    collection: 'students'
});

// Indici per ottimizzare le query più comuni
studentSchema.index({ schoolId: 1, currentYear: 1 });
studentSchema.index({ classId: 1 });
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ fiscalCode: 1 }, { unique: true, sparse: true });
studentSchema.index({ lastName: 1, firstName: 1 });
studentSchema.index({ 'teachers': 1 });
studentSchema.index({ status: 1, needsClassAssignment: 1 });
studentSchema.index({ createdAt: -1 }); // Per ordinare gli studenti non assegnati per data di creazione

// Virtual per il nome completo
studentSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Metodo per verificare se lo studente può essere assegnato a una classe
studentSchema.methods.canBeAssignedToClass = async function(classId) {
    const Class = mongoose.model('Class');
    const targetClass = await Class.findById(classId);
    
    if (!targetClass) return false;
    
    // Verifica che la classe appartenga alla stessa scuola
    if (targetClass.schoolId.toString() !== this.schoolId.toString()) {
        return false;
    }
    
    // Verifica il numero di studenti nella classe
    const currentStudentsCount = await this.model('Student').countDocuments({
        classId,
        isActive: true
    });
    
    return currentStudentsCount < targetClass.capacity;
};

// Middleware pre-delete per gestire la cancellazione cascade
studentSchema.pre('deleteMany', async function(next) {
    try {
        const filter = this.getFilter();
        // TODO: Implementare pulizia dati correlati quando verranno aggiunti
        // (es: risultati dei test, documenti allegati, etc.)
        next();
    } catch (error) {
        next(error);
    }
});

// Configurazione per JSON output
studentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        delete ret._id;
        return ret;
    }
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;