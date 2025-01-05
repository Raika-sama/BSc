// src/controllers/userController.js

const BaseController = require('./baseController');
const { user: UserRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');

class UserController extends BaseController {
    constructor() {
        super(UserRepository, 'user');
    }

    /**
     * Login utente
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Email e password richieste',
                    code: 'VALIDATION_ERROR'
                });
            }

            // TODO: Implementare logica JWT
            const user = await this.repository.findByEmail(email);
            // TODO: Implementare verifica password
            
            this.sendResponse(res, { 
                user,
                token: 'JWT_TOKEN' // TODO: Generare token JWT
            });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Registrazione nuovo utente
     */
    async register(req, res) {
        try {
            const { email, password, name, role } = req.body;

            if (!email || !password || !name || !role) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Dati utente incompleti',
                    code: 'VALIDATION_ERROR'
                });
            }

            const user = await this.repository.create(req.body);
            logger.info('Nuovo utente registrato', { userId: user._id });

            this.sendResponse(res, { user }, 201);
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Reset password
     */
    async forgotPassword(req, res) {
        // TODO: Implementare logica reset password
        this.sendResponse(res, { message: 'Email di reset inviata' });
    }
}

module.exports = new UserController();