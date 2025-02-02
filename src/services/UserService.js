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

    async findWithFilters(filters) {
        console.log('UserService: Finding users with filters:', filters);
        const result = await this.userRepository.findWithFilters(filters);
        console.log('UserService: Found users:', result);
        return result;
    }

    async getSchoolTeachers(schoolId) {
        try {
            console.log('Getting teachers for school:', schoolId);
            
            // Troviamo la scuola e popoliamo i riferimenti agli utenti
            const school = await mongoose.model('School')
                .findById(schoolId)
                .populate('manager', 'firstName lastName email role')
                .populate('users.user', 'firstName lastName email role');
    
            if (!school) {
                throw new Error('Scuola non trovata');
            }
    
            // Raccogliamo tutti gli utenti (manager e teachers)
            const teachers = [];
    
            // Aggiungiamo il manager se esiste
            if (school.manager) {
                teachers.push(school.manager);
            }
    
            // Aggiungiamo gli insegnanti dal campo users
            if (school.users && school.users.length > 0) {
                const teacherUsers = school.users
                    .filter(u => u.role === 'teacher' && u.user)
                    .map(u => u.user);
                teachers.push(...teacherUsers);
            }
    
            console.log(`Found ${teachers.length} teachers for school ${schoolId}`);
            
            return teachers;
        } catch (error) {
            console.error('Error getting school teachers:', error);
            throw error;
        }
    }

     // Aggiungiamo il metodo validateUserData
    validateUserData(userData, isNewUser = true) {
        const errors = {};

        // Validazioni base
        if (!userData.firstName?.trim()) {
            errors.firstName = 'Nome richiesto';
        }

        if (!userData.lastName?.trim()) {
            errors.lastName = 'Cognome richiesto';
        }

        if (!userData.email?.trim()) {
            errors.email = 'Email richiesta';
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(userData.email)) {
            errors.email = 'Email non valida';
        }

        // Validazione password solo per nuovi utenti
        if (isNewUser && (!userData.password || userData.password.length < 8)) {
            errors.password = 'Password deve essere di almeno 8 caratteri';
        }

        // Validazione ruolo
        const validRoles = ['teacher', 'admin', 'manager'];
        if (!userData.role || !validRoles.includes(userData.role)) {
            errors.role = 'Ruolo non valido';
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }


    /**
     * Crea un nuovo utente
     * @param {Object} userData - Dati utente
     * @param {Object} options - Opzioni aggiuntive
     */
    async createUser(userData, options = {}) {
        try {
            console.log('UserService: Validating user data:', {
                ...userData,
                password: '[REDACTED]'
            });

            // Validazione
            const validationErrors = this.validateUserData(userData, true);
            if (validationErrors) {
                console.error('Validation errors:', validationErrors);
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_DATA,
                    'Dati utente non validi',
                    { errors: validationErrors }
                );
            }

            // Hash password
            const hashedPassword = await this.hashPassword(userData.password);

            // Preparazione dati
            const userToCreate = {
                ...userData,
                password: hashedPassword,
                status: options.status || 'active',
                passwordHistory: [{
                    password: hashedPassword,
                    changedAt: new Date()
                }]
            };

            console.log('UserService: Creating user with prepared data');

            // Creazione utente
            const user = await this.userRepository.create(userToCreate);
            console.log('UserService: User created successfully:', {
                id: user._id,
                email: user.email
            });

            return this.sanitizeUser(user);
        } catch (error) {
            console.error('UserService: Error creating user:', error);
            throw error;
        }
    }

    // Nuovo metodo per lista utenti
    async listUsers(filters = {}, options = {}) {
        try {
            console.log('UserService: Received filters:', filters);
    
            const normalizedFilters = {
                search: filters.search || '',
                role: filters.role,
                status: filters.status,
                schoolId: filters.schoolId
            };
    
            // Rimuovi i filtri undefined
            Object.keys(normalizedFilters).forEach(key => 
                normalizedFilters[key] === undefined && delete normalizedFilters[key]
            );
    
            console.log('UserService: Normalized filters:', normalizedFilters);
    
            const result = await this.userRepository.findWithFilters(
                normalizedFilters,
                {
                    page: parseInt(filters.page) || 1,
                    limit: parseInt(filters.limit) || 10,
                    sort: options.sort || { createdAt: -1 }
                }
            );
    
            return {
                users: result.users,
                total: result.total,
                page: result.page,
                limit: result.limit
            };
        } catch (error) {
            console.error('UserService Error:', error);
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
    if (!user) return null;
    
    // Se l'oggetto è già un plain object (da .lean())
    const userData = user.toObject ? user.toObject() : { ...user };
    
    // Rimuovi i campi sensibili
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