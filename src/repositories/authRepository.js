// src/repositories/AuthRepository.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AuthRepository {
    constructor(userModel) {
        this.userModel = userModel;
        this.RESET_TOKEN_EXPIRES = 3600000; // 1 ora in millisecondi
    }

    /**
 * Aggiorna la password dell'utente
 */
async updatePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        logger.debug('Password update request', { 
            userId,
            ip: req.ip
        });

        if (!currentPassword || !newPassword) {
            throw createError(
                ErrorTypes.VALIDATION.MISSING_FIELDS,
                'Password corrente e nuova password richieste'
            );
        }

        // Verifica la password corrente prima di procedere
        const user = await this.userService.verifyPassword(userId, currentPassword);

        // Aggiorna la password
        await this.authService.updatePassword(userId, newPassword);

        // Invalida tutte le sessioni esistenti per sicurezza
        await this.sessionService.removeAllSessions(userId);

        // Rimuovi i cookie attuali
        this.clearTokenCookies(res);

        logger.info('Password updated successfully', { userId });

        this.sendResponse(res, {
            status: 'success',
            message: 'Password aggiornata con successo. Effettua nuovamente il login.'
        });
    } catch (error) {
        logger.error('Password update failed', { 
            error,
            userId: req.user?.id 
        });
        this.handleError(res, error);
    }
}

/**
 * Ottiene i dati dell'utente autenticato
 */
async getMe(req, res) {
    try {
        logger.debug('Getting authenticated user data', { 
            userId: req.user?.id 
        });

        if (!req.user) {
            throw createError(
                ErrorTypes.AUTH.UNAUTHORIZED,
                'Utente non autenticato'
            );
        }

        // Recupera i dati aggiornati dell'utente con le sessioni attive
        const [user, activeSessions] = await Promise.all([
            this.userService.getUserById(req.user.id),
            this.sessionService.getActiveSessions(req.user.id)
        ]);

        if (!user) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Utente non trovato'
            );
        }

        logger.debug('User data retrieved successfully', { 
            userId: user._id,
            sessionCount: activeSessions.length
        });

        this.sendResponse(res, {
            status: 'success',
            data: {
                user,
                sessions: {
                    active: activeSessions.length,
                    current: req.sessionId
                }
            }
        });
    } catch (error) {
        logger.error('Error getting user data', { error });
        this.handleError(res, error);
    }
}

    /**
     * Verifica credenziali utente
     * @param {string} email - Email utente
     * @param {string} password - Password da verificare
     */
    async verifyCredentials(email, password) {
        try {
            const user = await this.userModel
                .findOne({ email })
                .select('+password');

            if (!user) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            return user;
        } catch (error) {
            logger.error('Error verifying credentials', { error, email });
            throw error;
        }
    }

    /**
     * Crea token per reset password
     * @param {string} email - Email utente
     */
    async createPasswordResetToken(email) {
        try {
            const user = await this.userModel.findOne({ email });
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            
            user.passwordResetExpires = Date.now() + this.RESET_TOKEN_EXPIRES;
            await user.save({ validateBeforeSave: false });

            logger.info('Password reset token created', { 
                userId: user._id 
            });

            return {
                user,
                resetToken
            };
        } catch (error) {
            logger.error('Error creating password reset token', { error });
            throw error;
        }
    }

    /**
     * Verifica token di reset password
     * @param {string} token - Token di reset
     */
    async verifyResetToken(token) {
        try {
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await this.userModel.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_INVALID,
                    'Token non valido o scaduto'
                );
            }

            return user;
        } catch (error) {
            logger.error('Error verifying reset token', { error });
            throw error;
        }
    }

    /**
     * Resetta la password di un utente
     * @param {string} token - Token di reset
     * @param {string} newPassword - Nuova password
     */
    async resetPassword(token, newPassword) {
        try {
            const user = await this.verifyResetToken(token);

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            // Aggiungi alla cronologia password
            if (!user.passwordHistory) {
                user.passwordHistory = [];
            }
            user.passwordHistory.unshift({
                password: user.password,
                changedAt: new Date()
            });

            // Mantieni solo le ultime 5 password
            if (user.passwordHistory.length > 5) {
                user.passwordHistory = user.passwordHistory.slice(0, 5);
            }

            await user.save();
            logger.info('Password reset successful', { userId: user._id });

            return user;
        } catch (error) {
            logger.error('Error resetting password', { error });
            throw error;
        }
    }

    /**
     * Aggiorna il timestamp dell'ultimo accesso
     * @param {string} userId - ID utente
     */
    async updateLastLogin(userId) {
        try {
            await this.userModel.findByIdAndUpdate(userId, {
                lastLogin: new Date()
            });
            logger.debug('Last login updated', { userId });
        } catch (error) {
            logger.error('Error updating last login', { error });
            throw error;
        }
    }

    /**
     * Invalida tutti i token di reset per un utente
     * @param {string} userId - ID utente
     */
    async invalidateResetTokens(userId) {
        try {
            await this.userModel.findByIdAndUpdate(userId, {
                passwordResetToken: undefined,
                passwordResetExpires: undefined
            });
            logger.info('Reset tokens invalidated', { userId });
        } catch (error) {
            logger.error('Error invalidating reset tokens', { error });
            throw error;
        }
    }
}

module.exports = AuthRepository;