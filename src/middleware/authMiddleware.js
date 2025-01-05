// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const  AppError  = require('../utils/errors/AppError');  // Assicurati che il path sia corretto
const { user: UserRepository } = require('../repositories');

exports.protect = async (req, res, next) => {
    try {
        // 1) Verifica se il token esiste
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new AppError(
                'Non sei loggato. Effettua il login per accedere.',
                401,
                'AUTH_REQUIRED'
            );
        }

        // 2) Verifica il token
        const decoded = jwt.verify(token, config.jwt.secret);

        // 3) Verifica se l'utente esiste ancora
        const currentUser = await UserRepository.findById(decoded.id);
        if (!currentUser) {
            throw new AppError(
                'L\'utente di questo token non esiste più.',
                401,
                'USER_NOT_FOUND'
            );
        }


        // Concedi accesso alla route protetta
        req.user = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new AppError(
                'Non hai i permessi per questa azione',
                403,
                'FORBIDDEN_ACCESS'
            );
        }
        next();
    };
};