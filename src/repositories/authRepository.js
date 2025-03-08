// src/repositories/AuthRepository.js
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AuthRepository {
    constructor(userModel) {
        this.model = userModel;
        this.RESET_TOKEN_EXPIRES = 36000000; // 10 ora in millisecondi
        this.repositoryName = 'AuthRepository';
    }

    /**
     * Trova un utente per ID
     */
    async findById(userId) {
        try {
            return await this.model.findById(userId).lean();
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findById',
                { userId },
                this.repositoryName
            );
        }
    }

    /**
     * Trova un utente per email
     */
    async findByEmail(email) {
        try {
            const user = await this.model.findOne({ email })
                .select('+password +sessionTokens')
                .exec();
            
            logger.debug('User lookup result:', {
                found: !!user,
                hasPassword: !!user?.password,
                passwordLength: user?.password?.length, // Aggiungi questa riga
                email: email
            });

            return user;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findByEmail',
                { email },
                this.repositoryName
            );
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
            throw handleRepositoryError(
                error,
                'updateLoginInfo',
                { userId },
                this.repositoryName
            );
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
            throw handleRepositoryError(
                error,
                'incrementLoginAttempts',
                { userId, maxAttempts, lockTime },
                this.repositoryName
            );
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
            throw handleRepositoryError(
                error,
                'updatePassword',
                { userId },
                this.repositoryName
            );
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
            if (error.code) return error; // Se è già un errore formattato, restituiscilo direttamente
            throw handleRepositoryError(
                error,
                'verifyCredentials',
                { email },
                this.repositoryName
            );
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
            throw handleRepositoryError(
                error,
                'createPasswordResetToken',
                { email },
                this.repositoryName
            );
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
            // Se è un errore di tipo "token non valido", restituiscilo direttamente
            if (error.code === ErrorTypes.AUTH.TOKEN_INVALID.code) {
                return error;
            }
            throw handleRepositoryError(
                error,
                'verifyResetToken',
                { token: '***' }, // Nascondiamo il token per sicurezza
                this.repositoryName
            );
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
            // Se è un errore di token, restituiscilo
            if (user.code && user.status) return user;

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
            throw handleRepositoryError(
                error,
                'resetPassword',
                { token: '***' }, // Nascondiamo il token per sicurezza
                this.repositoryName
            );
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
            throw handleRepositoryError(
                error,
                'updateLastLogin',
                { userId },
                this.repositoryName
            );
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
            throw handleRepositoryError(
                error,
                'invalidateResetTokens',
                { userId },
                this.repositoryName
            );
        }
    }
}

module.exports = AuthRepository;