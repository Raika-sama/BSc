// src/repositories/AuthRepository.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AuthRepository {
    constructor(userModel) {
        this.model = userModel;
        this.RESET_TOKEN_EXPIRES = 36000000; // 10 ora in millisecondi
    }

    /**
     * Trova un utente per ID
     */
    async findById(userId) {
        try {
            return await this.model.findById(userId).lean();
        } catch (error) {
            logger.error('Error finding user by id', { error, userId });
            throw error;
        }
    }

  /**
     * Trova un utente per email
     */
    async findByEmail(email) {
        try {
            // Rimuovi .lean() e assicurati di avere una vera istanza mongoose
            const user = await this.model.findOne({ email })
                .select('+password +sessionTokens')
                .exec();
            
            // Debug log
            console.log('Found user:', {
                hasUser: !!user,
                isMongooseModel: user instanceof this.model,
                hasAddSessionToken: typeof user?.addSessionToken === 'function',
                sessionTokensCount: user?.sessionTokens?.length || 0
            });

            return user;
        } catch (error) {
            logger.error('Error finding user by email:', {
                error: error.message,
                email,
                stack: error.stack
            });
            throw error;
        }
    }

   /**
     * Aggiorna le informazioni di login
     */
    async updateLoginInfo(userId) {
        try {
            return await this.model.findByIdAndUpdate(userId, {
                $set: {
                    lastLogin: new Date(),
                    loginAttempts: 0,
                    lockUntil: null
                }
            }, { new: true });
        } catch (error) {
            logger.error('Error updating login info', { error, userId });
            throw error;
        }
    }


    /**
     * Incrementa i tentativi di login falliti
     */
    async incrementLoginAttempts(userId, maxAttempts, lockTime) {
        try {
            const user = await this.model.findById(userId);
            if (!user) return null;

            user.loginAttempts += 1;
            
            if (user.loginAttempts >= maxAttempts) {
                user.lockUntil = Date.now() + lockTime;
            }

            return await user.save();
        } catch (error) {
            logger.error('Error incrementing login attempts', { error, userId });
            throw error;
        }
    }


    /**
     * Aggiorna la password di un utente
     */
    async updatePassword(userId, hashedPassword) {
        try {
            const user = await this.model.findById(userId);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // Aggiungi vecchia password alla cronologia
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

            // Aggiorna la password
            user.password = hashedPassword;
            await user.save();

            logger.info('Password updated successfully', { userId });
            return user;
        } catch (error) {
            logger.error('Error updating password', { error, userId });
            throw error;
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
    /**
     * Verifica le credenziali dell'utente
     */
    async verifyCredentials(email, password) {
        try {
            const user = await this.model
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
        const user = await this.model.findOne({ email });
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

        return { user, resetToken };
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

            const user = await this.model.findOne({
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
            await this.model.findByIdAndUpdate(userId, {
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
            await this.model.findByIdAndUpdate(userId, {
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