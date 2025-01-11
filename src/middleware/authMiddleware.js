// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const { user: UserRepository } = require('../repositories');

/**
 * Middleware di protezione delle route
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const protect = async (req, res, next) => {
    try {
        // 1. Log iniziale della richiesta
        logger.debug('⭐ PROTECT MIDDLEWARE START', {
            path: req.path,
            method: req.method,
            headers: req.headers,
            cookies: req.cookies
        });

        // 2. Verifica token
        let token;
        const authHeader = req.headers.authorization;
        logger.debug('🔍 Examining Authorization Header', {
            hasAuthHeader: !!authHeader,
            headerValue: authHeader,
            startsWith: authHeader?.startsWith('Bearer '),
            hasCookieToken: !!req.cookies?.token
        });
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            logger.debug('📝 Token extracted from header', { token: token?.substring(0, 20) + '...' });
        } else if (req.cookies?.token) {
            token = req.cookies.token;
            logger.debug('📝 Token extracted from cookies', { token: token?.substring(0, 20) + '...' });
        }

        if (!token) {
            logger.warn('❌ No token found in request');
            throw createError(
                ErrorTypes.AUTH.NO_TOKEN,
                'Token di autenticazione mancante'
            );
        }

        // 3. Decodifica e verifica token
        logger.debug('🔑 Attempting to verify token');
        const decoded = jwt.verify(token, config.jwt.secret);
        logger.debug('✅ Token verified successfully', {
            decoded: {
                id: decoded.id,
                exp: new Date(decoded.exp * 1000),
                iat: new Date(decoded.iat * 1000),
                timeUntilExpiration: ((decoded.exp * 1000) - Date.now()) / 1000 / 60 + ' minutes'
            }
        });

        // 4. Ricerca utente
        logger.debug('👤 Looking up user', { userId: decoded.id });
        const user = await UserRepository.findById(decoded.id);
        logger.debug('👤 User lookup result', {
            found: !!user,
            userData: user ? {
                id: user._id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                hasSchoolId: !!user.schoolId,
                schoolId: user.schoolId?.toString()
            } : 'null'
        });

        if (!user) {
            logger.warn('❌ User not found in database', { userId: decoded.id });
            throw createError(
                ErrorTypes.AUTH.USER_NOT_FOUND,
                'Utente non trovato'
            );
        }

        // 5. Setup user in request
        const userForRequest = {
            id: user._id.toString(),
            _id: user._id,
            schoolId: user.schoolId?.toString() || null,
            role: user.role,
            tokenExp: decoded.exp
        };

        logger.debug('📋 Setting user in request', {
            userForRequest,
            originalUser: {
                id: user._id,
                role: user.role,
                schoolId: user.schoolId
            }
        });

        req.user = userForRequest;

        // 6. Log finale successo
        logger.info('✨ Authentication successful', {
            userId: user._id,
            role: user.role,
            hasSchool: !!user.schoolId,
            tokenExpiresIn: ((decoded.exp * 1000) - Date.now()) / 1000 / 60 + ' minutes'
        });

        next();
    } catch (error) {
        // 7. Gestione errori dettagliata
        logger.error('🔥 Authentication Error', {
            errorType: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            stack: error.stack,
            tokenInfo: error.expiredAt ? {
                expiredAt: error.expiredAt,
                now: new Date()
            } : undefined
        });

        if (error.name === 'JsonWebTokenError') {
            logger.debug('🔑 JWT Validation Failed', { 
                error: error.message,
                type: 'invalid_token'
            });
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Token non valido',
                    code: 'AUTH_INVALID_TOKEN'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            logger.debug('🔑 JWT Expired', { 
                expiredAt: error.expiredAt,
                type: 'token_expired'
            });
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Sessione scaduta, effettua nuovamente il login',
                    code: 'AUTH_TOKEN_EXPIRED'
                }
            });
        }

        const statusCode = error.statusCode || 401;
        res.status(statusCode).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'AUTH_ERROR',
                type: error.name
            }
        });
    }
};
/**
 * Middleware per la restrizione degli accessi basata sui ruoli
 * @param {...String} roles - Ruoli autorizzati
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(
                ErrorTypes.AUTH.NO_AUTH,
                'Autenticazione richiesta'
            ));
        }

        if (!roles.includes(req.user.role)) {
            return next(createError(
                ErrorTypes.AUTH.FORBIDDEN,
                'Non hai i permessi per questa azione'
            ));
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo
};