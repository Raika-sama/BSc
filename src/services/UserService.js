// src/services/UserService.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const bcrypt = require('bcryptjs');

class UserService {
    constructor(userRepository, authService, sessionService) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.sessionService = sessionService;
        this.SALT_ROUNDS = 10;
        this.PASSWORD_HISTORY_LIMIT = 5;
    }

    async getUserById(userId) {
        try {
            console.log('UserService: Getting user by ID:', userId);
            const user = await this.userRepository.findById(userId);
            
            console.log('UserService: User lookup result:', {
                found: !!user,
                userId: userId
            });
    
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }
    
            const sanitizedUser = this.sanitizeUser(user);
            return sanitizedUser;
        } catch (error) {
            console.error('UserService: Error getting user by ID:', error);
            throw error;
        }
    }

    /**
     * Crea un nuovo utente
     * @param {Object} userData - Dati utente
     * @param {Object} options - Opzioni aggiuntive
     */
     async createUser(userData, options = {}) {
        // Validazioni
        await this.validateUserData(userData);
        
        // Business logic
        const hashedPassword = await this.hashPassword(userData.password);
        const userToCreate = this.prepareUserData(userData, hashedPassword, options);
        
        // Persistenza
        const user = await this.userRepository.create(userToCreate);
        return this.sanitizeUser(user);
    }

    // Nuovo metodo per lista utenti
    async listUsers(filters = {}, options = {}) {
        console.log('Service listUsers called with:', { filters, options });
    
        // Estraiamo i parametri di paginazione
        const { page, limit, search } = filters;
    
        const result = await this.userRepository.findWithFilters(
            { search }, // Passiamo solo i filtri di ricerca
            { 
                page,
                limit,
                sort: { createdAt: -1 }
            }
        );
        
        console.log('Service received users:', {
            count: result.users.length,
            total: result.total,
            page: result.page
        });
    
        return {
            users: result.users.map(user => this.sanitizeUser(user)),
            total: result.total,
            page: result.page,
            totalPages: result.totalPages
        };
    }

    /**
     * Aggiorna un utente esistente
     * @param {string} userId - ID utente
     * @param {Object} updateData - Dati da aggiornare
     */
    async updateUser(userId, updateData) {
        try {
            logger.debug('Updating user', { userId });

            // Se viene aggiornata la password
            if (updateData.password) {
                await this.handlePasswordUpdate(userId, updateData.password);
                delete updateData.password;
            }

            const updatedUser = await this.userRepository.updateUser(userId, updateData);
            logger.info('User updated successfully', { userId });

            return this.sanitizeUser(updatedUser);
        } catch (error) {
            logger.error('Error updating user', { error });
            throw error;
        }
    }

    /**
     * Gestisce l'aggiornamento della password
     * @param {string} userId - ID utente
     * @param {string} newPassword - Nuova password
     */
    async handlePasswordUpdate(userId, newPassword) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Utente non trovato'
            );
        }

        // Verifica se la password è stata usata di recente
        const hashedPassword = await this.hashPassword(newPassword);
        const isPasswordReused = user.passwordHistory.some(
            history => bcrypt.compareSync(newPassword, history.password)
        );

        if (isPasswordReused) {
            throw createError(
                ErrorTypes.VALIDATION.PASSWORD_REUSED,
                'Password già utilizzata di recente'
            );
        }

        // Aggiorna password history
        user.passwordHistory.unshift({
            password: hashedPassword,
            changedAt: new Date()
        });

        // Mantieni solo le ultime N password
        if (user.passwordHistory.length > this.PASSWORD_HISTORY_LIMIT) {
            user.passwordHistory = user.passwordHistory.slice(0, this.PASSWORD_HISTORY_LIMIT);
        }

        user.password = hashedPassword;
        await user.save();

        // Invalida tutte le sessioni esistenti
        await this.sessionService.removeAllSessions(userId);
    }


    prepareUserData(userData, hashedPassword, options) {
        return {
            ...userData,
            password: hashedPassword,
            status: options.status || 'active',
            passwordHistory: [{
                password: hashedPassword,
                changedAt: new Date()
            }]
        };
    }


    /**
     * Cambia lo stato di un utente
     * @param {string} userId - ID utente
     * @param {string} newStatus - Nuovo stato
     */
    async changeUserStatus(userId, newStatus) {
        try {
            const validStatuses = ['active', 'inactive', 'suspended'];
            if (!validStatuses.includes(newStatus)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_STATUS,
                    'Stato non valido'
                );
            }

            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            user.status = newStatus;
            if (newStatus !== 'active') {
                // Termina tutte le sessioni se l'utente viene disattivato
                await this.sessionService.removeAllSessions(userId);
            }

            await user.save();
            logger.info('User status changed', { userId, newStatus });

            return this.sanitizeUser(user);
        } catch (error) {
            logger.error('Error changing user status', { error });
            throw error;
        }
    }

    /**
     * Gestisce i permessi utente
     * @param {string} userId - ID utente
     * @param {Array} permissions - Lista permessi
     * @param {string} action - 'add' o 'remove'
     */
    async managePermissions(userId, permissions, action = 'add') {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            if (action === 'add') {
                user.permissions = [...new Set([...user.permissions, ...permissions])];
            } else if (action === 'remove') {
                user.permissions = user.permissions.filter(p => !permissions.includes(p));
            }

            await user.save();
            logger.info('User permissions updated', { 
                userId, 
                action, 
                permissions 
            });

            return this.sanitizeUser(user);
        } catch (error) {
            logger.error('Error managing permissions', { error });
            throw error;
        }
    }

    /**
     * Elimina un utente
     * @param {string} userId - ID utente
     */
    async deleteUser(userId) {
        try {
            await this.sessionService.removeAllSessions(userId);
            const result = await this.userRepository.delete(userId);
            
            if (!result) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            logger.info('User deleted successfully', { userId });
            return true;
        } catch (error) {
            logger.error('Error deleting user', { error });
            throw error;
        }
    }

        /**
     * Soft delete utente
     * @param {string} userId - ID utente
     */
        async softDeleteUser(userId) {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createError(ErrorTypes.RESOURCE.NOT_FOUND, 'Utente non trovato');
            }
    
            // Business logic per soft delete
            const updateData = {
                isDeleted: true,
                deletedAt: new Date(),
                status: 'inactive'
            };
    
            await this.sessionService.removeAllSessions(userId);
            return this.userRepository.update(userId, updateData);
        }
    
    

    /**
     * Hash password
     * @param {string} password - Password da hashare
     */
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
        return bcrypt.hash(password, salt);
    }

    /**
     * Sanitizza oggetto utente per risposta
     * @param {Object} user - Utente da sanitizzare
     */
    sanitizeUser(user) {
        const userData = user.toObject();
        // Rimuoviamo solo i campi sensibili
        const {
            password,
            passwordHistory,
            passwordResetToken,
            passwordResetExpires,
            ...safeUser
        } = userData;
        return safeUser;
    }
}

module.exports = UserService;