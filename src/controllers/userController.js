// src/controllers/UserController.js
const BaseController = require('./baseController');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

class UserController extends BaseController {
    constructor(userService, sessionService) {
        super(null, 'user'); // Passiamo null come repository perché useremo il service
        this.userService = userService;
        this.sessionService = sessionService;
        this.userService = userService;
        this.sessionService = sessionService;
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.getAvailableManagers = this.getAvailableManagers.bind(this);
        this.assignResources = this.assignResources.bind(this);
        this.updatePermissions = this.updatePermissions.bind(this);
        this.getUserHistory = this.getUserHistory.bind(this); // Aggiungiamo il binding del nuovo metodo
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
            const { page = 1, limit = 10, search = '', sort = '-createdAt', schoolId, role } = req.query;
            
            console.log('Controller getAll received raw query:', req.query);
            console.log('Controller getAll parsed params:', {
                page,
                limit,
                search,
                sort,
                schoolId,
                role,
                user: req.user?.id
            });

            // Validazione schoolId
            if (schoolId && !mongoose.Types.ObjectId.isValid(schoolId)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.INVALID_ID,
                    'ID scuola non valido'
                ));
            }

            const result = await this.userService.listUsers({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                schoolId,
                role,
                sort
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
     * Assegna risorse a un utente (scuola, classi, studenti)
     */
    async assignResources(req, res) {
        try {
            const { id } = req.params;
            const { schoolId, classIds, studentIds } = req.body;

            logger.debug('Assigning resources to user', {
                userId: id,
                schoolId,
                classCount: classIds?.length,
                studentCount: studentIds?.length
            });

            // Valida i dati in base al ruolo
            const user = await this.userService.getUserById(id);
            
            // Verifica che le risorse siano appropriate per il ruolo
            if (['manager', 'pcto'].includes(user.role) && !schoolId) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'ID scuola richiesto per questo ruolo'
                ));
            }

            if (user.role === 'teacher' && (!classIds || classIds.length === 0)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Almeno una classe deve essere assegnata per questo ruolo'
                ));
            }

            if (user.role === 'tutor' && (!studentIds || studentIds.length === 0)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Almeno uno studente deve essere assegnato per questo ruolo'
                ));
            }

            const updatedUser = await this.userService.assignResources(id, {
                schoolId,
                classIds,
                studentIds
            });

            logger.info('Resources assigned successfully', {
                userId: id
            });

            return this.sendResponse(res, {
                status: 'success',
                data: { user: updatedUser }
            });
        } catch (error) {
            logger.error('Error assigning resources', { error });
            return this.sendError(res, error);
        }
    }

    /**
     * Aggiorna i permessi di un utente
     */
    async updatePermissions(req, res) {
        try {
            const { id } = req.params;
            const { permissions } = req.body;

            logger.debug('Updating user permissions', {
                userId: id,
                permissionsCount: permissions?.length
            });

            if (!Array.isArray(permissions)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.INVALID_DATA,
                    'Il campo permissions deve essere un array'
                ));
            }

            const updatedUser = await this.userService.updateUserPermissions(id, permissions);

            logger.info('Permissions updated successfully', {
                userId: id
            });

            return this.sendResponse(res, {
                status: 'success',
                data: { user: updatedUser }
            });
        } catch (error) {
            logger.error('Error updating permissions', { error });
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
                updates: updateData,
                keys: Object.keys(updateData)
            });
    
            // Controllo che l'ID sia valido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.INVALID_ID,
                    'ID utente non valido'
                ));
            }
    
            // Controllo che ci siano dati da aggiornare
            if (!updateData || Object.keys(updateData).length === 0) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Nessun dato fornito per l\'aggiornamento'
                ));
            }
            
            // Se stiamo modificando il ruolo, registriamo questo evento specificamente
            if (updateData.role) {
                // Prima otteniamo il ruolo precedente
                const user = await this.userService.getUserById(id);
                const oldRole = user.role;
                
                if (oldRole !== updateData.role) {
                    // Registra un evento di cambio ruolo nello storico
                    await this.userService.logUserAction(
                        id, 
                        'role_changed',
                        { 
                            role: {
                                old: oldRole,
                                new: updateData.role
                            }
                        },
                        {},
                        req.user.id // L'amministratore che ha eseguito la modifica
                    );
                }
            }
    
            const user = await this.userService.updateUser(id, updateData);
    
            logger.info('User updated', { userId: id });
    
            return this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('User update failed', { error });
            return this.sendError(res, error);
        }
    }


