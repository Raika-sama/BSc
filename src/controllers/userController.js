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
            const { email, password, firstName, lastName, role } = req.body;
    
            if (!email || !password || !firstName || !lastName || !role) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Dati utente incompleti',
                    code: 'VALIDATION_ERROR'
                });
            }
    
            const user = await this.repository.create({
                email,
                password,
                role,
                firstName,
                lastName
            });
    
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

    async getAll({ page = 1, limit = 10, search = '' }) {
        try {
            const query = {};
            
            // Aggiungi filtro di ricerca se presente
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            // Calcola skip per la paginazione
            const skip = (page - 1) * limit;

            // Esegui query con paginazione
            const users = await this.repository.model
                .find(query)
                .select('-password') // Escludi il campo password
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            // Conta totale documenti per paginazione
            const total = await this.repository.model.countDocuments(query);

            return {
                users,
                total
            };
        } catch (error) {
            logger.error('Error getting users:', error);
            throw error;
        }
    }   

/**
     * Aggiorna un utente esistente
     */
    async update(req, res) {
        try {
            const userId = req.params.id;
            const updates = req.body;

            logger.debug('Updating user:', {
                userId,
                updates: { ...updates, password: undefined } // Log sicuro
            });

            // Verifica che l'utente esista
            const existingUser = await this.repository.findById(userId);
            if (!existingUser) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Utente non trovato',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Usa updateUser invece di update
            const updatedUser = await this.repository.updateUser(userId, updates);

           

            return this.sendResponse(res, {
                status: 'success',
                data: {
                    user: updatedUser
                }
            });
        } catch (error) {
            logger.error('Error updating user:', error);
            
            // Se l'errore è di tipo "not found"
        if (error.code === ErrorTypes.RESOURCE.NOT_FOUND.code) {
            return this.sendError(res, {
                statusCode: 404,
                message: error.message,
                code: error.code
            });
        }

        // Per altri tipi di errori
        return this.sendError(res, {
            statusCode: 500,
            message: 'Errore durante l\'aggiornamento dell\'utente',
            code: error.code || 'UPDATE_ERROR',
            error: error.message
        });
        }
    }

    /**
     * Elimina un utente
     */
    async delete(req, res) {
        try {
            const userId = req.params.id;

            logger.debug('Deleting user:', { userId });

            const deletedUser = await this.repository.delete(userId);

            if (!deletedUser) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Utente non trovato',
                    code: 'USER_NOT_FOUND'
                });
            }

            logger.info('User deleted successfully:', { userId });

            this.sendResponse(res, {
                status: 'success',
                data: {
                    message: 'Utente eliminato con successo'
                }
            });
        } catch (error) {
            logger.error('Error deleting user:', error);
            this.sendError(res, error);
        }
    }


}

module.exports = new UserController();