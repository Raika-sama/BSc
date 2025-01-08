// src/repositories/UserRepository.js

const BaseRepository = require('./base/BaseRepository');
const { User } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
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

    async findById(id) {
        try {
            logger.debug('Finding user by id:', { id });
            const user = await this.model.findById(id).select('+schoolId +role');
            
            if (!user) {
                logger.debug('No user found with id:', { id });
                return null;
            }
            
            logger.debug('User found:', { userId: user._id });
            return user;
        } catch (error) {
            logger.error('Error finding user by id:', { 
                error: error.message, 
                id 
            });
            throw error;
        }
    }


    async findByEmail(email, includePassword = false) {
        try {
            const query = this.model.findOne({ email });
            if (includePassword) {
                query.select('+password');
            }
            const user = await query;
            return user;
        } catch (error) {
            logger.error('Errore nella ricerca utente per email', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca utente per email',
                { originalError: error.message }
            );
        }
    }

    async createUser(userData) {
        try {
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                logger.warn('Tentativo di registrazione con email esistente', { email: userData.email });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }

            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);

            return await this.create(userData);
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella creazione utente', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella creazione utente',
                { originalError: error.message }
            );
        }
    }

    async verifyCredentials(email, password) {
        try {
            const user = await this.findByEmail(email, true);
            
            if (!user) {
                logger.warn('Tentativo di login con email non esistente', { email });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }
    
            if (!user.isActive) {
                logger.warn('Tentativo di login con account disattivato', { email });
                throw createError(
                    ErrorTypes.AUTH.UNAUTHORIZED,
                    'Account disattivato'
                );
            }
    
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                logger.warn('Tentativo di login con password errata', { email });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }
    
            user.lastLogin = new Date();
            await user.save();
    
            user.password = undefined;
            return user;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella verifica delle credenziali', { error });
            throw createError(
                ErrorTypes.AUTH.UNAUTHORIZED,
                'Errore nella verifica delle credenziali',
                { originalError: error.message }
            );
        }
    }

    async createPasswordResetToken(email) {
        try {
            const user = await this.findByEmail(email);
            if (!user) {
                logger.warn('Tentativo di reset password per email non esistente', { email });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Nessun account trovato con questa email'
                );
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
                
            user.passwordResetExpires = Date.now() + 3600000;
            
            await user.save({ validateBeforeSave: false });

            return { token: resetToken, user };
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella creazione del token di reset', { error });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Errore nella creazione del token di reset',
                { originalError: error.message }
            );
        }
    }

    async resetPassword(token, newPassword) {
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
                logger.warn('Tentativo di reset password con token non valido', { token });
                throw createError(
                    ErrorTypes.AUTH.TOKEN_INVALID,
                    'Token non valido o scaduto'
                );
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await user.save();
            return user;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nel reset della password', { error });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Errore nel reset della password',
                { originalError: error.message }
            );
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.findById(userId, { select: '+password' });
    
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                logger.warn('Tentativo di cambio password con password corrente errata', { userId });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Password attuale non corretta'
                );
            }
    
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            
            await user.save();
            
            user.password = undefined;
            return user;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nel cambio password', { error });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Errore nel cambio password',
                { originalError: error.message }
            );
        }
    }

    async updateUser(userId, updateData) {
        try {
            const { password, passwordResetToken, passwordResetExpires, ...safeData } = updateData;
            
            // Usa this.model.findByIdAndUpdate invece di this.findByIdAndUpdate
            const user = await this.model.findByIdAndUpdate(
                userId,
                { $set: safeData },
                { new: true, runValidators: true }
            );
    
            if (!user) {
                logger.warn('Tentativo di aggiornamento utente non esistente', { userId });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }
    
            return user;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nell\'aggiornamento utente', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiornamento utente',
                { originalError: error.message }
            );
        }
    }
}

module.exports = UserRepository;