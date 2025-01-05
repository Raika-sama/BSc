// src/controllers/authController.js

/**
 * @file authController.js
 * @description Controller per la gestione dell'autenticazione
 * @author Raika-sama
 * @date 2025-01-05
 */

const jwt = require('jsonwebtoken');
const repositories = require('../repositories');  // Modifica qui - rimuovi le parentesi graffe
const config = require('../config/config');
const { AppError } = require('../utils/errors/AppError');
const logger = require('../utils/errors/logger/logger');

class AuthController {
    constructor() {
        this.userRepository = repositories.user;
    }

    /**
     * Genera JWT token
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
     * Imposta il cookie con il token
     * @private
     */
    _setCookies(res, token) {
        res.cookie('jwt', token, config.jwt.cookieOptions);
    }

    /**
     * Registrazione nuovo utente
     */
    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, role } = req.body;

            // Validazione input
            if (!firstName || !lastName || !email || !password) {
                throw new AppError(
                    'Tutti i campi sono obbligatori',
                    400,
                    'MISSING_FIELDS'
                );
            }

            // Crea utente
            const user = await this.userRepository.createUser({
                firstName,
                lastName,
                email,
                password,
                role: role || 'teacher' // Default role
            });

            // Genera token
            const token = this._createToken(user._id);

            // Imposta cookie
            this._setCookies(res, token);

            // Log successo
            logger.info('Nuovo utente registrato', { userId: user._id });

            // Rimuovi password dalla response
            user.password = undefined;

            res.status(201).json({
                status: 'success',
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login utente
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Validazione input
            if (!email || !password) {
                throw new AppError(
                    'Email e password sono obbligatori',
                    400,
                    'MISSING_CREDENTIALS'
                );
            }

            // Verifica credenziali
            const user = await this.userRepository.verifyCredentials(email, password);

            // Genera token
            const token = this._createToken(user._id);

            // Imposta cookie
            this._setCookies(res, token);

            // Log successo
            logger.info('Login utente effettuato', { userId: user._id });

            // Rimuovi password dalla response
            user.password = undefined;

            res.status(200).json({
                status: 'success',
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout utente
     */
    async logout(req, res) {
        // Pulisci cookie
        res.cookie('jwt', 'loggedout', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            status: 'success',
            message: 'Logout effettuato con successo'
        });
    }

    /**
     * Reset password
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                throw new AppError(
                    'Email obbligatoria',
                    400,
                    'MISSING_EMAIL'
                );
            }

            // Genera token reset
            const { token, user } = await this.userRepository.createPasswordResetToken(email);

            // TODO: Inviare email con token
            // Per ora lo restituiamo nella response (solo in development)
            if (config.env === 'development') {
                res.status(200).json({
                    status: 'success',
                    message: 'Token inviato via email',
                    data: { token }
                });
            } else {
                res.status(200).json({
                    status: 'success',
                    message: 'Token inviato via email'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset password con token
     */
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                throw new AppError(
                    'Token e password sono obbligatori',
                    400,
                    'MISSING_FIELDS'
                );
            }

            // Reset password
            const user = await this.userRepository.resetPassword(token, password);

            // Genera nuovo token
            const jwtToken = this._createToken(user._id);

            // Imposta cookie
            this._setCookies(res, jwtToken);

            // Log successo
            logger.info('Password resettata con successo', { userId: user._id });

            res.status(200).json({
                status: 'success',
                message: 'Password aggiornata con successo',
                data: {
                    token: jwtToken
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();