// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const { user: UserRepository } = require('../repositories');

exports.protect = async (req, res, next) => {
    try {
        // 1) Controlla se il token esiste
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(createError(
                ErrorTypes.AUTH.UNAUTHORIZED,
                'Effettua il login per accedere'
            ));
        }

        // 2) Verifica il token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Usa UserRepository invece di User direttamente
        const user = await UserRepository.findById(decoded.id);
        
        if (!user) {
            throw createError(
                ErrorTypes.AUTH.NOT_AUTHENTICATED,
                'Utente non trovato'
            );
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('Errore di autenticazione:', error);  // Aggiungi log per debug
        next(createError(
            ErrorTypes.AUTH.NOT_AUTHENTICATED,
            'Non autorizzato ad accedere a questa risorsa'
        ));
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(createError(
                ErrorTypes.AUTH.FORBIDDEN,
                'Non hai i permessi per questa azione'
            ));
        }
        next();
    };
};