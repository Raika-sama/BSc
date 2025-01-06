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

    /**
     * Trova un utente per criteri specifici
     * @param {Object} criteria - Criteri di ricerca
     * @param {Object} options - Opzioni aggiuntive (select, populate)
     * @returns {Promise} Utente trovato
     */
    async findOne(criteria, options = {}) {
        try {
            let query = this.model.findOne(criteria);

            if (options.select) {
                query = query.select(options.select);
            }

            if (options.populate) {
                query = query.populate(options.populate);
            }

            return await query.exec();
        } catch (error) {
            throw new AppError(
                'Errore nella ricerca dell\'utente',
                500,
                'USER_FIND_ERROR',
                { error: error.message }
            );
        }
    }

    async updateMe(req, res) {
        try {
            logger.debug('Aggiornamento profilo utente:', {
                userId: req.user.id,
                updates: req.body
            });

            const updatedUser = await this.repository.updateUser(req.user.id, {
                ...req.body,
                schoolId: req.body.schoolId
            });

            logger.info('Profilo utente aggiornato con successo:', {
                userId: updatedUser._id,
                schoolId: updatedUser.schoolId
            });

            this.sendResponse(res, { 
                user: {
                    id: updatedUser._id,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    schoolId: updatedUser.schoolId
                }
            });
        } catch (error) {
            logger.error('Errore nell\'aggiornamento del profilo:', error);
            this.sendError(res, error);
        }
    }

    

}

module.exports = new UserController();