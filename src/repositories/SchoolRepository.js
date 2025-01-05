// src/repositories/SchoolRepository.js

const BaseRepository = require('./base/BaseRepository');
const { School } = require('../models');
const { AppError } = require('../utils/errors/AppError');

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
            throw new AppError(
                'Errore nel recupero della scuola con utenti',
                error.statusCode || 500,
                error.code || 'SCHOOL_USERS_ERROR',
                { error: error.message }
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
                throw new AppError(
                    'Utente già associato alla scuola',
                    400,
                    'USER_ALREADY_EXISTS'
                );
            }

            // Aggiungi il nuovo utente
            school.users.push({ user: userId, role });
            await school.save();

            return school;
        } catch (error) {
            throw new AppError(
                'Errore nell\'aggiunta dell\'utente alla scuola',
                error.statusCode || 500,
                error.code || 'ADD_USER_ERROR',
                { error: error.message }
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
                throw new AppError(
                    'Impossibile rimuovere l\'ultimo admin della scuola',
                    400,
                    'LAST_ADMIN_ERROR'
                );
            }

            school.users = school.users.filter(
                u => u.user.toString() !== userId
            );

            await school.save();
            return school;
        } catch (error) {
            throw new AppError(
                'Errore nella rimozione dell\'utente dalla scuola',
                error.statusCode || 500,
                error.code || 'REMOVE_USER_ERROR',
                { error: error.message }
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
            throw new AppError(
                'Errore nella ricerca delle scuole per regione',
                500,
                'REGION_SEARCH_ERROR',
                { error: error.message }
            );
        }
    }
}

module.exports = SchoolRepository;