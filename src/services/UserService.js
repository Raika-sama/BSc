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

    /**
     * Crea un nuovo utente
     * @param {Object} userData - Dati utente
     * @param {Object} options - Opzioni aggiuntive
     */
    async createUser(userData, options = {}) {
        try {
            logger.debug('Creating new user', { 
                email: userData.email,
                role: userData.role 
            });

            // Verifica email duplicata
            const existingUser = await this.userRepository.findByEmail(userData.email);
            if (existingUser) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }

            // Hash password
            const hashedPassword = await this.hashPassword(userData.password);

            // Prepara dati utente
            const userToCreate = {
                ...userData,
                password: hashedPassword,
                status: options.status || 'active',
                passwordHistory: [{
                    password: hashedPassword,
                    changedAt: new Date()
                }]
            };

            // Crea utente
            const newUser = await this.userRepository.create(userToCreate);
            logger.info('User created successfully', { 
                userId: newUser._id 
            });

            return this.sanitizeUser(newUser);
        } catch (error) {
            logger.error('Error creating user', { error });
            throw error;
        }
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
        const { password, passwordHistory, passwordResetToken, passwordResetExpires, ...safeUser } = user.toObject();
        return safeUser;
    }
}

module.exports = UserService;