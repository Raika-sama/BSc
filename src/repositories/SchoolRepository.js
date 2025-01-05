// src/repositories/SchoolRepository.js

const BaseRepository = require('./base/BaseRepository');
const { School } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Repository per la gestione delle operazioni specifiche delle scuole
 * Estende le funzionalità base del BaseRepository
 */
class SchoolRepository extends BaseRepository {
    constructor() {
        super(School);
    }

    /**
     * Trova una scuola con tutti i suoi utenti
     * @param {String} id - ID della scuola
     * @returns {Promise} Scuola con utenti
     */
    async findWithUsers(id) {
        try {
            const school = await this.findById(id, {
                populate: {
                    path: 'users.user',
                    select: 'firstName lastName email role'
                }
            });

            return school;
        } catch (error) {
            logger.error('Errore nel recupero della scuola con utenti', { error, schoolId: id });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero della scuola con utenti',
                { originalError: error.message }
            );
        }
    }

    /**
     * Aggiunge un utente alla scuola
     * @param {String} schoolId - ID della scuola
     * @param {String} userId - ID dell'utente
     * @param {String} role - Ruolo dell'utente nella scuola
     * @returns {Promise} Scuola aggiornata
     */
    async addUser(schoolId, userId, role) {
        try {
            const school = await this.findById(schoolId);

            // Verifica se l'utente è già presente
            const existingUser = school.users.find(
                u => u.user.toString() === userId
            );

            if (existingUser) {
                logger.warn('Tentativo di aggiungere un utente già presente nella scuola', { 
                    schoolId, 
                    userId 
                });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Utente già associato alla scuola'
                );
            }

            // Aggiungi il nuovo utente
            school.users.push({ user: userId, role });
            await school.save();

            return school;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nell\'aggiunta dell\'utente alla scuola', { 
                error, 
                schoolId, 
                userId 
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta dell\'utente alla scuola',
                { originalError: error.message }
            );
        }
    }

    /**
     * Rimuove un utente dalla scuola
     * @param {String} schoolId - ID della scuola
     * @param {String} userId - ID dell'utente
     * @returns {Promise} Scuola aggiornata
     */
    async removeUser(schoolId, userId) {
        try {
            const school = await this.findById(schoolId);

            // Verifica se è l'ultimo admin
            const isLastAdmin = school.users.filter(u => u.role === 'admin').length === 1 &&
                              school.users.find(u => u.user.toString() === userId)?.role === 'admin';

            if (isLastAdmin) {
                logger.warn('Tentativo di rimuovere l\'ultimo admin della scuola', { 
                    schoolId, 
                    userId 
                });
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Impossibile rimuovere l\'ultimo admin della scuola'
                );
            }

            school.users = school.users.filter(
                u => u.user.toString() !== userId
            );

            await school.save();
            return school;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella rimozione dell\'utente dalla scuola', { 
                error, 
                schoolId, 
                userId 
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione dell\'utente dalla scuola',
                { originalError: error.message }
            );
        }
    }

    /**
     * Trova tutte le scuole attive in una regione
     * @param {String} region - Nome della regione
     * @returns {Promise} Array di scuole
     */
    async findByRegion(region) {
        try {
            return await this.find(
                { region, isActive: true },
                { sort: { name: 1 } }
            );
        } catch (error) {
            logger.error('Errore nella ricerca delle scuole per regione', { 
                error, 
                region 
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca delle scuole per regione',
                { originalError: error.message }
            );
        }
    }
}

module.exports = SchoolRepository;