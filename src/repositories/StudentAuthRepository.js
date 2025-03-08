// src/repositories/StudentAuthRepository.js
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const BaseRepository = require('./base/BaseRepository');
const bcrypt = require('bcryptjs');

class StudentAuthRepository extends BaseRepository {
    constructor(studentAuthModel) {
        super(studentAuthModel);
        this.repositoryName = 'StudentAuthRepository';
    }

    /**
     * Trova record di autenticazione per ID studente
     * @param {string} studentId - ID dello studente
     */
    async findByStudentId(studentId) {
        try {
            return await this.model.findOne({ studentId })
                .select('+password +temporaryPassword')
                .exec();
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findByStudentId',
                { studentId },
                this.repositoryName
            );
        }
    }

    /**
     * Trova record di autenticazione per username (email)
     * @param {string} username - Username dello studente
     */
    async findByUsername(username) {
        try {
            return await this.model.findOne({ username })
                .select('+password +temporaryPassword')
                .populate('student', 'firstName lastName email')
                .exec();
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findByUsername',
                { username },
                this.repositoryName
            );
        }
    }

    /**
     * Crea nuovo record di autenticazione
     * @param {Object} authData - Dati autenticazione
     */
    async create(authData) {
        try {
            const auth = await this.model.create({
                ...authData,
                createdAt: new Date()
            });

            logger.info('Student auth record created', { 
                studentId: auth.studentId 
            });

            return auth;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'create',
                { authData },
                this.repositoryName
            );
        }
    }

    /**
     * Aggiorna password
     * @param {string} studentId - ID dello studente
     * @param {string} hashedPassword - Nuova password hashata
     */
    async updatePassword(studentId, newPassword) {
        try {
            logger.debug('Updating password in repository', { studentId });

            // Hash the password using bcryptjs
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            const auth = await this.model.findOneAndUpdate(
                { studentId },
                {
                    $set: {
                        password: hashedPassword,
                        isFirstAccess: true,
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            if (!auth) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Record di autenticazione non trovato'
                );
            }

            logger.debug('Password updated successfully', { studentId });
            
            return auth;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'updatePassword',
                { studentId },
                this.repositoryName
            );
        }
    }

    /**
     * Aggiorna informazioni sessione
     * @param {string} studentId - ID dello studente
     * @param {Object} sessionData - Dati sessione
     */
    async updateSession(studentId, sessionData) {
        try {
            const update = {
                'currentSession.token': sessionData.token,
                'currentSession.createdAt': new Date(),
                'currentSession.expiresAt': sessionData.expiresAt,
                'currentSession.deviceInfo': sessionData.deviceInfo,
                lastLogin: new Date(),
                loginAttempts: 0,
                lockUntil: null
            };

            const auth = await this.model.findOneAndUpdate(
                { studentId },
                { $set: update },
                { new: true }
            );

            if (!auth) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Record di autenticazione non trovato'
                );
            }

            logger.debug('Session updated', { studentId });
            
            return auth;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'updateSession',
                { studentId },
                this.repositoryName
            );
        }
    }

    /**
     * Invalida sessione corrente
     * @param {string} studentId - ID dello studente
     */
    async invalidateSession(studentId) {
        try {
            await this.model.updateOne(
                { studentId },
                { 
                    $set: { 
                        currentSession: null 
                    }
                }
            );

            logger.info('Session invalidated', { studentId });
        } catch (error) {
            throw handleRepositoryError(
                error,
                'invalidateSession',
                { studentId },
                this.repositoryName
            );
        }
    }

    /**
     * Gestisce il blocco dell'account
     * @param {string} studentId - ID dello studente
     * @param {number} lockTime - Durata del blocco in millisecondi
     */
    async lockAccount(studentId, lockTime) {
        try {
            await this.model.updateOne(
                { studentId },
                { 
                    $set: { 
                        lockUntil: new Date(Date.now() + lockTime),
                        currentSession: null
                    }
                }
            );

            logger.warn('Account locked', { studentId, lockTime });
        } catch (error) {
            throw handleRepositoryError(
                error,
                'lockAccount',
                { studentId, lockTime },
                this.repositoryName
            );
        }
    }
}

module.exports = StudentAuthRepository;