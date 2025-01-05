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
// TO DO const { sendResetPasswordEmail } = require('../services/emailService');

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
        return jwt.sign(
            { id: userId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
    }

    /**
     * Invia il token nella risposta
     * @private
     */
    _sendTokenResponse(user, statusCode, res) {
        const token = this._createToken(user._id);

        const cookieExpires = new Date(
            Date.now() + (config.jwt.cookieExpiresIn || 24) * 60 * 60 * 1000
        );

        // Opzioni cookie
        const cookieOptions = {
            expires: cookieExpires,
            httpOnly: true,
            secure: config.env === 'production'
        };
        // Log per debug
        logger.debug('Cookie options', { 
            cookieExpiresIn: config.jwt.cookieExpiresIn,
            cookieExpires: cookieExpires
        });

        res.status(statusCode)
            .cookie('token', token, cookieOptions)
            .json({
                status: 'success',
                token,
                data: { user }
            });
    }

    /**
     * Registrazione nuovo utente
     * @public
     */
    async register(req, res, next) {
        try {
            const newUser = await this.repository.create(req.body);
            logger.info('Utente registrato con successo', { userId: newUser._id });
            this._sendTokenResponse(newUser, 201, res);
        } catch (error) {
            logger.error('Errore durante la registrazione', { error });
            next(error);
        }
    }

    /**
     * Login utente
     * @public
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELD,
                    'Inserire email e password'
                );
            }
    
            const user = await this.repository.verifyCredentials(email, password);
            this._sendTokenResponse(user, 200, res);
        } catch (error) {
            logger.error('Errore durante il login', { error });
            next(error);
        }
    }

    /**
     * Logout utente
     * @public
     */
    async logout(req, res) {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            status: 'success',
            data: null
        });
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

            // Per ora, restituisci il token direttamente (solo in development)
            res.status(200).json({
                status: 'success',
                message: 'Token generato',
                ...(config.env === 'development' && { resetToken })
            });
        } catch (error) {
            logger.error('Errore nella procedura di reset password', { error });
            next(error);
        }
    }

    /**
     * Reset password
     * @public
     */
    async resetPassword(req, res, next) {
        try {
            // Genera hash token
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

            // Set nuova password
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            logger.info('Password resettata con successo', { userId: user._id });
            this._sendTokenResponse(user, 200, res);
        } catch (error) {
            logger.error('Errore nel reset della password', { error });
            next(error);
        }
    }

    /**
     * Aggiorna password
     * @public
     */
    async updatePassword(req, res, next) {
        try {
            const user = await this.repository.findOne(
                { _id: req.user.id },
                { select: '+password' }
            );
    
            // Usa comparePassword invece di matchPassword
            if (!(await user.comparePassword(req.body.currentPassword))) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Password corrente non valida'
                );
            }
    
            user.password = req.body.newPassword;
            await user.save();
    
            logger.info('Password aggiornata con successo', { userId: user._id });
            this._sendTokenResponse(user, 200, res);
        } catch (error) {
            logger.error('Errore nell\'aggiornamento della password', { error });
            next(error);
        }
    }

    /**
     * Ottieni utente corrente
     * @public
     */
    async getMe(req, res, next) {
        try {
            const user = await this.repository.findById(req.user.id);
            res.status(200).json({
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Errore nel recupero del profilo utente', { error });
            next(error);
        }
    }
}

// Esporta una singola istanza
module.exports = new AuthController();