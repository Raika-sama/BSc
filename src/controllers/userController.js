// src/controllers/UserController.js
const BaseController = require('./baseController');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class UserController extends BaseController {
    constructor(userService, sessionService) {
        super(null, 'user'); // Passiamo null come repository perché useremo il service
        this.userService = userService;
        this.sessionService = sessionService;
    }

    /**
     * Crea nuovo utente
     */
    async create(req, res) {
        try {
            const userData = req.body;
            logger.debug('Creating new user', { 
                email: userData.email,
                role: userData.role 
            });

            const user = await this.userService.createUser(userData);

            logger.info('User created', { 
                userId: user._id 
            });

            this.sendResponse(res, {
                status: 'success',
                data: { user }
            }, 201);
        } catch (error) {
            logger.error('User creation failed', { error });
            this.handleError(res, error);
        }
    }


// Chiama tutti gli utenti
async getAll(req, res) {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        console.log('Controller getAll called with:', {
            page,
            limit,
            search,
            user: req.user?.id
        });

        const result = await this.userService.listUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            search
        });

        console.log('Controller sending response:', {
            userCount: result.users.length,
            total: result.total,
            page: result.page,
            responseStructure: {
                status: 'success',
                data: {
                    users: `[${result.users.length} items]`,
                    total: result.total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

        return this.sendResponse(res, {
            status: 'success',
            data: {
                users: result.users,
                total: result.total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Controller Error:', error);
        return this.sendError(res, error);
    }
}

    /**
     * Ottiene utente per ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await this.userService.getUserById(id);

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Get user failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Aggiorna utente
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            logger.debug('Updating user', { 
                userId: id,
                updates: updateData
            });

            const user = await this.userService.updateUser(id, updateData);

            logger.info('User updated', { userId: id });

            this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('User update failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Elimina utente
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            logger.debug('Deleting user', { userId: id });

            await this.userService.deleteUser(id);
            await this.sessionService.removeAllSessions(id);

            logger.info('User deleted', { userId: id });

            this.sendResponse(res, {
                status: 'success',
                message: 'Utente eliminato con successo'
            });
        } catch (error) {
            logger.error('User deletion failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Ottiene profilo utente corrente
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.userService.getUserById(userId);

            this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Get profile failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Aggiorna profilo utente corrente
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            logger.debug('Updating user profile', { 
                userId,
                updates: updateData
            });

            const user = await this.userService.updateUser(userId, updateData);

            logger.info('Profile updated', { userId });

            this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Profile update failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Gestisce i permessi utente
     */
    async managePermissions(req, res) {
        try {
            const { id } = req.params;
            const { permissions, action } = req.body;

            if (!permissions || !action) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Permessi e azione richiesti'
                );
            }

            logger.debug('Managing user permissions', { 
                userId: id,
                action,
                permissions 
            });

            const user = await this.userService.managePermissions(
                id,
                permissions,
                action
            );

            logger.info('Permissions updated', { 
                userId: id,
                action 
            });

            this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Permission management failed', { error });
            this.handleError(res, error);
        }
    }

    /**
     * Lista utenti con filtri e paginazione
     */
    async list(req, res) {
        try {
            const { page, limit, ...filters } = req.query;

            const result = await this.userService.listUsers(filters, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            });

            this.sendResponse(res, {
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('List users failed', { error });
            this.handleError(res, error);
        }
    }
}

module.exports = UserController;