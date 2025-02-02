// src/repositories/SchoolRepository.js
const mongoose = require('mongoose');
const { Class, Student  } = require('../models');  // Aggiungi anche questo import

const BaseRepository = require('./base/BaseRepository');
const { School } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Repository per la gestione delle operazioni specifiche delle scuole
 * Estende le funzionalità base del BaseRepository
 */
class SchoolRepository extends BaseRepository {
    constructor(schoolModel, classRepository, studentRepository) {
        super(School);
        this.classRepository = classRepository;
        this.studentRepository = studentRepository;
        
        // Binding dei metodi che usano i repository
        this.deactivateSection = this.deactivateSection.bind(this);
        this.reactivateSection = this.reactivateSection.bind(this);
    }

    async findOne(criteria, options = {}) {
        try {
            let query = this.model.findOne(criteria);

            if (options.populate) {
                query = query.populate(options.populate);
            }

            const result = await query.exec();
            return result;
        } catch (error) {
            logger.error('Error in SchoolRepository.findOne:', {
                error: error.message,
                criteria,
                options
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca della scuola',
                { originalError: error.message }
            );
        }
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

    async findById(id, options = {}) {
        try {
            logger.debug('Finding school by ID:', { 
                id,
                type: typeof id,
                idToString: id ? id.toString() : null 
            });
            
            if (!id) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola non valido'
                );
            }
    
            let query = this.model.findById(id.toString());  // Forziamo la conversione a string
            
            if (options.populate) {
                query = query.populate(options.populate);
            }
    
            const school = await query.exec();
            
            if (!school) {
                logger.debug('School not found with ID:', { id });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            logger.debug('School found:', { 
                schoolId: school._id,
                schoolName: school.name 
            });
    
            return school;
        } catch (error) {
            logger.error('Error in SchoolRepository.findById:', {
                error: error.message,
                schoolId: id,
                type: typeof id
            });
            throw error;
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

      async deleteWithClasses(id) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            logger.debug('Starting delete operation for school:', { schoolId: id });
    
            // 1. Verifica esistenza scuola
            const school = await this.model.findById(id).session(session);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            // 2. Elimina le classi
            const deleteClassesResult = await Class.deleteMany(
                { schoolId: id },
                { session }
            );
    
            logger.debug('Classes deleted:', { count: deleteClassesResult.deletedCount });
    
            // 3. Elimina la scuola
            await this.model.findByIdAndDelete(id).session(session);
    
            // 4. Commit della transazione
            await session.commitTransaction();
    
            return {
                school,
                deletedClassesCount: deleteClassesResult.deletedCount
            };
    
        } catch (error) {
            logger.error('Error in deleteWithClasses:', error);
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

//il metodo deactivateSection() disattiva una sezione di una scuola
//usa metodi di classRep e studentRep
    async deactivateSection(schoolId, sectionName) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            logger.debug('Repository: Inizio deactivateSection', {
                schoolId,
                sectionName,
                hasClassRepository: !!this.classRepository, // Verifica se classRepository è definito
                hasStudentRepository: !!this.studentRepository
            });    
            // 1. Aggiorna la sezione nella scuola
            const school = await this.model.findOneAndUpdate(
                { 
                    _id: schoolId,
                    'sections.name': sectionName 
                },
                {
                    $set: {
                        'sections.$.isActive': false,
                        'sections.$.deactivatedAt': new Date(),
                        'sections.$.students': [] // Svuota l'array degli studenti nella sezione
                    }
                },
                { 
                    new: true,
                    session 
                }
            );
    
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola o sezione non trovata'
                );
            }

            logger.debug('Prima di chiamare deactivateClassesBySection', {
                schoolId,
                sectionName,
                hasClassRepository: !!this.classRepository,
                session: !!session
            });

            // 2. Disattiva le classi usando il metodo dedicato nel classRepository
            await this.classRepository.deactivateClassesBySection(schoolId, sectionName, session);
    
            // 3. Aggiorna gli studenti usando il metodo dedicato nel studentRepository
            const studentUpdateResult = await this.studentRepository.updateStudentsForDeactivatedSection(
                schoolId, 
                sectionName
            );
    
            await session.commitTransaction();
            
            logger.debug('Section deactivation completed successfully:', {
                schoolId,
                sectionName,
                studentsUpdated: studentUpdateResult.modifiedCount
            });
    
            return {
                school,
                studentsUpdated: studentUpdateResult.modifiedCount
            };
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error in deactivateSection:', {
                error: error.message,
                schoolId,
                sectionName
            });
            throw error;
        } finally {
            session.endSession();
        }
    }

    async reactivateSection(schoolId, sectionName) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            logger.debug('Repository: Inizio reactivateSection', { 
                schoolId, 
                sectionName 
            });
    
            // 1. Recupera la scuola con il manager
            const school = await this.model.findById(schoolId)
                .populate('manager')
                .session(session);
    
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            // 2. Trova e valida la sezione
            const section = school.sections.find(s => s.name === sectionName);
            if (!section) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Sezione non trovata'
                );
            }
    
            // 3. Aggiorna lo stato della sezione
            section.isActive = true;
            section.deactivatedAt = undefined;
    
            // 4. Trova le classi da riattivare
            const classesToReactivate = await Class.find({
                schoolId,
                section: sectionName,
                isActive: false
            }).session(session);
    
            logger.debug('Classi da riattivare trovate:', {
                count: classesToReactivate.length,
                classi: classesToReactivate.map(c => ({
                    id: c._id,
                    year: c.year,
                    section: c.section,
                    hasPreviousMainTeacher: !!c.previousMainTeacher
                }))
            });
    
            // 5. Aggiorna ogni classe
            for (const classDoc of classesToReactivate) {
                // Gestione mainTeacher
                if (classDoc.previousMainTeacher) {
                    classDoc.mainTeacher = classDoc.previousMainTeacher;
                    classDoc.previousMainTeacher = undefined;
                } else {
                    // Se non c'è un mainTeacher precedente, usa il manager della scuola
                    classDoc.mainTeacher = school.manager._id;
                }
    
                // Aggiorna gli altri campi della classe
                classDoc.isActive = true;
                classDoc.status = 'planned';
                classDoc.deactivatedAt = undefined;
                classDoc.updatedAt = new Date();
    
                await classDoc.save({ session });
            }
    
            // 6. Salva le modifiche alla scuola
            const updatedSchool = await school.save({ session });
    
            await session.commitTransaction();
    
            logger.info('Sezione e classi riattivate con successo:', {
                schoolId,
                sectionName,
                classesReactivated: classesToReactivate.length,
                classesWithPreviousTeacher: classesToReactivate.filter(c => c.previousMainTeacher).length,
                classesWithManagerAsTeacher: classesToReactivate.filter(c => 
                    c.mainTeacher.toString() === school.manager._id.toString()
                ).length
            });
    
            return {
                school: updatedSchool,
                classesReactivated: classesToReactivate.length
            };
    
        } catch (error) {
            await session.abortTransaction();
            logger.error('Errore nella riattivazione della sezione:', {
                error: error.message,
                stack: error.stack,
                schoolId,
                sectionName
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella riattivazione della sezione',
                { originalError: error.message }
            );
        } finally {
            session.endSession();
        }
    }

    async getStudentsBySection(schoolId, sectionName) {
        try {
            logger.debug('Recupero studenti per sezione:', { schoolId, sectionName });
            
            // Trova prima tutte le classi attive per questa sezione
            const classes = await Class.find({
                schoolId,
                section: sectionName,
                isActive: true
            }).select('_id');

            const classIds = classes.map(c => c._id);

            // Trova tutti gli studenti in queste classi
            const students = await Student.find({
                schoolId,
                classId: { $in: classIds },
                isActive: true
            });

            logger.debug('Studenti trovati:', { 
                count: students.length,
                schoolId,
                sectionName 
            });

            return students;
        } catch (error) {
            logger.error('Errore nel recupero studenti per sezione:', {
                error,
                schoolId,
                sectionName
            });
            throw error;
        }
    }

    async getSectionsWithStudentCount(schoolId) {
        try {
            // 1. Trova tutte le classi attive della scuola raggruppate per sezione
            const classesWithStudents = await Class.aggregate([
                { 
                    $match: { 
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        isActive: true 
                    } 
                },
                {
                    $group: {
                        _id: '$section',
                        studentCount: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: '$students',
                                        as: 'student',
                                        cond: { $eq: ['$$student.status', 'active'] }
                                    }
                                }
                            }
                        }
                    }
                }
            ]);
    
            // 2. Trova la scuola con le sue sezioni
            const school = await this.model.findById(schoolId);
            
            // 3. Mappa le sezioni con i conteggi degli studenti
            const sectionsWithCounts = school.sections.map(section => {
                const stats = classesWithStudents.find(c => c._id === section.name);
                return {
                    ...section.toObject(),
                    studentsCount: stats?.studentCount || 0
                };
            });
    
            return sectionsWithCounts;
        } catch (error) {
            logger.error('Error in getSectionsWithStudentCount:', error);
            throw error;
        }
    }

    // In SchoolRepository.js

    async removeManagerFromSchool(schoolId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la scuola e verifica che esista
            const school = await this.model.findById(schoolId).session(session);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            const oldManagerId = school.manager;
    
            // 2. Aggiorna le classi dove l'ex manager è mainTeacher
            await Class.updateMany(
                {
                    schoolId,
                    mainTeacher: oldManagerId
                },
                {
                    $set: {
                        mainTeacherIsTemporary: true,
                        previousMainTeacher: oldManagerId,
                        mainTeacher: null  // Temporaneamente null
                    }
                },
                { session }
            );
    
            // 3. Aggiorna gli studenti che avevano l'ex manager come mainTeacher
            await Student.updateMany(
                {
                    schoolId,
                    mainTeacher: oldManagerId
                },
                {
                    $set: { mainTeacher: null },
                    $pull: { teachers: oldManagerId }  // Rimuove l'ex manager dall'array teachers
                },
                { session }
            );
    
            // 4. Rimuovi il manager dalla scuola e dall'array users
            const updatedSchool = await this.model.findByIdAndUpdate(
                schoolId,
                {
                    $set: { manager: null },
                    $pull: { users: { user: oldManagerId } }  // Rimuove l'utente dall'array users
                },
                { 
                    new: true,
                    session 
                }
            );
    
            await session.commitTransaction();
            
            logger.info('Manager rimosso con successo', {
                schoolId,
                oldManagerId,
                wasAlsoUser: school.users.some(u => u.user.toString() === oldManagerId.toString())
            });
    
            return {
                school: updatedSchool,
                oldManagerId
            };
    
        } catch (error) {
            await session.abortTransaction();
            logger.error('Errore nella rimozione del manager:', {
                error: error.message,
                schoolId
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione del manager',
                { originalError: error.message }
            );
        } finally {
            session.endSession();
        }
    }

    async addManagerToSchool(schoolId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la scuola e verifica che esista
            const school = await this.model.findById(schoolId).session(session);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            // 2. Verifica che non ci sia già un manager
            if (school.manager) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'La scuola ha già un manager'
                );
            }
    
            // 3. Aggiorna la scuola con il nuovo manager
            const updatedSchool = await this.model.findByIdAndUpdate(
                schoolId,
                {
                    $set: { manager: userId },
                    $push: { 
                        users: { 
                            user: userId, 
                            role: 'manager' 
                        } 
                    }
                },
                { 
                    new: true,
                    session 
                }
            );
    
            await session.commitTransaction();
            
            logger.info('Manager aggiunto con successo', {
                schoolId,
                newManagerId: userId
            });
    
            return {
                school: updatedSchool,
                newManagerId: userId
            };
    
        } catch (error) {
            await session.abortTransaction();
            logger.error('Errore nell\'aggiunta del manager:', {
                error: error.message,
                schoolId
            });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta del manager',
                { originalError: error.message }
            );
        } finally {
            session.endSession();
        }
    }
      
}

module.exports = SchoolRepository;