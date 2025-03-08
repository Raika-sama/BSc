// src/repositories/UserRepository.js
const BaseRepository = require('./base/BaseRepository');
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

class UserRepository extends BaseRepository {
    constructor(userModel, sessionService) {
        super(userModel);
        this.sessionService = sessionService; // Store the session service
        this.repositoryName = 'UserRepository';
    }

    /**
     * Trova un utente per email
     * @param {string} email - Email utente
     * @param {boolean} includePassword - Include campo password
     */
    async findByEmail(email, includePassword = false) {
        try {
            const query = this.model.findOne({ email });
            if (includePassword) {
                query.select('+password');
            }
            return await query;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findByEmail',
                { email, includePassword },
                this.repositoryName
            );
        }
    }

    // Nel Repository
    async findById(id) {
        try {
            logger.debug('UserRepository: Finding user by ID:', id);
            
            // Verifica che l'ID sia valido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_FORMAT,
                    `Formato ID non valido: ${id}`,
                    { value: id }
                );
            }
            
            const user = await this.model.findById(id)
                .select('-password -passwordHistory -passwordResetToken -passwordResetExpires');
            
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato',
                    { id }
                );
            }
    
            return user;
        } catch (error) {
            // Se l'errore ha già un codice e uno status, è già stato formattato correttamente,
            // quindi lo restituiamo direttamente
            if (error.code && error.status) {
                throw error;
            }
            
            // Altrimenti, gestiamo l'errore con il gestore standard
            throw handleRepositoryError(
                error,
                'findById',
                { id },
                this.repositoryName
            );
        }
    }
    

    /**
     * Crea nuovo utente
     * @param {Object} userData - Dati utente
     */
    async create(userData) {
        try {
            const user = await this.model.create({
                ...userData,
                createdAt: new Date(),
                isDeleted: false
            });
            logger.info('User created', { userId: user._id });
            return user;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'create',
                { userData: { ...userData, password: '[REDACTED]' } },
                this.repositoryName
            );
        }
    }

    /**
     * Aggiorna utente
     * @param {string} userId - ID utente
     * @param {Object} updateData - Dati da aggiornare
     */
    async update(userId, updateData) {
        try {
            logger.debug(`UserRepository: Aggiornamento utente ${userId} con dati:`, {
                ...updateData,
                fields: Object.keys(updateData)
            });
    
            // Assicurati che l'ID sia valido
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_FORMAT,
                    `Formato ID non valido: ${userId}`,
                    { value: userId }
                );
            }
    
            // Opzioni di aggiornamento
            const options = { 
                new: true,      // Ritorna il documento aggiornato
                runValidators: true  // Applica i validatori dello schema
            };
    
            const user = await this.model.findByIdAndUpdate(
                userId,
                updateData,
                options
            );
    
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato',
                    { id: userId }
                );
            }
    
            logger.debug(`UserRepository: Utente aggiornato:`, {
                id: user._id,
                testAccessLevel: user.testAccessLevel
            });
    
            return user;
        } catch (error) {
            // Se l'errore ha già un codice e uno status, è già stato formattato correttamente,
            // quindi lo restituiamo direttamente lanciandolo nuovamente
            if (error.code && error.status) {
                throw error;
            }
            
            // Altrimenti, gestiamo l'errore con il gestore standard
            throw handleRepositoryError(
                error,
                'update',
                { userId, updateData },
                this.repositoryName
            );
        }
    }

    
    /**
     * Elimina un utente e aggiorna tutte le relazioni
     * @param {string} userId - ID utente da eliminare
     * @returns {Promise<boolean>} - True se l'eliminazione è avvenuta con successo
     */
    async deleteUser(userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug(`UserRepository: Starting deletion for user ${userId}`);

            // 1. Trova l'utente completo
            const user = await this.model.findById(userId).session(session);
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            // 2. Aggiorna le scuole in cui l'utente è manager
            const School = mongoose.model('School');
            const userObjectId = new mongoose.Types.ObjectId(userId);
            
            logger.debug(`UserRepository: Looking for schools where user ${userId} is manager`);
            
            // Trova scuole dove l'utente è manager
            const schoolsAsManager = await School.find({ 
                manager: { $eq: userObjectId } 
            }).session(session);
            
            logger.debug(`UserRepository: Found ${schoolsAsManager.length} schools where user is manager`);
            
            // *** MANTIENI SOLO QUESTO CICLO CON _skipManagerValidation ***
            // Nel deleteUser, aggiungi il FLAG 'SKIPMANAGERVALIDATION' presente nel modello school 
           // prima di salvare altrimenti darebbe errore perché non può non esserci un manager della scuola (ma se un admin vuole toglierlo può farlo)
            for (const school of schoolsAsManager) {
                logger.debug(`UserRepository: Removing user as manager from school ${school._id}`);
                school.manager = null;
                school.notes = `${school.notes || ''}\n[AVVISO] Il manager precedente (${user.firstName} ${user.lastName}) è stato rimosso il ${new Date().toLocaleString()}. Assegnare un nuovo manager.`;
                
                // Aggiungi la flag per saltare la validazione
                school._skipManagerValidation = true;
                
                await school.save({ session });
                logger.debug(`UserRepository: School ${school._id} updated, manager is now null`);
            }

            // 3. Rimuovi l'utente dagli utenti della scuola
            logger.debug(`UserRepository: Removing user from schools' users arrays`);
            
            const schoolsWithUserResult = await School.updateMany(
                { 'users.user': { $eq: userObjectId } },
                { $pull: { users: { user: { $eq: userObjectId } } } },
                { session }
            );
            
            logger.debug(`UserRepository: Updated ${schoolsWithUserResult.matchedCount} schools, modified ${schoolsWithUserResult.modifiedCount}`);


            // 4. Aggiorna le classi in cui l'utente è mainTeacher
            const Class = mongoose.model('Class');
            const classesAsMainTeacher = await Class.find({ mainTeacher: userId }).session(session);
            
            for (const cls of classesAsMainTeacher) {
                logger.debug(`UserRepository: User is main teacher of class ${cls._id}`);
                // Imposta un messaggio di avviso sulla classe
                cls.notes = `${cls.notes || ''}\n[AVVISO] Il docente principale precedente (${user.firstName} ${user.lastName}) è stato rimosso il ${new Date().toLocaleString()}. Assegnare un nuovo docente principale.`;
                // Segna il docente come temporaneamente rimosso
                cls.mainTeacherIsTemporary = true;
                cls.previousMainTeacher = userId;
                cls.mainTeacher = null;
                await cls.save({ session });
            }

            // 5. Rimuovi l'utente dalla lista insegnanti delle classi
            await Class.updateMany(
                { teachers: userId },
                { $pull: { teachers: userId } },
                { session }
            );

            // 6. Aggiorna gli studenti in cui l'utente è mainTeacher
            const Student = mongoose.model('Student');
            const studentsAsMainTeacher = await Student.find({ mainTeacher: userId }).session(session);
            
            for (const student of studentsAsMainTeacher) {
                logger.debug(`UserRepository: User is main teacher of student ${student._id}`);
                student.mainTeacher = null;
                await student.save({ session });
            }

            // 7. Rimuovi l'utente dalla lista insegnanti degli studenti
            await Student.updateMany(
                { teachers: userId },
                { $pull: { teachers: userId } },
                { session }
            );

            // 8. Soft delete dell'utente
            user.isDeleted = true;
            user.deletedAt = new Date();
            user.status = 'inactive';
            user.email = `deleted_${Date.now()}_${user.email}`; // Modifica email per evitare conflitti futuri
            
            // Pulizia dei campi di assegnazione - AGGIUNTA
            user.assignedSchoolIds = [];
            user.assignedClassIds = [];
            user.assignedStudentIds = [];

            /* Commento perché i campi nel modello user sono cambiati
            user.schoolId = null;
            user.assignedSchoolId = null; // Per retrocompatibilità con il vecchio campo
            */

            // Clear session tokens directly on the user object instead of using sessionService
            if (user.sessionTokens && Array.isArray(user.sessionTokens)) {
                user.sessionTokens = [];
            }

            await user.save({ session });

            // Removed the problematic line that was causing the error:
            // await this.sessionService.removeAllSessions(userId);

            // Commit della transazione
            await session.commitTransaction();
            logger.debug(`UserRepository: User ${userId} successfully deleted`);
            return true;
        } catch (error) {
            // Rollback in caso di errore
            await session.abortTransaction();
            logger.error('UserRepository - Error deleting user:', error);
            throw handleRepositoryError(
                error,
                'deleteUser',
                { userId },
                this.repositoryName
            );
        } finally {
            // Fine della sessione
            session.endSession();
        }
    }

    /**
     * Trova utenti con filtri e paginazione
     * @param {Object} filters - Filtri di ricerca
     * @param {Object} options - Opzioni di paginazione e ordinamento
     */
    async findWithFilters(filters = {}, options = {}) {
        try {
            let query = {};
            
            logger.debug('Repository findWithFilters received:', { filters, options });
    
            // Filtri base
            if (filters.search) {
                query.$or = [
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                    { email: { $regex: filters.search, $options: 'i' } }
                ];
            }
    
            if (filters.role) {
                query.role = filters.role;
            }
    
            if (filters.status) {
                query.status = filters.status;
            }
    
            // Gestione filtro schoolId
            if (filters.schoolId) {
                logger.debug('Applying schoolId filter:', filters.schoolId);
                try {
                    const objectId = new mongoose.Types.ObjectId(filters.schoolId);
                    query.schoolId = objectId;
                } catch (err) {
                    logger.error('Invalid schoolId format:', err);
                }
            }
    
            logger.debug('Final query:', query);
    
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const skip = (page - 1) * limit;
    
            const [users, total] = await Promise.all([
                this.model
                    .find(query)
                    .select('firstName lastName email role status schoolId createdAt')
                    .sort(options.sort || { createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.model.countDocuments(query)
            ]);
    
            logger.debug('Query results:', {
                totalFound: total,
                usersReturned: users.length,
                query
            });
    
            return {
                users,
                total,
                page,
                limit
            };
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findWithFilters',
                { filters, options },
                this.repositoryName
            );
        }
    }

    async getSchoolTeachers(schoolId) {
        try {
            logger.debug('UserRepository: Getting teachers for school:', schoolId);
            
            const school = await mongoose.model('School')
                .findById(schoolId)
                .populate({
                    path: 'manager',
                    select: 'firstName lastName email role'
                })
                .populate({
                    path: 'users.user',
                    select: 'firstName lastName email role'
                })
                .select('manager users')
                .lean();
    
            logger.debug('UserRepository: School query result:', {
                hasManager: !!school?.manager,
                usersCount: school?.users?.length || 0
            });
    
            return school;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'getSchoolTeachers',
                { schoolId },
                this.repositoryName
            );
        }
    }
}

module.exports = UserRepository;