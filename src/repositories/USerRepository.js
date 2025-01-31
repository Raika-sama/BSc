// src/repositories/UserRepository.js
const BaseRepository = require('./base/BaseRepository');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

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
     * Soft delete utente
     * @param {string} userId - ID utente
     */
    async softDelete(userId) {
        try {
            const user = await this.model.findByIdAndUpdate(
                userId,
                {
                    isDeleted: true,
                    deletedAt: new Date(),
                    status: 'inactive'
                },
                { new: true }
            );

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            logger.info('User soft deleted', { userId });
            return user;
        } catch (error) {
            logger.error('Error soft deleting user', { error });
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
            const query = { isDeleted: false, ...filters };
            const {
                page = 1,
                limit = 10,
                sort = { createdAt: -1 }
            } = options;

            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                this.model
                    .find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                this.model.countDocuments(query)
            ]);

            return {
                users,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error('Error finding users with filters', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca utenti'
            );
        }
    }
}

module.exports = UserRepository;