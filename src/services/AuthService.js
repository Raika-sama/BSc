// src/services/AuthService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const ms = require('ms');

class AuthService {
    constructor(authRepository, sessionService) {
        this.authRepository = authRepository;
        this.sessionService = sessionService;
        this.tokenBlacklist = new Set();
    
        // Configurazione token
        this.JWT_SECRET = config.jwt.secret;
        this.JWT_REFRESH_SECRET = config.jwt.refreshSecret;
        this.JWT_EXPIRES_IN = config.jwt.expiresIn || '1h';
        this.REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn || '7d';
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCK_TIME = 15 * 60 * 1000; // 15 minuti
    }

    /**
     * Genera token JWT
     * @param {Object} user - Utente per cui generare il token
     * @returns {Object} Access token e refresh token
     */
    generateTokens(user) {
        try {
            // Access Token
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    role: user.role,
                    schoolId: user.schoolId
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );

            // Refresh Token
            const refreshToken = jwt.sign(
                { id: user._id },
                this.JWT_REFRESH_SECRET,
                { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
            );

            logger.debug('Tokens generated successfully', {
                userId: user._id
            });

            return { accessToken, refreshToken };
        } catch (error) {
            logger.error('Token generation error:', error);
            throw createError(
                ErrorTypes.AUTH.TOKEN_GENERATION_FAILED,
                'Errore nella generazione dei token'
            );
        }
    }


    /**
     * Verifica un token JWT
     * @param {string} token - Token da verificare
     * @returns {Object} Payload decodificato
     */
    verifyToken(token) {
        try {
            if (this.tokenBlacklist.has(token)) {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_BLACKLISTED,
                    'Token non più valido'
                );
            }

            const decoded = jwt.verify(token, this.JWT_SECRET);
            return decoded;
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw createError(
                    ErrorTypes.AUTH.INVALID_TOKEN,
                    'Token non valido'
                );
            }
            if (error.name === 'TokenExpiredError') {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_EXPIRED,
                    'Token scaduto'
                );
            }
            throw error;
        }
    }

    /**
     * Login utente
     * @param {string} email - Email utente
     * @param {string} password - Password utente
     * @param {Object} metadata - Metadati sessione (IP, user agent, etc.)
     */
    async login(email, password, metadata) {
        try {
            logger.debug('Authentication attempt', { email });

            // Verifica credenziali
            const user = await this.authRepository.findByEmail(email);
            if (!user) {
                throw createError(
                    ErrorTypes.AUTH.USER_NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // Verifica se l'account è bloccato
            if (user.lockUntil && user.lockUntil > Date.now()) {
                throw createError(
                    ErrorTypes.AUTH.ACCOUNT_LOCKED,
                    'Account temporaneamente bloccato. Riprova più tardi.'
                );
            }

            // Verifica password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                await this.handleFailedLogin(user);
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Genera tokens
            const { accessToken, refreshToken } = this.generateTokens(user);

            // Crea sessione e aggiorna info login
            await Promise.all([
                this.sessionService.createSession(user._id, {
                    token: refreshToken,
                    ...metadata
                }),
                this.authRepository.updateLoginInfo(user._id)
            ]);

            // Sanitizza l'utente per la risposta
            const sanitizedUser = this.sanitizeUser(user);

            logger.info('Login successful', { 
                userId: user._id,
                metadata 
            });

            return {
                user: sanitizedUser,
                accessToken,
                refreshToken
            };

        } catch (error) {
            logger.error('Login error:', {
                error: error.message,
                email
            });
            throw error;
        }
    }
    /**
     * Gestisce tentativi di login falliti
     * @param {Object} user - Utente che ha fallito il login
     */
    async handleFailedLogin(user) {
        user.loginAttempts += 1;
        
        if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = Date.now() + this.LOCK_TIME;
            logger.warn('Account locked due to too many failed attempts', {
                userId: user._id,
                attempts: user.loginAttempts
            });
        }
        
        await user.save();
    }

    /**
     * Crea una nuova sessione per l'utente
     * @param {Object} user - Utente
     * @param {string} refreshToken - Refresh token
     * @param {Object} metadata - Metadati sessione
     */
    async createSession(user, refreshToken, metadata) {
        const sessionData = {
            token: refreshToken,
            userAgent: metadata.userAgent,
            ipAddress: metadata.ipAddress,
            expiresAt: new Date(Date.now() + ms(this.REFRESH_TOKEN_EXPIRES_IN))
        };

        await user.addSessionToken(sessionData);
        await user.save();
    }

    /**
     * Logout utente
     * @param {string} refreshToken - Refresh token da invalidare
     */
    async logout(refreshToken) {
        try {
            // Aggiungi token alla blacklist
            this.tokenBlacklist.add(refreshToken);

            // Decodifica token per ottenere userId
            const decoded = this.verifyToken(refreshToken);
            const user = await this.userRepository.findById(decoded.id);

            if (user) {
                // Rimuovi sessione
                await user.removeSessionToken(refreshToken);
                await user.save();
            }

            logger.info('User logged out successfully', {
                userId: decoded.id
            });
        } catch (error) {
            logger.error('Logout error', { error });
            throw error;
        }
    }

    async updatePassword(userId, currentPassword, newPassword) {
        // Verifica la password corrente
        const user = await this.authRepository.verifyCredentials(user.email, currentPassword);
        
        // Se la verifica passa, aggiorna la password
        return this.authRepository.updatePassword(userId, newPassword);
    }

    /**
     * Sanitizza oggetto utente per risposta
     * @param {Object} user - Utente da sanitizzare
     */
    sanitizeUser(user) {
        if (!user) return null;
        
        const sanitized = user.toObject ? user.toObject() : { ...user };
        const { 
            password, 
            passwordResetToken, 
            passwordResetExpires,
            sessionTokens,
            ...safeUser 
        } = sanitized;
        
        return safeUser;
    }
}

module.exports = AuthService;