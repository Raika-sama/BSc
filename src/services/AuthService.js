// src/services/AuthService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const ms = require('ms');

class AuthService {
    constructor(authRepository, sessionService, userRepository) {
        if (!authRepository) throw new Error('AuthRepository is required');
        if (!sessionService) throw new Error('SessionService is required');
        if (!userRepository) throw new Error('UserRepository is required');
        
        this.authRepository = authRepository;
        this.sessionService = sessionService;
        this.userRepository = userRepository;
        this.tokenBlacklist = new Set();
    
        // Configurazione token
        this.JWT_SECRET = config.jwt.secret;
        this.JWT_REFRESH_SECRET = config.jwt.refreshSecret;
        this.JWT_EXPIRES_IN = config.jwt.expiresIn || '1h';
        this.REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn || '7d';
        this.MAX_LOGIN_ATTEMPTS = 100;
        this.LOCK_TIME = 24 * 60 * 60 * 1000; // 24h
    }

    /**
     * Genera token JWT
     * @param {Object} user - Utente per cui generare il token
     * @returns {Object} Access token e refresh token
     */
    generateTokens(user, sessionToken) {
        try {
            // Access Token
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    role: user.role,
                    schoolId: user.schoolId,
                    sessionId: sessionToken,
                    permissions: user.permissions
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );
    
            // Refresh Token
            const refreshToken = jwt.sign(
                { 
                    id: user._id,
                    sessionId: sessionToken
                },
                this.JWT_REFRESH_SECRET,
                { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
            );
    
            logger.debug('Tokens generated successfully', {
                userId: user._id,
                hasSessionToken: !!sessionToken
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
     * Refresh dei token
     * @param {string} refreshToken - Token di refresh da verificare
     */
    refreshTokens = async (refreshToken) => {
        try {
            logger.debug('Starting token refresh process', { 
                tokenExists: !!refreshToken,
                tokenLength: refreshToken?.length 
            });

            if (!refreshToken || typeof refreshToken !== 'string') {
                throw createError(
                    ErrorTypes.AUTH.INVALID_TOKEN,
                    'Token di refresh non valido'
                );
            }

            // Verifica il refresh token
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET);
                logger.debug('Token decoded successfully', { 
                    userId: decoded.id,
                    sessionId: decoded.sessionId
                });
            } catch (jwtError) {
                logger.error('JWT verification failed', { 
                    error: jwtError.message,
                    type: jwtError.name 
                });
                throw createError(
                    ErrorTypes.AUTH.INVALID_TOKEN,
                    'Token di refresh non valido'
                );
            }

            // Recupera l'utente
            const user = await this.userRepository.findById(decoded.id);
            if (!user) {
                throw createError(
                    ErrorTypes.AUTH.USER_NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // Verifica la sessione
            const session = user.sessionTokens?.find(s => s.token === decoded.sessionId);
            if (!session) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_SESSION,
                    'Sessione non trovata'
                );
            }

            // Verifica scadenza sessione
            if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                // Rimuovi la sessione scaduta
                await this.sessionService.removeSession(user._id, decoded.sessionId);
                throw createError(
                    ErrorTypes.AUTH.SESSION_EXPIRED,
                    'Sessione scaduta'
                );
            }

            // Genera nuovi token
            const tokens = this.generateTokens(user, decoded.sessionId);
            
            // Aggiorna il timestamp della sessione
            await this.sessionService.updateSessionLastUsed(user._id, decoded.sessionId);

            logger.info('Tokens refreshed successfully', { 
                userId: user._id,
                sessionId: decoded.sessionId
            });

            return {
                user: this.sanitizeUser(user),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };

        } catch (error) {
            logger.error('Token refresh failed:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
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
            logger.debug('Authentication attempt', { 
                email,
                hasPassword: !!password,
                passwordLength: password?.length 
            });
    
            // Verifica credenziali
            const user = await this.authRepository.findByEmail(email);
            
            logger.debug('User found:', {
                exists: !!user,
                hasPassword: !!user?.password,
                storedPasswordLength: user?.password?.length,
                loginAttempts: user?.loginAttempts
            });
    
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
    
            // Log pre-verifica password
            logger.debug('Attempting password comparison', {
                providedPassword: !!password,
                storedPassword: !!user.password
            });
    
            // Verifica password
            const isMatch = await bcrypt.compare(password, user.password);
            
            // Log post-verifica password
            logger.debug('Password comparison result:', {
                isMatch,
                loginAttempts: user.loginAttempts
            });
    
            if (!isMatch) {
                await this.handleFailedLogin(user);
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }
    
               // Crea token di sessione con più informazioni
               const sessionToken = jwt.sign(
                { 
                    userId: user._id,
                    createdAt: Date.now(),
                    userAgent: metadata.userAgent
                }, 
                this.JWT_SECRET
            );

            logger.debug('Session token created', {
                userId: user._id,
                tokenLength: sessionToken.length
            });

            // Crea la sessione
            await this.sessionService.createSession(user, sessionToken, {
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress,
                expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
                token: sessionToken
            });

            // Genera i tokens includendo il sessionToken
            const { accessToken, refreshToken } = this.generateTokens(user, sessionToken);

            logger.debug('Tokens generated', {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                refreshTokenLength: refreshToken.length
            });

            // Aggiorna info login
            await this.authRepository.updateLoginInfo(user._id);
    
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
                email,
                stack: error.stack
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

    /**
     * Aggiornamento del metodo updatePassword per gestire correttamente l'utente
     */
    async updatePassword(userId, currentPassword, newPassword) {
            try {
                // Recupera l'utente
                const user = await this.userRepository.findById(userId);
                if (!user) {
                    throw createError(
                        ErrorTypes.RESOURCE.NOT_FOUND,
                        'Utente non trovato'
                    );
                }

                // Verifica la password corrente
                const isValid = await bcrypt.compare(currentPassword, user.password);
                if (!isValid) {
                    throw createError(
                        ErrorTypes.AUTH.INVALID_CREDENTIALS,
                        'Password corrente non valida'
                    );
                }

                // Hash della nuova password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await this.hashPassword(userData.password);
                logger.debug('Password hashing:', {
                    originalLength: userData.password.length,
                    hashedLength: hashedPassword.length,
                    isHashed: hashedPassword.startsWith('$2')
                });
                
                // Aggiorna la password
                return this.authRepository.updatePassword(userId, hashedPassword);
            } catch (error) {
                logger.error('Password update error:', {
                    error: error.message,
                    userId
                });
                throw error;
            }
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