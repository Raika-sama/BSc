// src/controllers/UserController.js
const BaseController = require('./baseController');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class UserController extends BaseController {
    constructor(userService, sessionService) {
        super(null, 'user'); // Passiamo null come repository perché useremo il service
        this.userService = userService;
        this.sessionService = sessionService;
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.getAvailableManagers = this.getAvailableManagers.bind(this);
    }

    /**
     * Crea nuovo utente
     */
    async create(req, res) {
        try {
            const userData = req.body;
            console.log('Creating new user with data:', {
                ...userData,
                password: '[REDACTED]'
            });
    
            // Aggiunta controlli preliminari
            if (!userData.email || !userData.password || !userData.firstName || !userData.lastName || !userData.role) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Campi obbligatori mancanti'
                ));
            }
    
            const user = await this.userService.createUser(userData);
            
            console.log('User created successfully:', {
                id: user._id,
                email: user.email,
                role: user.role
            });
    
            return this.sendResponse(res, {
                status: 'success',
                data: { user }
            }, 201);
        } catch (error) {
            console.error('User creation failed:', error);
            
            // Gestione specifica degli errori
            if (error.code === ErrorTypes.VALIDATION.INVALID_DATA) {
                return this.sendError(res, error, 400);
            }
            if (error.code === 11000) { // MongoDB duplicate key error
                return this.sendError(res, createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                ));
            }
            
            return this.sendError(res, error);
        }
    }


// Chiama tutti gli utenti
async getAll(req, res) {
    try {
        const { page = 1, limit = 10, search = '', sort = '-createdAt', ...otherFilters } = req.query;
        
        console.log('Controller getAll called with:', {
            page,
            limit,
            search,
            sort,
            otherFilters,
            user: req.user?.id
        });

        const result = await this.userService.listUsers(
            {
                page,
                limit,
                search,
                ...otherFilters
            },
            { sort }
        );

        console.log('Controller received result:', {
            usersCount: result.users.length,
            total: result.total,
            page: result.page
        });

        return this.sendResponse(res, {
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Controller Error:', error);
        return this.sendError(res, error);
    }
}

    /**
     * Ottiene utente per ID
     */
// src/controllers/UserController.js
async getById(req, res) {
    try {
        const { id } = req.params;
        console.log('UserController: Getting user by ID:', {
            requestedId: id,
            requestingUser: req.user?.id
        });

        const user = await this.userService.getUserById(id);
        
        console.log('UserController: User found:', {
            found: !!user,
            userData: user ? { id: user._id, email: user.email } : null
        });

        if (!user) {
            return this.sendError(res, createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Utente non trovato'
            ));
        }

        return this.sendResponse(res, {
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('UserController: Get user failed:', error);
        return this.sendError(res, error);
    }
}

/**
 * Recupera gli utenti disponibili per il ruolo di manager
 */
async getAvailableManagers(req, res) {
    try {
        logger.debug('Fetching available managers');

        // Modifica qui per usare direttamente findWithFilters
        const result = await this.userService.findWithFilters({
            role: { $in: ['admin', 'manager'] },
            status: 'active'
        });

        console.log('Found managers:', result); // Debug log

        return this.sendResponse(res, {
            status: 'success',
            data: {
                users: result.users.map(user => ({
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                }))
            }
        });
    } catch (error) {
        logger.error('Error fetching available managers:', error);
        return this.sendError(res, error);
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