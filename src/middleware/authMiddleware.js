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
        logger.debug('Token ricevuto:', {
            authHeader: req.headers.authorization,
            token: req.headers.authorization?.split(' ')[1]?.substring(0, 20) + '...'
        });
        // 1. Verifica presenza del token
        let token;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            throw createError(
                ErrorTypes.AUTH.NO_TOKEN,
                'Token di autenticazione mancante'
            );
        }

        // 2. Estrai e verifica il token
        const decoded = jwt.verify(token, config.jwt.secret);

        logger.debug('Token decodificato:', {
            userId: decoded.id,
            exp: new Date(decoded.exp * 1000)
        });

        // 3. Carica i dati completi dell'utente
        const user = await UserRepository.findById(decoded.id);

        if (!user) {
            throw createError(
                ErrorTypes.AUTH.USER_NOT_FOUND,
                'Utente non trovato'
            );
        }

        // 4. Aggiungi i dati alla richiesta - MODIFICATO
        req.user = {
            id: user._id.toString(), // Assicurati che sia una stringa
            _id: user._id,
            schoolId: user.schoolId ? user.schoolId.toString() : null,
            role: user.role,
            tokenExp: decoded.exp
        };

        logger.debug('Dati utente caricati nel middleware:', {
            userId: req.user.id,
            schoolId: req.user.schoolId,
            role: req.user.role
        });

        logger.info('Autenticazione completata con successo:', {
            userId: user._id,
            hasSchool: !!user.schoolId,
            role: user.role
        });

        next();
    } catch (error) {
        logger.error('Errore di autenticazione:', {
            error: error.message,
            stack: error.stack
        });

        // 5. Gestione specifica degli errori
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Token non valido',
                    code: 'AUTH_INVALID_TOKEN'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Sessione scaduta, effettua nuovamente il login',
                    code: 'AUTH_TOKEN_EXPIRED'
                }
            });
        }

        // Gestione errori generici
        const statusCode = error.statusCode || 401;
        res.status(statusCode).json({
            status: 'error',
            error: {
                message: error.message,
                code: error.code || 'AUTH_ERROR'
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