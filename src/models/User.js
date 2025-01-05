// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/errors/logger/logger'); // Assicurati che il path sia corretto
const crypto = require('crypto');

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
        select: false  // Aggiungi questa riga
    },
    role: {
        type: String,
        enum: ['teacher', 'admin'],
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false // per ora lo rendiamo opzionale
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true
});

// Pre-save hook per hashare la password
userSchema.pre('save', async function(next) {
    // Procedi solo se la password è stata modificata
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

    // Metodo per confrontare le password
    userSchema.methods.comparePassword = async function(candidatePassword) {
        try {
            console.log('Password stored:', this.password);
            console.log('Password received:', candidatePassword);
            
            const isMatch = await bcrypt.compare(candidatePassword, this.password);
            console.log('Password match:', isMatch);
            
            return isMatch;
        } catch (error) {
            console.error('Error comparing passwords:', error);
            return false;
        }
    };

    // Metodo per generare token reset password
    userSchema.methods.getResetPasswordToken = function() {
        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token e imposta sul campo resetPasswordToken
        this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Imposta la scadenza
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minuti

        return resetToken;
    };

// Indici
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
