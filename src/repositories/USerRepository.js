// src/repositories/UserRepository.js
const BaseRepository = require('./base/BaseRepository');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

class UserRepository extends BaseRepository {
    constructor(userModel) {
        super(userModel);
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
            const user = await this.model.findByIdAndUpdate(
                userId,
                { 
                    ...updateData,
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            logger.info('User updated', { userId });
            return user;
        } catch (error) {
            logger.error('Error updating user', { error });
            throw error;
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