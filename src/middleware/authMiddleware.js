// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

const { user: UserRepository } = require('../repositories');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(createError(
                ErrorTypes.AUTH.UNAUTHORIZED,
                'Effettua il login per accedere'
            ));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const currentUser = await UserRepository.findById(decoded.id);

        if (!currentUser) {
            return next(createError(
                ErrorTypes.AUTH.UNAUTHORIZED,
                'L\'utente non esiste più'
            ));
        }

        req.user = currentUser;
        next();
    } catch (error) {
        logger.error('Errore di autenticazione', { error });
        next(createError(
            ErrorTypes.AUTH.TOKEN_INVALID,
            'Token non valido o scaduto'
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