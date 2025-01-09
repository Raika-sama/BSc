// src/repositories/ClassRepository.js
const mongoose = require('mongoose');  // Aggiungi questo import
const BaseRepository = require('./base/BaseRepository');
const { Class, User, School } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class ClassRepository extends BaseRepository {
    constructor() {
        super(Class);
    }


    async exists(criteria) {
        try {
            logger.debug('Verifica esistenza classe con criteri:', criteria);
            
            // Verifica che l'ID della scuola sia valido
            if (!mongoose.Types.ObjectId.isValid(criteria.schoolId)) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola non valido'
                );
            }

            // Usa il modello Class direttamente
            const existingClass = await Class.findOne({
                schoolId: criteria.schoolId,
                year: criteria.year,
                section: criteria.section,
                academicYear: criteria.academicYear
            }).exec(); // Aggiungi .exec() per assicurarti che la promise sia risolta

            logger.debug('Risultato verifica esistenza:', { 
                exists: !!existingClass,
                searchCriteria: criteria 
            });

            return !!existingClass;
        } catch (error) {
            logger.error('Errore nella verifica esistenza classe:', {
                error: error.message,
                stack: error.stack,
                criteria
            });
            
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella verifica esistenza classe',
                { originalError: error.message }
            );
        }
    }


    async create(data) {
        try {
            // Verifica stato connessione database
            if (mongoose.connection.readyState !== 1) {
                throw createError(
                    ErrorTypes.DATABASE.CONNECTION_ERROR,
                    'Database non connesso'
                );
            }

            // Verifica che i dati siano validi
            if (!data || !data.schoolId || !data.mainTeacher) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Dati classe incompleti'
                );
            }

            // Crea un nuovo documento usando il modello direttamente
            const classDoc = new Class(data);
            
            // Valida il documento
            await classDoc.validate();

            // Salva il documento
            const savedClass = await classDoc.save();

            logger.info('Classe creata con successo:', {
                classId: savedClass._id,
                schoolId: savedClass.schoolId
            });

            return savedClass;

        } catch (error) {
            logger.error('Errore creazione classe:', {
                message: error.message,
                stack: error.stack,
                validationErrors: error.errors,
                data: data
            });

            if (error.name === 'ValidationError') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errore di validazione: ' + error.message
                );
            }

            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella creazione della classe: ' + error.message
            );
        }
    }

    async findUserWithSchool(userId) {
        try {
            return await User.findById(userId).populate('schoolId');
        } catch (error) {
            logger.error('Errore nel recupero dei dettagli utente', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dei dettagli utente',
                { originalError: error.message }
            );
        }
    }

    async findWithDetails(id) {
        try {
            const classData = await this.findById(id, {
                populate: [
                    {
                        path: 'schoolId',
                        select: 'name schoolType'
                    },
                    {
                        path: 'mainTeacher',
                        select: 'firstName lastName email'
                    },
                    {
                        path: 'teachers',
                        select: 'firstName lastName email'
                    },
                    {
                        path: 'students',
                        select: 'firstName lastName email'
                    }
                ]
            });

            return classData;
        } catch (error) {
            logger.error('Errore nel recupero dei dettagli della classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dei dettagli della classe',
                { originalError: error.message }
            );
        }
    }

    async findBySchool(schoolId, academicYear) {
        try {
            const filter = { schoolId, isActive: true };
            if (academicYear) {
                filter.academicYear = academicYear;
            }

            return await this.find(filter, {
                sort: { year: 1, section: 1 },
                populate: [
                    {
                        path: 'mainTeacher',
                        select: 'firstName lastName'
                    }
                ]
            });
        } catch (error) {
            logger.error('Errore nella ricerca delle classi della scuola', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca delle classi della scuola',
                { originalError: error.message }
            );
        }
    }

    async addTeacher(classId, teacherId) {
        try {
            const classData = await this.findById(classId);

            if (classData.teachers.includes(teacherId)) {
                logger.warn('Tentativo di aggiungere un insegnante già assegnato', { classId, teacherId });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Insegnante già assegnato alla classe'
                );
            }

            classData.teachers.push(teacherId);
            await classData.save();

            return classData;
        } catch (error) {
            if (error.code) throw error; // Se è già un errore formattato
            logger.error('Errore nell\'aggiunta dell\'insegnante alla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta dell\'insegnante alla classe',
                { originalError: error.message }
            );
        }
    }

    async removeTeacher(classId, teacherId) {
        try {
            const classData = await this.findById(classId);

            if (classData.mainTeacher.toString() === teacherId) {
                logger.warn('Tentativo di rimuovere l\'insegnante principale', { classId, teacherId });
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Impossibile rimuovere l\'insegnante principale'
                );
            }

            classData.teachers = classData.teachers.filter(
                id => id.toString() !== teacherId
            );

            await classData.save();
            return classData;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nella rimozione dell\'insegnante dalla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione dell\'insegnante dalla classe',
                { originalError: error.message }
            );
        }
    }

    async addStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);

            if (classData.students.includes(studentId)) {
                logger.warn('Tentativo di aggiungere uno studente già presente', { classId, studentId });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Studente già presente nella classe'
                );
            }

            classData.students.push(studentId);
            await classData.save();

            return classData;
        } catch (error) {
            if (error.code) throw error;
            logger.error('Errore nell\'aggiunta dello studente alla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta dello studente alla classe',
                { originalError: error.message }
            );
        }
    }

    async addStudents(classId, studentIds) {
        try {
            const classData = await this.findById(classId);
            const newStudents = studentIds.filter(id => 
                !classData.students.includes(id)
            );
            
            if (newStudents.length) {
                classData.students.push(...newStudents);
                await classData.save();
            }
            return classData;
        } catch (error) {
            logger.error('Errore nell\'aggiunta degli studenti', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiunta degli studenti'
            );
        }
    }

    async removeStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);
            
            classData.students = classData.students.filter(
                id => id.toString() !== studentId
            );

            await classData.save();
            return classData;
        } catch (error) {
            logger.error('Errore nella rimozione dello studente dalla classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione dello studente dalla classe',
                { originalError: error.message }
            );
        }
    }


    async findByTeacher(teacherId, academicYear) {
        try {
            const filter = {
                $or: [
                    { mainTeacher: teacherId },
                    { teachers: teacherId }
                ],
                isActive: true
            };

            if (academicYear) {
                filter.academicYear = academicYear;
            }

            return await this.find(filter, {
                sort: { year: 1, section: 1 },
                populate: {
                    path: 'schoolId',
                    select: 'name'
                }
            });
        } catch (error) {
            logger.error('Errore nella ricerca delle classi per insegnante', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca delle classi per insegnante',
                { originalError: error.message }
            );
        }
    }

    async createInitialClasses(schoolId, academicYear, sections) {
        try {
          const school = await this.model('School').findById(schoolId);
          const years = school.schoolType === 'middle_school' ? 3 : 5;
          
          const classes = sections.flatMap(section => 
            Array.from({ length: years }, (_, i) => ({
              schoolId,
              year: i + 1,
              section: section.name,
              academicYear,
              status: 'planned',
              capacity: section.maxStudents
            }))
          );
      
          return await this.model.insertMany(classes);
        } catch (error) {
          logger.error('Error in createInitialClasses:', error);
          throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nella creazione classi iniziali'
          );
        }
      }
      
      async promoteStudents(fromYear, toYear) {
        const session = await mongoose.startSession();
        session.startTransaction();
      
        try {
          const oldClasses = await this.find({ 
            academicYear: fromYear,
            status: 'active'
          });
      
          for (const oldClass of oldClasses) {
            if (oldClass.year < (oldClass.schoolType === 'middle_school' ? 3 : 5)) {
              const newClass = await this.create({
                schoolId: oldClass.schoolId,
                year: oldClass.year + 1,
                section: oldClass.section,
                academicYear: toYear,
                status: 'active',
                capacity: oldClass.capacity
              });
      
              await this.model.updateMany(
                { 
                  _id: oldClass._id,
                  'students.status': 'active'
                },
                { 
                  $set: {
                    'students.$[].status': 'transferred',
                    'students.$[].leftAt': new Date()
                  }
                }
              );
            }
          }
      
          await session.commitTransaction();
          session.endSession();
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          logger.error('Error in promoteStudents:', error);
          throw createError(
            ErrorTypes.DATABASE.QUERY_FAILED,
            'Errore nella promozione studenti'
          );
        }
      }

}

module.exports = ClassRepository;