const mongoose = require('mongoose');

const userAuditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['created', 'updated', 'deleted', 'password_changed', 'role_changed', 'login', 'logout'],
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

userAuditSchema.index({ userId: 1, createdAt: -1 });
userAuditSchema.index({ action: 1 });

module.exports = mongoose.model('UserAudit', userAuditSchema);