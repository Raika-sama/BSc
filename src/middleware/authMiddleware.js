// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError } = require('../utils/errors/AppError');
const repositories = require('../repositories'); 


// Usa l'istanza singleton invece di crearne una nuova
const userRepository = repositories.user;  // Modifica qui

exports.protect = async (req, res, next) => {
    try {
        // 1. Ottieni il token
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            throw new AppError(
                'Non sei autenticato',
                401,
                'AUTH_REQUIRED'
            );
        }

        // 2. Verifica il token
        const decoded = jwt.verify(token, config.jwt.secret);

        // 3. Verifica se l'utente esiste ancora
        const user = await userRepository.findById(decoded.id);
        if (!user) {
            throw new AppError(
                'Utente non più esistente',
                401,
                'USER_NOT_FOUND'
            );
        }

        // 4. Controlla se l'utente è attivo
        if (!user.isActive) {
            throw new AppError(
                'Account disattivato',
                401,
                'ACCOUNT_INACTIVE'
            );
        }

        // Aggiungi l'utente alla request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'Non hai i permessi per questa azione',
                    403,
                    'FORBIDDEN_ACCESS'
                )
            );
        }
        next();
    };
};