/**
 * @file authController.js
 * @description Controller per la gestione dell'autenticazione
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const config = require('../config/config');
const { user: UserRepository } = require('../repositories');
const UserAudit = require('../models/UserAudit');

class AuthController {
    constructor() {
        this.repository = UserRepository;
        
        // Binding dei metodi
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.logout = this.logout.bind(this);
        this.getMe = this.getMe.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.updatePassword = this.updatePassword.bind(this);
    }

    /**
     * Genera il token JWT
     * @private
     */
    _createToken(userId) {
        const token = jwt.sign(
            { id: userId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Calcola la data di scadenza del token
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);

        return { token, expiresAt };
    }

    /**
     * Invia il token nella risposta
     * @private
     */
    async _sendTokenResponse(user, statusCode, res, req) {
        try {
            const { token, expiresAt } = this._createToken(user._id);

            logger.debug('Token generation successful', { 
                userId: user._id,
                tokenLength: token.length,
                expiresAt
            });

            // Crea la sessione token
            const sessionToken = {
                token,
                createdAt: new Date(),
                lastUsedAt: new Date(),
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt
            };

            // Usa il nuovo metodo addSessionToken
            user.addSessionToken(sessionToken);
            await user.save({ validateBeforeSave: false });

            // Filtriamo i dati sensibili per la risposta
            const userResponse = {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                schoolId: user.schoolId
            };

            logger.info('Login successful', {
                userId: user._id,
                role: user.role,
                ip: req.ip
            });

            res.status(statusCode).json({
                status: 'success',
                token,
                expiresAt,
                data: { user: userResponse }
            });
        } catch (error) {
            logger.error('Error in _sendTokenResponse', {
                error: error.message,
                stack: error.stack,
                userId: user._id
            });
            throw error;
        }
    }


    /**
     * Registrazione nuovo utente
     * @public
     */
    async register(req, res, next) {
        try {
            const { email, password, firstName, lastName, role } = req.body;
            logger.debug('Registering new user:', { email, firstName, lastName, role });
    
            if (!email || !password || !firstName || !lastName || !role) {
                logger.warn('Missing required fields for user registration');
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELD,
                    'Dati utente incompleti'
                );
            }
    
            // Verifica esistenza email
            const existingUser = await this.repository.findByEmail(email);
            if (existingUser) {
                logger.warn('Email already exists:', email);
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }
    
            const user = await this.repository.create({
                email,
                password,
                role,
                firstName,
                lastName,
                status: 'active'
            });
    
            logger.info('New user registered successfully:', { userId: user._id });
            
            // Audit trail
            await UserAudit.create({
                userId: user._id,
                action: 'user_created',
                performedBy: req.user?.id || user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            await this._sendTokenResponse(user, 201, res, req); // Aggiunto await e req
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login utente
     * @public
     */
/**
     * Login utente
     * @public
     */
async login(req, res, next) {
    try {
        const { email, password } = req.body;
        logger.debug('Login attempt', { 
            email,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        if (!email || !password) {
            throw createError(
                ErrorTypes.VALIDATION.MISSING_FIELD,
                'Inserire email e password'
            );
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw createError(
                ErrorTypes.AUTH.INVALID_CREDENTIALS,
                'Credenziali non valide'
            );
        }

        // Verifica se l'account è bloccato
        if (user.isLocked()) {
            throw createError(
                ErrorTypes.AUTH.ACCOUNT_LOCKED,
                'Account temporaneamente bloccato'
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts += 1;
            
            // Blocca l'account dopo 5 tentativi falliti
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minuti
                logger.warn('Account locked due to multiple failed attempts', {
                    userId: user._id,
                    lockUntil: user.lockUntil
                });
            }
            
            await user.save({ validateBeforeSave: false });
            
            throw createError(
                ErrorTypes.AUTH.INVALID_CREDENTIALS,
                'Credenziali non valide'
            );
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        await UserAudit.create({
            userId: user._id,
            action: 'login',
            performedBy: user._id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        await this._sendTokenResponse(user, 200, res, req);
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
}


    /**
     * Logout utente
     * @public
     */
    async logout(req, res, next) {
        try {
            if (req.user) {
                const token = req.headers.authorization?.split(' ')[1];
                
                if (token) {
                    const user = await User.findById(req.user.id);
                    if (user) {
                        // Usa il nuovo metodo removeSessionToken
                        user.removeSessionToken(token);
                        await user.save({ validateBeforeSave: false });
                    }
                }

                await UserAudit.create({
                    userId: req.user.id,
                    action: 'logout',
                    performedBy: req.user.id,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });
            }

            logger.info('User logged out successfully:', { 
                userId: req.user?.id,
                ip: req.ip
            });

            res.status(200).json({
                status: 'success',
                data: null
            });
        } catch (error) {
            logger.error('Logout error:', error);
            next(error);
        }
    }

    /**
     * Richiesta reset password
     * @public
     */
    async forgotPassword(req, res, next) {
        try {
            const user = await this.repository.findOne({ email: req.body.email });

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Non esiste un utente con questa email'
                );
            }

            // Genera token reset
            const resetToken = user.getResetPasswordToken();
            await user.save({ validateBeforeSave: false });

            // Audit trail
            await UserAudit.create({
                userId: user._id,
                action: 'password_reset_requested',
                performedBy: user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            // Per ora, restituisci il token direttamente (solo in development)
            res.status(200).json({
                status: 'success',
                message: 'Token generato',
                ...(config.env === 'development' && { resetToken })
            });
        } catch (error) {
            logger.error('Password reset request error:', error);
            next(error);
        }
    }

    /**
     * Reset password
     * @public
     */
    async resetPassword(req, res, next) {
        try {
            const resetPasswordToken = crypto
                .createHash('sha256')
                .update(req.params.token)
                .digest('hex');

            const user = await this.repository.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_INVALID,
                    'Token non valido o scaduto'
                );
            }

            // Salva vecchia password nella history
            user.passwordHistory = user.passwordHistory || [];
            user.passwordHistory.push({
                password: user.password,
                changedAt: new Date()
            });

            // Limita la history a 5 password
            if (user.passwordHistory.length > 5) {
                user.passwordHistory.shift();
            }

            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            // Audit trail
            await UserAudit.create({
                userId: user._id,
                action: 'password_reset_completed',
                performedBy: user._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            logger.info('Password reset completed:', { userId: user._id });
            this._sendTokenResponse(user, 200, res);
        } catch (error) {
            logger.error('Password reset error:', error);
            next(error);
        }
    }

    /**
     * Aggiorna password
     * @public
     */
    async updatePassword(req, res, next) {
        try {
            const user = await this.repository.findById(req.user.id).select('+password');
    
            if (!(await user.comparePassword(req.body.currentPassword))) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Password corrente non valida'
                );
            }

            // Salva vecchia password nella history
            user.passwordHistory = user.passwordHistory || [];
            user.passwordHistory.push({
                password: user.password,
                changedAt: new Date()
            });

            // Limita la history a 5 password
            if (user.passwordHistory.length > 5) {
                user.passwordHistory.shift();
            }
    
            user.password = req.body.newPassword;
            await user.save();

            // Audit trail
            await UserAudit.create({
                userId: user._id,
                action: 'password_changed',
                performedBy: req.user.id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
    
            logger.info('Password updated successfully:', { userId: user._id });
            await this._sendTokenResponse(user, 200, res, req); // Aggiunto await e req
        } catch (error) {
            logger.error('Password update error:', error);
            next(error);
        }
    }

    /**
     * Ottieni utente corrente
     * @public
     */
    async getMe(req, res, next) {
        try {
            logger.debug('GetMe - Request user:', { 
                userId: req.user.id, 
                user_Id: req.user._id 
            });

            const user = await this.repository.findById(req.user._id || req.user.id);

            if (!user) {
                logger.error('User not found in database', {
                    requestedId: req.user.id,
                    requested_Id: req.user._id
                });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            logger.info('User profile retrieved successfully:', {
                userId: user._id,
                email: user.email
            });

            res.status(200).json({
                status: 'success',
                data: { 
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions,
                        schoolId: user.schoolId
                    }
                }
            });
        } catch (error) {
            logger.error('Get user profile error:', error);
            next(error);
        }
    }
}

module.exports = new AuthController();