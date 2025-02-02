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

const userSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
        /*validate: {
            validator: function(v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale'
        }*/
    },
    role: {
        type: String,
        enum: ['teacher', 'admin', 'manager'],
        required: true
    },
    permissions: [{
        type: String,
        enum: [
            'users:read', 'users:write',
            'schools:read', 'schools:write',
            'classes:read', 'classes:write',
            'tests:read', 'tests:write',
            'results:read', 'results:write'
        ]
    }],
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        /*required: function() {
            return this.role === 'teacher' || this.role === 'manager';
        }*/
        required: false  // Cambiamo da required function a false

    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0,
        min: 0
    },
    lockUntil: Date,
    passwordHistory: [{
        password: String,
        changedAt: {
            type: Date,
            default: Date.now
        }
    }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    sessionTokens: [sessionTokenSchema],
    default: []
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ schoolId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'sessionTokens.token': 1 });
userSchema.index({ 'sessionTokens.expiresAt': 1 });


userSchema.pre('save', function(next) {
    if (!this.sessionTokens) {
        this.sessionTokens = [];
    }
    next();
});

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

module.exports = mongoose.model('User', userSchema);