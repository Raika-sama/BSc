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
            console.log('Fetching school with users for ID:', id);
    
            const school = await this.model.findById(id)
                .populate('manager', 'firstName lastName email role')
                .lean();  // Usiamo lean() per migliori performance
    
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'School non trovata'
                );
            }
    
            // Aggiungiamo un controllo per users
            if (!school.users) {
                school.users = [];  // Inizializziamo come array vuoto se undefined
            } else {
                // Solo se ci sono users, facciamo il populate
                await this.model.populate(school, {
                    path: 'users.user',
                    select: 'firstName lastName email role'
                });
            }
    
            console.log('Populated school data:', {
                id: school._id,
                usersCount: school.users.length,
                manager: school.manager
            });
    
            return school;
        } catch (error) {
            logger.error('Errore nel recupero della scuola con utenti', { 
                error, 
                schoolId: id 
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero della scuola con utenti',
                { originalError: error.message }
            );
        }
    }

    async findAll() {
        try {
            const schools = await this.model.find({})
                .populate('manager', 'firstName lastName email role')
                .lean();
    
            return schools;
        } catch (error) {
            logger.error('Errore nel recupero delle scuole', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero delle scuole',
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

    async setupAcademicYear(schoolId, yearData) {
         // Valida il formato dell'anno accademico
         const yearFormat = /^\d{4}\/\d{4}$/;
         if (!yearFormat.test(yearData.year)) {
             throw new Error(ErrorTypes.VALIDATION.INVALID_INPUT.message);
         }
        try {
          return await this.model.findByIdAndUpdate(
            schoolId,
            {
              $push: {
                academicYears: {
                  year: yearData.year,
                  status: yearData.status || 'planned',
                  startDate: yearData.startDate,
                  endDate: yearData.endDate,
                  createdBy: yearData.createdBy
                }
              }
            },
            { new: true }
          );
        } catch (error) {
          logger.error('Error in setupAcademicYear:', error);
          throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nella configurazione anno accademico'
          );
        }
      }
      
      async configureSections(schoolId, sectionsData) {
        // Valida il formato delle sezioni
        const sectionFormat = /^[A-Z]$/;
        const invalidSections = sectionsData.some(section => !sectionFormat.test(section.name));
        if (invalidSections) {
            throw new Error(ErrorTypes.VALIDATION.INVALID_INPUT.message);
        }
    
        try {
            const school = await this.findById(schoolId);
            if (!school) {
                throw createError(ErrorTypes.NOT_FOUND, 'School not found');
            }
    
            // Crea le sezioni con la struttura corretta
            const sections = sectionsData.map(section => ({
                name: section.name,
                isActive: true,
                academicYears: [{
                    status: 'active',
                    maxStudents: section.maxStudents
                }],
                createdAt: new Date()
            }));
    
            // Aggiorna la scuola con le nuove sezioni
            school.sections = sections;
            const updatedSchool = await school.save();
    
            // Restituisci le sezioni in un formato che corrisponde ai test
            return {
                sections: updatedSchool.sections.map(section => ({
                    name: section.name,
                    academicYears: section.academicYears
                }))
            };
        } catch (error) {
            logger.error('Error in configureSections:', error);
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella configurazione sezioni'
            );
        }
    }
      
      async updateSectionStatus(schoolId, sectionName, yearData) {
        try {
          return await this.model.findOneAndUpdate(
            { 
              _id: schoolId,
              'sections.name': sectionName 
            },
            {
              $push: {
                'sections.$.academicYears': {
                  year: yearData.year,
                  status: yearData.status,
                  maxStudents: yearData.maxStudents
                }
              }
            },
            { new: true }
          );
        } catch (error) {
          logger.error('Error in updateSectionStatus:', error);
          throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nell\'aggiornamento stato sezione'
          );
        }
      }

      
}

module.exports = SchoolRepository;