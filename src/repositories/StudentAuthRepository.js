// src/repositories/StudentAuthRepository.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const BaseRepository = require('./base/BaseRepository');
const bcrypt = require('bcryptjs');

class StudentAuthRepository extends BaseRepository {
    constructor(studentAuthModel) {
        super(studentAuthModel);
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
            logger.error('Error finding auth by student ID', { error, studentId });
            throw error;
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
            logger.error('Error finding auth by username', { error, username });
            throw error;
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
            logger.error('Error creating student auth', { error });
            
            if (error.code === 11000) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Credenziali già esistenti per questo studente'
                );
            }
            
            throw error;
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
            logger.error('Error updating password in repository:', { error, studentId });
            throw error;
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
            logger.error('Error updating session', { error, studentId });
            throw error;
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
            logger.error('Error invalidating session', { error, studentId });
            throw error;
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
            logger.error('Error locking account', { error, studentId });
            throw error;
        }
    }
}

module.exports = StudentAuthRepository;