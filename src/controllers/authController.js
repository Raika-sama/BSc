// src/controllers/AuthController.js
const BaseController = require('./baseController');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class AuthController extends BaseController {
    constructor(authService, userService, sessionService) {
        super();
        this.authService = authService;
        this.userService = userService;
        this.sessionService = sessionService;
    }

    /**
     * Login utente
     */
    async login(req, res) {
        try {
            logger.debug('Login attempt', { 
                email: req.body.email,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            const { email, password } = req.body;

            if (!email || !password) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Email e password sono richiesti'
                );
            }

            const metadata = {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            };

            const { user, accessToken, refreshToken } = 
                await this.authService.login(email, password, metadata);

            // Imposta cookie sicuri
            this.setTokenCookies(res, accessToken, refreshToken);

            logger.info('Login successful', { 
                userId: user._id
            });

            this.sendResponse(res, {
                status: 'success',
                user,
                accessToken
            });
        } catch (error) {
            logger.error('Login failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Logout utente
     */
    async logout(req, res) {
        try {
            const refreshToken = req.cookies['refresh-token'];

            if (refreshToken) {
                await this.authService.logout(refreshToken);
                await this.sessionService.removeSession(req.user.id, refreshToken);
            }

            // Rimuovi cookie
            this.clearTokenCookies(res);

            logger.info('Logout successful', { 
                userId: req.user.id 
            });

            this.sendResponse(res, {
                status: 'success',
                message: 'Logout effettuato con successo'
            });
        } catch (error) {
            logger.error('Logout failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Refresh del token di accesso
     */
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies['refresh-token'];

            if (!refreshToken) {
                throw createError(
                    ErrorTypes.AUTH.NO_TOKEN,
                    'Token di refresh non trovato'
                );
            }

            const { user, accessToken, newRefreshToken } = 
                await this.authService.refreshTokens(refreshToken);

            // Aggiorna cookie
            this.setTokenCookies(res, accessToken, newRefreshToken);

            logger.info('Token refreshed', { 
                userId: user._id 
            });

            this.sendResponse(res, {
                status: 'success',
                accessToken
            });
        } catch (error) {
            logger.error('Token refresh failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Richiesta reset password
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Email richiesta'
                );
            }

            await this.authService.requestPasswordReset(email);

            logger.info('Password reset requested', { email });

            this.sendResponse(res, {
                status: 'success',
                message: 'Email di reset inviata con successo'
            });
        } catch (error) {
            logger.error('Password reset request failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Reset password
     */
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Token e nuova password richiesti'
                );
            }

            await this.authService.resetPassword(token, password);

            logger.info('Password reset successful');

            this.sendResponse(res, {
                status: 'success',
                message: 'Password aggiornata con successo'
            });
        } catch (error) {
            logger.error('Password reset failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Cambio password
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Password corrente e nuova password richieste'
                );
            }

            await this.authService.changePassword(
                userId, 
                currentPassword, 
                newPassword
            );

            // Invalida tutte le sessioni esistenti
            await this.sessionService.removeAllSessions(userId);

            logger.info('Password changed', { userId });

            this.sendResponse(res, {
                status: 'success',
                message: 'Password cambiata con successo'
            });
        } catch (error) {
            logger.error('Password change failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Utility per impostare i cookie dei token
     */
    setTokenCookies(res, accessToken, refreshToken) {
        res.cookie('access-token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minuti
        });

        res.cookie('refresh-token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni
        });
    }

    /**
     * Utility per rimuovere i cookie dei token
     */
    clearTokenCookies(res) {
        res.clearCookie('access-token');
        res.clearCookie('refresh-token');
    }
}

module.exports = AuthController;