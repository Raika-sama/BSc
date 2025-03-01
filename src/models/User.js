const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'Token is required'],
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastUsedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { _id: true });

// Definizione schema della singola permission
const permissionSchema = new mongoose.Schema({
    resource: {
        type: String,
        required: true,
        enum: [
            'users', 'schools', 'classes', 'students', 
            'tests', 'api', 'finance', 'services', 
            'analytics', 'materials', 'results', 'engines' // Aggiunti results ed engines
        ]
    },
    actions: [{
        type: String,
        enum: ['read', 'create', 'update', 'delete', 'manage', 'write'], // Aggiunto write
        required: true
    }],
    scope: {
        type: String,
        enum: ['all', 'school', 'class', 'assigned', 'own'],
        default: 'own'
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        description: 'Nome dell\'utente'
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        description: 'Cognome dell\'utente'
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
        },
        description: 'Email dell\'utente (usata per il login)'
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
        description: 'Password dell\'utente (criptata)'
    },
    
    // Aggiornamento del campo ruolo con tutti i ruoli
    role: {
        type: String,
        enum: ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health', 'student'],
        required: true,
        description: 'Ruolo utente nel sistema'
    },
    
    // Permessi espliciti
    permissions: [permissionSchema],
    
    // Campi per gestire gli ambiti di visibilità
    assignedSchoolIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        description: 'Scuole assegnate per ruoli con visibilità limitata'
    }],
    
    assignedClassIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        description: 'Classi assegnate per insegnanti e tutor'
    }],
    
    assignedStudentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        description: 'Studenti assegnati per tutor'
    }],
    
    // Gestione accesso ai test
    testAccessLevel: {
        type: Number,
        min: 0,
        max: 8,
        default: 8,
        description: 'Livello di accesso ai test (0-8 come da specifiche)'
    },
    
    // Flag per accesso al frontend pubblico e admin
    hasAdminAccess: {
        type: Boolean,
        default: false,
        description: 'Utente può accedere al frontend amministrativo'
    },
    
/*    // Mantenere i campi esistenti
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false,
        description: 'Scuola a cui l\'utente appartiene (per retrocompatibilità)'
    },*/
    
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
        description: 'Stato corrente dell\'utente'
    },
    
    lastLogin: {
        type: Date,
        description: 'Data e ora dell\'ultimo login'
    },
    
    loginAttempts: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Numero di tentativi di login falliti'
    },
    
    lockUntil: {
        type: Date,
        description: 'Account bloccato fino a questa data'
    },
    
    passwordHistory: [{
        password: String,
        changedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    sessionTokens: {
        type: [sessionTokenSchema],
        default: []
    },
    
    // Flag per soft delete
    isDeleted: {
        type: Boolean,
        default: false,
        description: 'Flag per indicare se l\'utente è stato rimosso (soft delete)'
    },
    
    deletedAt: {
        type: Date,
        description: 'Data e ora della cancellazione (soft delete)'
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
// userSchema.index({ schoolId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'sessionTokens.token': 1 });
userSchema.index({ 'sessionTokens.expiresAt': 1 });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ assignedSchoolId: 1 });
userSchema.index({ assignedClassIds: 1 });
userSchema.index({ assignedStudentIds: 1 });
userSchema.index({ isDeleted: 1 });

// Metodi di utilità per la gestione delle sessioni
userSchema.methods.addSessionToken = function(tokenData) {
    if (!this.sessionTokens) {
        this.sessionTokens = [];
    }
    
    // Log per debug
    console.log('Adding session token to user:', {
        userId: this._id,
        currentSessionsCount: this.sessionTokens.length,
        newTokenData: { ...tokenData, token: '***' }
    });
    
    // Rimuovi sessioni scadute
    this.sessionTokens = this.sessionTokens.filter(session => 
        session.expiresAt > new Date()
    );

    // Limita il numero di sessioni attive
    if (this.sessionTokens.length >= 5) {
        // Rimuovi la sessione più vecchia
        this.sessionTokens.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
        this.sessionTokens.shift();
    }

    this.sessionTokens.push(tokenData);
    this.markModified('sessionTokens'); // Importante: notifica mongoose della modifica
    return this;
};

userSchema.methods.removeSessionToken = function(token) {
    if (!this.sessionTokens) return this;
    
    this.sessionTokens = this.sessionTokens.filter(
        session => session.token !== token
    );
    return this;
};

userSchema.methods.updateSessionLastUsed = function(token) {
    const session = this.sessionTokens?.find(s => s.token === token);
    if (session) {
        session.lastUsedAt = new Date();
    }
    return this;
};

// Middleware per audit automatico
userSchema.pre('save', async function(next) {
    if (this.isNew) return next();
    
    const changes = this.modifiedPaths().reduce((acc, path) => {
        acc[path] = {
            old: this._original ? this._original[path] : undefined,
            new: this[path]
        };
        return acc;
    }, {});
    
    if (Object.keys(changes).length > 0) {
        try {
            // Verifica che UserAudit sia disponibile
            const UserAudit = mongoose.models.UserAudit || require('./UserAudit');
            await UserAudit.create({
                userId: this._id,
                action: 'updated',
                performedBy: this._performedBy || this._id,
                changes
            });
        } catch (error) {
            console.error('Error creating audit log:', error);
            // Non blocchiamo il salvataggio se l'audit fallisce
        }
    }
    
    next();
});

// Helper per tracciare chi fa le modifiche
userSchema.methods.setPerformer = function(userId) {
    this._performedBy = userId;
    return this;
};

// Metodo per ottenere la history
userSchema.methods.getAuditHistory = async function() {
    return mongoose.model('UserAudit')
        .find({ userId: this._id })
        .sort('-createdAt')
        .populate('performedBy', 'firstName lastName email');
};

// Metodo per verificare se l'account è bloccato
userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Metodo per inizializzare permessi basati sul ruolo
userSchema.methods.initializePermissions = function() {
    const permissionService = require('../services/PermissionService');
    const service = new permissionService();
    return service.initializeUserPermissions(this);
};

// Metodo virtuale per ottenere il nome completo
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook per hashare la password
userSchema.pre('save', async function(next) {
    // Hasha la password solo se è stata modificata o è nuova
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save hook per impostare valori predefiniti basati sul ruolo
userSchema.pre('save', function(next) {
    if (this.isNew) {
        // Imposta accesso all'admin per admin e developer
        if (['admin', 'developer'].includes(this.role)) {
            this.hasAdminAccess = true;
        }
        
        // Imposta livello di accesso ai test basato sul ruolo solo se non è già stato impostato
        if (this.testAccessLevel === undefined) {
            const testAccessLevels = {
                admin: 0,       // Tutti i test
                developer: 1,   // Tutti i test
                manager: 2,     // Test nella propria scuola
                pcto: 3,        // Test nella propria scuola
                teacher: 4,     // Test nelle proprie classi
                tutor: 5,       // Test assegnati ai propri studenti
                researcher: 6,  // Analytics con quotazione
                health: 7,      // Test con quotazione
                student: 8      // Test assegnati a se stesso
            };
            
            this.testAccessLevel = testAccessLevels[this.role] || 8;
        }
    }
    
    next();
});


module.exports = mongoose.model('User', userSchema);