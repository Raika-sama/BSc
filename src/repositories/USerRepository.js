// src/repositories/UserRepository.js
const BaseRepository = require('./base/BaseRepository');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

class UserRepository extends BaseRepository {
    constructor(userModel, sessionService) {
        super(userModel);
        this.sessionService = sessionService; // Store the session service
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
            logger.error('Error finding user by email', { error, email });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca utente'
            );
        }
    }

    // Nel Repository
    async findById(id) {
        try {
            console.log('UserRepository: Finding user by ID:', id);
            
            const user = await this.model.findById(id)
                .select('-password -passwordHistory -passwordResetToken -passwordResetExpires');
            
            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }
    
            return user;
        } catch (error) {
            console.error('UserRepository: Error finding user by ID:', error);
            if (error.name === 'CastError') {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_ID,
                    'ID utente non valido'
                );
            }
            throw error;
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
            logger.error('Error creating user', { error });
            if (error.code === 11000) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Email già registrata'
                );
            }
            throw createError(
                ErrorTypes.DATABASE.CREATION_FAILED,
                'Errore nella creazione utente'
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
            console.log(`UserRepository: Aggiornamento utente ${userId} con dati:`, {
                ...updateData,
                fields: Object.keys(updateData)
            });
    
            // Assicurati che l'ID sia valido
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_ID,
                    'ID utente non valido'
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
                    'Utente non trovato'
                );
            }
    
            console.log(`UserRepository: Utente aggiornato:`, {
                id: user._id,
                testAccessLevel: user.testAccessLevel
            });
    
            return user;
        } catch (error) {
            console.error('UserRepository - Error updating user:', error);
            throw error;
        }
    }

    
/**
 * Elimina un utente e aggiorna tutte le relazioni
 * @param {string} userId - ID utente da eliminare
 * @returns {Promise<boolean>} - True se l'eliminazione è avvenuta con successo
 */
async deleteUser(userId) {
    // Usiamo una sessione di transazione per garantire integrità
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log(`UserRepository: Starting deletion for user ${userId}`);

        // 1. Trova l'utente completo
        const user = await this.model.findById(userId).session(session);
        if (!user) {
            throw new Error('Utente non trovato');
        }

        // 2. Aggiorna le scuole in cui l'utente è manager
        const School = mongoose.model('School');
        const schoolsAsManager = await School.find({ manager: userId }).session(session);
        
        for (const school of schoolsAsManager) {
            console.log(`UserRepository: User is manager of school ${school._id}`);
            // Imposta un messaggio di avviso sulla scuola
            school.notes = `${school.notes || ''}\n[AVVISO] Il manager precedente (${user.firstName} ${user.lastName}) è stato rimosso il ${new Date().toLocaleString()}. Assegnare un nuovo manager.`;
            // Rimuovi l'utente come manager
            school.manager = null;
            await school.save({ session });
        }

        // 3. Rimuovi l'utente dagli utenti della scuola
        await School.updateMany(
            { 'users.user': userId },
            { $pull: { users: { user: userId } } },
            { session }
        );

        // 4. Aggiorna le classi in cui l'utente è mainTeacher
        const Class = mongoose.model('Class');
        const classesAsMainTeacher = await Class.find({ mainTeacher: userId }).session(session);
        
        for (const cls of classesAsMainTeacher) {
            console.log(`UserRepository: User is main teacher of class ${cls._id}`);
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
            console.log(`UserRepository: User is main teacher of student ${student._id}`);
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
        
        // Clear session tokens directly on the user object instead of using sessionService
        if (user.sessionTokens && Array.isArray(user.sessionTokens)) {
            user.sessionTokens = [];
        }
        
        await user.save({ session });

        // Removed the problematic line that was causing the error:
        // await this.sessionService.removeAllSessions(userId);

        // Commit della transazione
        await session.commitTransaction();
        console.log(`UserRepository: User ${userId} successfully deleted`);
        return true;
    } catch (error) {
        // Rollback in caso di errore
        await session.abortTransaction();
        console.error('UserRepository - Error deleting user:', error);
        throw error;
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
            
            console.log('Repository findWithFilters received:', { filters, options });
    
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
                console.log('Applying schoolId filter:', filters.schoolId);
                try {
                    const objectId = new mongoose.Types.ObjectId(filters.schoolId);
                    query.schoolId = objectId;
                } catch (err) {
                    console.error('Invalid schoolId format:', err);
                }
            }
    
            console.log('Final query:', query);
    
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
    
            console.log('Query results:', {
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
            console.error('Repository Error:', error);
            throw error;
        }
    }

    async getSchoolTeachers(schoolId) {
        try {
            console.log('UserRepository: Getting teachers for school:', schoolId);
            
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
    
            console.log('UserRepository: School query result:', {
                hasManager: !!school?.manager,
                usersCount: school?.users?.length || 0
            });
    
            return school;
        } catch (error) {
            console.error('UserRepository Error:', error);
            throw error;
        }
    }
}

module.exports = UserRepository;