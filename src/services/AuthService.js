// src/services/AuthService.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.tokenBlacklist = new Set(); // In produzione usare Redis
        
        // Configurazione token
        this.JWT_SECRET = config.jwt.secret;
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
                this.JWT_SECRET,
                { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
            );

            logger.debug('Tokens generated successfully', {
                userId: user._id,
                tokenType: 'JWT'
            });

            return { accessToken, refreshToken };
        } catch (error) {
            logger.error('Error generating tokens', { error });
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
            const user = await this.userRepository.findByEmail(email, true);
            
            if (!user) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Verifica se l'account è bloccato
            if (user.isLocked()) {
                const timeLeft = (user.lockUntil - Date.now()) / 1000 / 60;
                throw createError(
                    ErrorTypes.AUTH.ACCOUNT_LOCKED,
                    `Account bloccato. Riprova tra ${Math.round(timeLeft)} minuti`
                );
            }

            // Verifica password
            const isValid = await user.verifyPassword(password);
            if (!isValid) {
                await this.handleFailedLogin(user);
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Reset tentativi di login falliti
            if (user.loginAttempts > 0) {
                user.loginAttempts = 0;
                user.lockUntil = null;
            }

            // Genera tokens
            const tokens = this.generateTokens(user);

            // Aggiorna ultimo accesso
            user.lastLogin = new Date();
            await user.save();

            // Crea sessione
            await this.createSession(user, tokens.refreshToken, metadata);

            return {
                user: this.sanitizeUser(user),
                ...tokens
            };
        } catch (error) {
            logger.error('Login error', { error, email });
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

    /**
     * Sanitizza oggetto utente per risposta
     * @param {Object} user - Utente da sanitizzare
     */
    sanitizeUser(user) {
        const { password, passwordResetToken, passwordResetExpires, ...safeUser } = user.toObject();
        return safeUser;
    }
}

module.exports = AuthService;