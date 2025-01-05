// gestirà tutte le operazioni specifiche per gli utenti.
// src/repositories/UserRepository.js

const BaseRepository = require('./base/BaseRepository');
const { User } = require('../models');
const { AppError } = require('../utils/errors/AppError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Repository per la gestione delle operazioni specifiche degli utenti
 * Estende le funzionalità base del BaseRepository
 */
class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    /**
     * Trova un utente per email
     * @param {String} email - Email dell'utente
     * @returns {Promise} Utente trovato
     */
    async findByEmail(email) {
        try {
            const user = await this.model.findOne({ email });
            return user;
        } catch (error) {
            throw new AppError(
                'Errore nella ricerca utente per email',
                500,
                'EMAIL_SEARCH_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Crea un nuovo utente con password criptata
     * @param {Object} userData - Dati dell'utente
     * @returns {Promise} Utente creato
     */
    async createUser(userData) {
        try {
            // Verifica se l'email esiste già
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new AppError(
                    'Email già registrata',
                    400,
                    'EMAIL_EXISTS'
                );
            }

            // Cripta la password
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);

            // Crea l'utente
            return await this.create(userData);
        } catch (error) {
            throw new AppError(
                'Errore nella creazione utente',
                error.statusCode || 500,
                error.code || 'USER_CREATION_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Verifica le credenziali dell'utente
     * @param {String} email - Email dell'utente
     * @param {String} password - Password da verificare
     * @returns {Promise} Utente autenticato
     */
    async verifyCredentials(email, password) {
        try {
            const user = await this.findByEmail(email);
            
            if (!user) {
                throw new AppError(
                    'Credenziali non valide',
                    401,
                    'INVALID_CREDENTIALS'
                );
            }

            if (!user.isActive) {
                throw new AppError(
                    'Account disattivato',
                    401,
                    'ACCOUNT_INACTIVE'
                );
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new AppError(
                    'Credenziali non valide',
                    401,
                    'INVALID_CREDENTIALS'
                );
            }

            // Aggiorna ultimo accesso
            user.lastLogin = new Date();
            await user.save();

            return user;
        } catch (error) {
            throw new AppError(
                'Errore nella verifica delle credenziali',
                error.statusCode || 500,
                error.code || 'AUTH_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Genera token per reset password
     * @param {String} email - Email dell'utente
     * @returns {Promise<{token: String, user: Object}>} Token e utente
     */
    async createPasswordResetToken(email) {
        try {
            const user = await this.findByEmail(email);
            if (!user) {
                throw new AppError(
                    'Nessun account trovato con questa email',
                    404,
                    'EMAIL_NOT_FOUND'
                );
            }

            // Genera token
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
                
            // Token valido per 1 ora
            user.passwordResetExpires = Date.now() + 3600000;
            
            await user.save({ validateBeforeSave: false });

            return { token: resetToken, user };
        } catch (error) {
            throw new AppError(
                'Errore nella creazione del token di reset',
                error.statusCode || 500,
                error.code || 'RESET_TOKEN_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Reset della password utente
     * @param {String} token - Token di reset
     * @param {String} newPassword - Nuova password
     * @returns {Promise} Utente aggiornato
     */
    async resetPassword(token, newPassword) {
        try {
            // Cerca utente con token valido
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await this.model.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new AppError(
                    'Token non valido o scaduto',
                    400,
                    'INVALID_TOKEN'
                );
            }

            // Aggiorna password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await user.save();
            return user;
        } catch (error) {
            throw new AppError(
                'Errore nel reset della password',
                error.statusCode || 500,
                error.code || 'PASSWORD_RESET_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Cambio password utente
     * @param {String} userId - ID dell'utente
     * @param {String} currentPassword - Password attuale
     * @param {String} newPassword - Nuova password
     * @returns {Promise} Utente aggiornato
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.findById(userId);

            // Verifica password attuale
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw new AppError(
                    'Password attuale non corretta',
                    400,
                    'INVALID_CURRENT_PASSWORD'
                );
            }

            // Aggiorna password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            
            await user.save();
            return user;
        } catch (error) {
            throw new AppError(
                'Errore nel cambio password',
                error.statusCode || 500,
                error.code || 'PASSWORD_CHANGE_ERROR',
                { error: error.message }
            );
        }
    }
}

module.exports = UserRepository;