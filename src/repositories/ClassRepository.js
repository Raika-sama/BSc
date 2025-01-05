// src/repositories/ClassRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Class } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class ClassRepository extends BaseRepository {
    constructor() {
        super(Class);
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

    async exists(criteria) {
        try {
            const count = await this.count(criteria);
            return count > 0;
        } catch (error) {
            logger.error('Errore nella verifica esistenza classe', { error });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella verifica esistenza classe',
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
}

module.exports = ClassRepository;