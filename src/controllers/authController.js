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
     * Ottiene i dati dell'utente autenticato
     */
    getMe = async (req, res) => {
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

            // Recupera i dati aggiornati dell'utente
            const user = await this.userService.getUserById(req.user.id);

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // Recupera le sessioni attive dell'utente
            const activeSessions = await this.sessionService.getActiveSessions(req.user.id);

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
     * Login utente
     */
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Email e password sono richiesti'
                );
            }
    
            logger.debug('Login attempt:', { email });
    
            const result = await this.authService.login(
                email, 
                password, 
                {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            );
    
            // Imposta i cookie
            this.setTokenCookies(res, result.accessToken, result.refreshToken);
    
            logger.debug('Login successful, cookies set', {
                userId: result.user._id,
                tokensSet: {
                    access: !!result.accessToken,
                    refresh: !!result.refreshToken
                }
            });
    
            res.status(200).json({
                status: 'success',
                data: {
                    user: result.user,
                    accessToken: result.accessToken
                }
            });
    
        } catch (error) {
            logger.error('Login error:', {
                error: error.message,
                stack: error.stack
            });
            next(error);
        }
    }

    /**
     * Logout utente
     */
    logout = async (req, res) => {
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
    refreshToken = async (req, res) => {
        try {
            logger.debug('Refresh token request received', {
                cookies: req.cookies,
                headers: req.headers
            });
    
            const refreshToken = req.cookies['refresh-token'];
    
            if (!refreshToken || refreshToken === 'undefined') {
                throw createError(
                    ErrorTypes.AUTH.NO_TOKEN,
                    'Token di refresh non trovato'
                );
            }
    
            const result = await this.authService.refreshTokens(refreshToken);
    
            // Imposta i nuovi cookie
            this.setTokenCookies(res, result.accessToken, result.refreshToken);
    
            logger.debug('Refresh token successful', {
                userId: result.user.id,
                newTokens: {
                    accessToken: result.accessToken ? `${result.accessToken.substring(0, 10)}...` : null,
                    refreshToken: result.refreshToken ? `${result.refreshToken.substring(0, 10)}...` : null
                }
            });
    
            return this.sendResponse(res, {
                status: 'success',
                data: {
                    user: result.user,
                    accessToken: result.accessToken
                }
            });
        } catch (error) {
            logger.error('Refresh token failed', {
                error: error.message,
                stack: error.stack
            });
    
            // Se il token non è valido, pulisci i cookie
            this.clearTokenCookies(res);
            
            return this.handleError(res, error);
        }
    }

    /**
     * Richiesta reset password
     */
    forgotPassword = async (req, res) => {
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
    resetPassword = async (req, res) => {
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
     * Aggiorna password
     */
    updatePassword = async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
    
            logger.debug('Password update request', { 
                userId,
                ip: req.ip
            });
    
            if (!currentPassword || !newPassword) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Password corrente e nuova password richieste'
                );
            }
    
            // Usa l'authService che internamente gestisce la verifica della password corrente
            await this.authService.updatePassword(userId, currentPassword, newPassword);
    
            // Invalida tutte le sessioni esistenti per sicurezza
            await this.sessionService.removeAllSessions(userId);
    
            // Rimuovi i cookie attuali
            this.clearTokenCookies(res);
    
            logger.info('Password updated successfully', { userId });
    
            this.sendResponse(res, {
                status: 'success',
                message: 'Password aggiornata con successo. Effettua nuovamente il login.'
            });
        } catch (error) {
            logger.error('Password update failed', { 
                error,
                userId: req.user?.id 
            });
            this.handleError(res, error);
        }
    }

    /**
     * Utility per impostare i cookie dei token
     */
    setTokenCookies = (res, accessToken, refreshToken) => {
        logger.debug('Setting token cookies', {
            accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : null,
            refreshToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : null
        });
    
        if (accessToken) {
            res.cookie('access-token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Cambiato da 'strict' a 'lax' per migliore compatibilità
                maxAge: 60 * 60 * 1000 // 1 ora
            });
        }
    
        if (refreshToken) {
            res.cookie('refresh-token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Cambiato da 'strict' a 'lax' per migliore compatibilità
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni
            });
        }
    }

    /**
     * Utility per rimuovere i cookie dei token
     */
    clearTokenCookies = (res) => {
        res.cookie('access-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0)
        });
    
        res.cookie('refresh-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0)
        });
    
        logger.debug('Cookies cleared');
    }
}

module.exports = AuthController;