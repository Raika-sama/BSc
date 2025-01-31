const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        validate: {
            validator: function(v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale'
        }
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
        required: function() {
            return this.role === 'teacher' || this.role === 'manager';
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    passwordHistory: [{
        password: String,
        changedAt: Date
    }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    sessionTokens: [{
        token: String,
        createdAt: Date,
        lastUsedAt: Date,
        userAgent: String,
        ipAddress: String
    }]
}, {
    timestamps: true
});

// Middleware per audit automatico
userSchema.pre('save', async function(next) {
    if (this.isNew) return next(); // Skip per nuovi utenti
    
    const changes = this.modifiedPaths().reduce((acc, path) => {
      acc[path] = {
        old: this._original ? this._original[path] : undefined,
        new: this[path]
      };
      return acc;
    }, {});
  
    if (Object.keys(changes).length > 0) {
      await mongoose.model('UserAudit').create({
        userId: this._id,
        action: 'updated',
        performedBy: this._performedBy || this._id, // _performedBy settato dal controller
        changes
      });
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
  
// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ schoolId: 1 });
userSchema.index({ status: 1 });

// Methods and middleware...

module.exports = mongoose.model('User', userSchema);