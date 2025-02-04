// src/middleware/authMiddleware.js
const rateLimit = require('express-rate-limit');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

// Rate Limiter per tentativi di login
const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minuti
    max: 5, // limite di 5 tentativi
    message: 'Troppi tentativi di login. Riprova più tardi.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            status: 'error',
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Troppi tentativi. Riprova più tardi.'
            }
        });
    }
});

class AuthMiddleware {
    constructor(authService, sessionService) {
        if (!authService) throw new Error('AuthService is required');
        if (!sessionService) throw new Error('SessionService is required');
        
        this.authService = authService;
        this.sessionService = sessionService;
        this.tokenBlacklist = new Set();
    }
    /*
     * Middleware di protezione route
     */
    protect = async (req, res, next) => {
        try {
            const token = this.extractToken(req);
            
            if (!token) {
                throw createError(
                    ErrorTypes.AUTH.NO_TOKEN,
                    'Autenticazione richiesta'
                );
            }
    
            // Verifica blacklist
            if (this.tokenBlacklist.has(token)) {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_BLACKLISTED,
                    'Token non più valido'
                );
            }
    
            // Verifica e decodifica token
            const decoded = await this.authService.verifyToken(token);
    
            logger.debug('Token decoded:', {
                userId: decoded.id,
                sessionId: decoded.sessionId,
                path: req.path
            });
    
            // Verifica sessione
            const { user, session } = await this.sessionService.validateSession(
                decoded.sessionId
            );
    
            // Aggiungi user al request
            req.user = {
                id: decoded.id,
                role: decoded.role,
                permissions: decoded.permissions,
                sessionId: decoded.sessionId
            };
    
            logger.debug('Authentication successful', {
                userId: decoded.id,
                path: req.path,
                sessionId: decoded.sessionId
            });
    
            next();
        } catch (error) {
            logger.error('Authentication failed', {
                error,
                path: req.path,
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * Estrae token dalla request
     */
    extractToken = (req) => {
        if (req.cookies && req.cookies['access-token']) {
            return req.cookies['access-token'];
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }

        return null;
    };

    /**
     * Aggiunge token alla blacklist
     */
    blacklistToken = (token) => {
        this.tokenBlacklist.add(token);
        // In produzione, impostare TTL basato sulla scadenza del token
        setTimeout(() => {
            this.tokenBlacklist.delete(token);
        }, 24 * 60 * 60 * 1000); // 24 ore
    };
}

// Crea singleton con i servizi
// Factory function
const createAuthMiddleware = (authService, sessionService) => {
    const middleware = new AuthMiddleware(authService, sessionService);
    return {
        loginLimiter,
        protect: middleware.protect.bind(middleware),
        restrictTo: (...roles) => (req, res, next) => {
            if (!req.user) {
                return next(createError(ErrorTypes.AUTH.NO_USER, 'User not found'));
            }
            if (!roles.includes(req.user.role)) {
                return next(createError(ErrorTypes.AUTH.FORBIDDEN, 'Not authorized'));
            }
            next();
        }
    };
};

module.exports = createAuthMiddleware;
