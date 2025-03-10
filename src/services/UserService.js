// src/services/UserService.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

class UserService {
    constructor(userRepository, authService, sessionService, permissionService) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.sessionService = sessionService;
        this.permissionService = permissionService;
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
            console.log('UserService: Getting teachers for school:', schoolId);
            
            const school = await this.userRepository.getSchoolTeachers(schoolId);
            
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            const teachers = [];
            
            // Aggiungi il manager se esiste
            if (school.manager) {
                teachers.push(this.sanitizeUser(school.manager));
            }
    
            // Aggiungi gli insegnanti
            if (school.users && Array.isArray(school.users)) {
                const teacherUsers = school.users
                    .filter(u => u.role === 'teacher' && u.user)
                    .map(u => this.sanitizeUser(u.user));
                teachers.push(...teacherUsers);
            }
    
            console.log(`UserService: Found ${teachers.length} teachers`);
            return teachers;
        } catch (error) {
            console.error('UserService Error:', error);
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
        const validRoles = ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health', 'student'];
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
            console.log('UserService: Creating user with data:', {
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
    
            // Hash password - commentta perché viene hashata nel modello
            // const hashedPassword = await this.hashPassword(userData.password);
    
            // Preparazione dati base
            let userToCreate = {
                ...userData,
                // password: hashedPassword,
                status: options.status || 'active',
                 // Modifica anche questo perché la password verrà hashata dal pre-save hook
            passwordHistory: [{
                password: userData.password, // usa la password non hashata
                changedAt: new Date()
            }]
            };
    
            // Inizializza permessi e accessi usando il PermissionService
            if (this.permissionService) {
                userToCreate = this.permissionService.initializeUserPermissions(userToCreate);
            } else {
                logger.error('PermissionService not available during user creation');
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Errore durante l\'inizializzazione dei permessi'
                );
            }
    
            // Creazione utente
            const user = await this.userRepository.create(userToCreate);
            console.log('UserService: User created successfully:', {
                id: user._id,
                email: user.email,
                role: user.role,
                permissions: user.permissions?.length || 0,
                testAccessLevel: user.testAccessLevel
            });
    
            return this.sanitizeUser(user);
        } catch (error) {
            console.error('UserService: Error creating user:', error);
            throw error;
        }
    }

    // Metodo per assegnare risorse a un utente
    async assignResources(userId, resources) {
        try {
            logger.debug('Assigning resources to user', { userId, resources });

            if (!this.permissionService) {
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Servizio permessi non disponibile'
                );
            }

            const user = await this.permissionService.assignResources(userId, resources);
            
            logger.info('Resources assigned successfully', {
                userId,
                schoolId: resources.schoolId,
                classCount: resources.classIds?.length,
                studentCount: resources.studentIds?.length
            });

            return this.sanitizeUser(user);
        } catch (error) {
            logger.error('Error assigning resources', { error, userId });
            throw error;
        }
    }

    // Metodo per aggiornare i permessi di un utente
    async updateUserPermissions(userId, permissions) {
        try {
            logger.debug('Updating user permissions', { userId });

            if (!this.permissionService) {
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Servizio permessi non disponibile'
                );
            }

            const user = await this.permissionService.updateUserPermissions(userId, permissions);
            
            logger.info('User permissions updated successfully', { userId });

            return this.sanitizeUser(user);
        } catch (error) {
            logger.error('Error updating user permissions', { error, userId });
            throw error;
        }
    }

    // Metodo per lista utenti
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
            logger.debug('Updating user', { 
                userId,
                updateDataKeys: Object.keys(updateData),
                testAccessLevel: updateData.testAccessLevel 
            });

            // Se è presente testAccessLevel, assicuriamoci che sia un numero
        if ('testAccessLevel' in updateData) {
            updateData.testAccessLevel = parseInt(updateData.testAccessLevel, 10);
            
            // Verifica che sia un numero valido
            if (isNaN(updateData.testAccessLevel)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_DATA,
                    'Livello di accesso ai test non valido'
                );
            }
        }

            // Se il ruolo viene cambiato, reinizializza i permessi
            if (updateData.role && this.permissionService) {
                const user = await this.userRepository.findById(userId);
                
                if (user.role !== updateData.role) {
                    // Crea un oggetto temporaneo con il nuovo ruolo per inizializzare i permessi
                    const tempUser = { ...user.toObject(), role: updateData.role };
                    
                    // Inizializza i permessi basati sul nuovo ruolo
                    this.permissionService.initializeUserPermissions(tempUser);
                    
                    // Aggiungi i permessi e il livello di accesso all'oggetto di aggiornamento
                    updateData.permissions = tempUser.permissions;
                    updateData.testAccessLevel = tempUser.testAccessLevel;
                    updateData.hasAdminAccess = tempUser.hasAdminAccess;
                }
            }

            // Se viene aggiornata la password
            if (updateData.password) {
                await this.handlePasswordUpdate(userId, updateData.password);
                delete updateData.password;
            }

            const updatedUser = await this.userRepository.update(userId, updateData);
            logger.info('User updated successfully', { userId });

            // Log dopo l'aggiornamento per verificare
        logger.info('User updated successfully', { 
            userId,
            updatedFields: Object.keys(updateData),
            testAccessLevel: updatedUser.testAccessLevel 
        });

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
     * @param {Object} updateData - Dati di aggiornamento con stato e altri campi opzionali
     */
    async changeUserStatus(userId, updateData) {
        try {
            logger.info(`Changing user status for ${userId}`, { updateData });
            
            const user = await this.userRepository.findById(userId);
            
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // Prepara i dati di aggiornamento base
            const dataToUpdate = {
                status: updateData.status
            };
            
            // Se stiamo riattivando un utente, potrebbero essere necessari ulteriori aggiornamenti
            if (updateData.status === 'active' && user.status !== 'active') {
                logger.info(`Reactivating user ${userId}`, { 
                    currentEmail: user.email,
                    providedEmail: updateData.email,
                    isDeleted: user.isDeleted
                });
                
                // Ripristina l'email se specificata
                if (updateData.email) {
                    dataToUpdate.email = updateData.email;
                } else if (user.email && user.email.startsWith('deleted_')) {
                    // Tenta di estrarre la email originale dal pattern deleted_TIMESTAMP_email
                    const emailParts = user.email.split('_');
                    if (emailParts.length >= 3) {
                        const originalEmail = emailParts.slice(2).join('_');
                        if (originalEmail.includes('@')) {
                            dataToUpdate.email = originalEmail;
                            logger.info(`Extracted original email from deleted_prefixed email: ${originalEmail}`);
                        }
                    }
                }
                
                // Ripristina flag di eliminazione
                dataToUpdate.isDeleted = false;
                dataToUpdate.deletedAt = null;
                
                // Se erano stati cancellati i riferimenti alle risorse, verifica se possiamo recuperarli
                if (user.previousAssignments) {
                    if (!user.assignedSchoolIds?.length && user.previousAssignments.schoolIds) {
                        dataToUpdate.assignedSchoolIds = user.previousAssignments.schoolIds;
                    }
                    if (!user.assignedClassIds?.length && user.previousAssignments.classIds) {
                        dataToUpdate.assignedClassIds = user.previousAssignments.classIds;
                    }
                    if (!user.assignedStudentIds?.length && user.previousAssignments.studentIds) {
                        dataToUpdate.assignedStudentIds = user.previousAssignments.studentIds;
                    }
                }
            } 
            // Se stiamo disattivando l'utente, potrebbe essere una preparazione per soft delete
            else if (updateData.status === 'inactive' && user.status === 'active') {
                // Non facciamo nulla di particolare qui - il cambio di status è sufficiente
                // Il deleteUser si occupa degli altri passi necessari per il soft delete completo
            }
            
            // Aggiorna l'utente con i dati preparati
            const updatedUser = await this.userRepository.update(userId, dataToUpdate);
            logger.info(`User status updated successfully for ${userId}`, { newStatus: updateData.status });
            
            return updatedUser;
        } catch (error) {
            logger.error('Error changing user status:', { error, userId });
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
 * Elimina un utente e tutte le sue relazioni
 * @param {string} userId - ID utente da eliminare
 * @returns {Promise<boolean>} - True se l'eliminazione è avvenuta con successo
 */
async deleteUser(userId) {
    try {
        logger.debug('Starting user deletion process', { userId });

        // Prima di eliminare l'utente, ottieni tutte le informazioni necessarie
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Utente non trovato'
            );
        }

        // Log delle informazioni dell'utente prima dell'eliminazione
        logger.info('Found user to delete', { 
            userId, 
            role: user.role,
            schoolId: user.schoolId || user.assignedSchoolId,
            hasClasses: user.assignedClassIds?.length > 0,
            hasStudents: user.assignedStudentIds?.length > 0
        });

        // Chiamiamo il repository per eliminare l'utente e tutte le sue relazioni
        const result = await this.userRepository.deleteUser(userId);
        
        if (!result) {
            throw createError(
                ErrorTypes.SYSTEM.OPERATION_FAILED,
                'Eliminazione utente fallita'
            );
        }

        logger.info('User deleted successfully', { userId });
        return true;
    } catch (error) {
        logger.error('Error deleting user', { error, userId });
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

    /**
     * Registra un evento di audit per l'utente
     * @param {string} userId - ID dell'utente 
     * @param {string} action - Tipo di azione (created, updated, deleted, password_changed, role_changed, login, logout)
     * @param {Object} changes - Cambiamenti effettuati (opzionale)
     * @param {Object} metadata - Metadati aggiuntivi (opzionale)
     * @param {string} performedBy - ID dell'utente che ha eseguito l'azione (se diverso dall'utente stesso)
     */
    async logUserAction(userId, action, changes = {}, metadata = {}, performedBy = null) {
        try {
            const UserAudit = mongoose.model('UserAudit');
            
            // Se performedBy non è specificato, assumiamo sia lo stesso utente
            if (!performedBy) {
                performedBy = userId;
            }
            
            const auditData = {
                userId,
                action,
                performedBy,
                changes,
                ...metadata
            };
            
            logger.debug('Creating user audit record', { userId, action });
            await UserAudit.create(auditData);
            
            logger.info('User audit record created', { userId, action });
            return true;
        } catch (error) {
            logger.error('Error creating user audit record', { error, userId, action });
            // Non lanciamo l'errore per non interrompere il flusso principale
            return false;
        }
    }

    /**
     * Ottiene lo storico delle modifiche di un utente
     * @param {string} userId - ID utente
     * @returns {Promise<Array>} - Array di eventi dello storico
     */
    async getUserHistory(userId) {
        try {
            logger.debug('Getting user history', { userId });
            
            // Ottieni l'utente
            const user = await this.userRepository.findById(userId);
            
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }
            
            // Usa il modello UserAudit direttamente
            const UserAudit = mongoose.model('UserAudit');
            const history = await UserAudit.find({ userId })
                .sort('-createdAt')
                .populate('performedBy', 'firstName lastName email')
                .lean();
            
            logger.info('User history retrieved', { 
                userId, 
                entriesCount: history.length 
            });
            
            return history;
        } catch (error) {
            logger.error('Error retrieving user history', { error, userId });
            throw error;
        }
    }
}

module.exports = UserService;