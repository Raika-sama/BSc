const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema per l'autenticazione degli studenti
 * Gestisce le credenziali di accesso e lo stato dell'account studente
 */
const studentAuthSchema = new mongoose.Schema({
    // Riferimento allo studente
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        unique: true,
        description: 'ID dello studente associato'
    },

    // Credenziali di accesso
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        description: 'Username dello studente (email)'
    },
    password: {
        type: String,
        required: true,
        select: false,
        description: 'Password hashata dello studente'
    },
    
    // Flag e stato account
    isFirstAccess: {
        type: Boolean,
        default: true,
        description: 'Indica se è il primo accesso dello studente'
    },
    isActive: {
        type: Boolean,
        default: true,
        description: 'Indica se l\'account è attivo'
    },
    temporaryPassword: {
        type: String,
        select: false,
        description: 'Password temporanea per il primo accesso'
    },
    temporaryPasswordExpires: {
        type: Date,
        description: 'Scadenza della password temporanea'
    },

    // Gestione accessi
    lastLogin: {
        type: Date,
        description: 'Data e ora dell\'ultimo accesso'
    },
    loginAttempts: {
        type: Number,
        default: 0,
        description: 'Numero di tentativi di login falliti'
    },
    lockUntil: {
        type: Date,
        description: 'Account bloccato fino a questa data'
    },

    // Token per reset password e verifica email
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Sessione corrente
    currentSession: {
        token: String,
        createdAt: Date,
        expiresAt: Date,
        deviceInfo: {
            userAgent: String,
            ipAddress: String
        }
    }
}, {
    timestamps: true,
    collection: 'studentAuth'
});

// Indici per ottimizzare le query
studentAuthSchema.index({ studentId: 1 }, { unique: true });
studentAuthSchema.index({ username: 1 }, { unique: true });
studentAuthSchema.index({ isActive: 1 });
studentAuthSchema.index({ 'currentSession.token': 1 });

// Pre-save hook per hashare la password
studentAuthSchema.pre('save', async function(next) {
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

// Pre-save hook per la password temporanea
studentAuthSchema.pre('save', async function(next) {
    if (this.isModified('temporaryPassword') && this.temporaryPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.temporaryPassword = await bcrypt.hash(this.temporaryPassword, salt);
        } catch (error) {
            next(error);
        }
    }
    next();
});

// Metodo per verificare la password
studentAuthSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Se è il primo accesso e c'è una password temporanea, verifica quella
        if (this.isFirstAccess && this.temporaryPassword) {
            const isMatch = await bcrypt.compare(candidatePassword, this.temporaryPassword);
            if (isMatch && this.temporaryPasswordExpires > Date.now()) {
                return true;
            }
        }
        
        // Altrimenti verifica la password normale
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Errore durante la verifica della password');
    }
};

// Metodo per verificare se l'account è bloccato
studentAuthSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Metodo per generare password temporanea
studentAuthSchema.methods.generateTemporaryPassword = function() {
    // Genera una password di 8 caratteri con lettere e numeri
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    this.temporaryPassword = password;
    this.temporaryPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore
    this.isFirstAccess = true;
    
    return password;
};

// Virtual per ottenere informazioni studente
studentAuthSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true
});

// Configurazione toJSON
studentAuthSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.temporaryPassword;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
    }
});

const StudentAuth = mongoose.model('StudentAuth', studentAuthSchema);
module.exports = StudentAuth;