/**
 * Elimina utente (soft delete)
 */
async delete(req, res) {
    try {
        const { id } = req.params;
        
        logger.debug('Deleting user', { userId: id });

        // Utilizziamo il servizio per gestire l'eliminazione
        const deleted = await this.userService.deleteUser(id);

        logger.info('User deleted', { userId: id, success: deleted });

        return this.sendResponse(res, {
            status: 'success',
            message: 'Utente eliminato con successo'
        });
    } catch (error) {
        logger.error('User deletion failed', { error });
        return this.sendError(res, error);
    }
}

    /**
     * Ottiene profilo utente corrente
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.userService.getUserById(userId);

            return this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Get profile failed', { error });
            return this.handleError(res, error);
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

            return this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Profile update failed', { error });
            return this.handleError(res, error);
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

            return this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Permission management failed', { error });
            return this.handleError(res, error);
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

            return this.sendResponse(res, {
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('List users failed', { error });
            return this.handleError(res, error);
        }
    }

    /**
     * Cambia lo stato di un utente (attivo/inattivo/sospeso)
     * @route PUT /users/:id/status
     */
    async changeStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, email, isDeleted, deletedAt } = req.body;

            logger.debug('Changing user status', { 
                userId: id, 
                newStatus: status, 
                restoreEmail: email,
                resetDeleted: isDeleted === false
            });

            if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.INVALID_DATA,
                    'Stato non valido. Valori ammessi: active, inactive, suspended'
                ));
            }

            // Preparazione dati per l'aggiornamento
            const updateData = { status };

            // Se stiamo riattivando un utente, gestiamo ripristino email e altri campi
            if (status === 'active') {
                // Se è fornita una email nel body (dal frontend) la usiamo per il ripristino
                if (email) {
                    updateData.email = email;
                }
                
                // Resetta i flag di eliminazione se specificati
                if (isDeleted === false) {
                    updateData.isDeleted = false;
                }
                
                if (deletedAt === null) {
                    updateData.deletedAt = null;
                }
            }

            const user = await this.userService.changeUserStatus(id, updateData);
            
            logger.info('User status changed', { userId: id, status, email });

            return this.sendResponse(res, {
                status: 'success',
                data: { user }
            });
        } catch (error) {
            logger.error('Change status failed', { error });
            return this.sendError(res, error);
        }
    }

    async getSchoolTeachers(req, res) {
        try {
            const { schoolId } = req.params;
            
            console.log('Getting teachers for school:', schoolId);
    
            const teachers = await this.userService.getSchoolTeachers(schoolId);
    
            console.log(`Found ${teachers.length} teachers for school ${schoolId}`);
    
            return this.sendResponse(res, {
                status: 'success',
                data: {
                    teachers
                }
            });
        } catch (error) {
            console.error('Controller Error:', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Ottiene lo storico delle modifiche di un utente
     * @route GET /users/:id/history
     */
    async getUserHistory(req, res) {
        try {
            const { id } = req.params;
            
            logger.debug('Getting user history', { 
                userId: id,
                requestedBy: req.user.id
            });

            // Controllo che l'ID sia valido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return this.sendError(res, createError(
                    ErrorTypes.VALIDATION.INVALID_ID,
                    'ID utente non valido'
                ));
            }

            // Controllo che l'utente esista
            const user = await this.userService.getUserById(id);
            
            if (!user) {
                return this.sendError(res, createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                ));
            }

            // Ottieni lo storico
            const history = await this.userService.getUserHistory(id);
            
            logger.info('User history retrieved', { 
                userId: id, 
                entriesCount: history.length 
            });

            // Assicurati che la risposta abbia una struttura consistente
            return this.sendResponse(res, {
                status: 'success',
                data: { 
                    history: Array.isArray(history) ? history : [] 
                }
            });
        } catch (error) {
            logger.error('Get user history failed', { error, userId: req.params.id });
            return this.sendError(res, error);
        }
    }
}

module.exports = UserController;