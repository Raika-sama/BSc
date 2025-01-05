// src/repositories/StudentRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Student, Class } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Repository per la gestione delle operazioni specifiche degli studenti
 * Estende le funzionalità base del BaseRepository
 */
class StudentRepository extends BaseRepository {
    constructor() {
        super(Student);
    }

    async findWithDetails(id) {
        try {
            const student = await this.findById(id, {
                populate: [
                    {
                        path: 'classId',
                        select: 'year section academicYear',
                        populate: {
                            path: 'mainTeacher',
                            select: 'firstName lastName email'
                        }
                    },
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
                    }
                ]
            });

            return student;
        } catch (error) {
            logger.error('Errore nel recupero dei dettagli dello studente', { error, studentId: id });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero dei dettagli dello studente',
                { originalError: error.message }
            );
        }
    }

    async findClass(classId) {
        try {
            return await Class.findById(classId);
        } catch (error) {
            logger.error('Errore nel recupero della classe', { error, classId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero della classe',
                { originalError: error.message }
            );
        }
    }

    async findClassByYearAndSection(schoolId, year, section) {
        try {
            return await Class.findOne({ schoolId, year, section });
        } catch (error) {
            logger.error('Errore nel recupero della classe', { error, schoolId, year, section });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nel recupero della classe',
                { originalError: error.message }
            );
        }
    }

    async assignToClass(studentId, updateData) {
        try {
            const student = await this.findById(studentId);
            
            student.classId = updateData.classId;
            student.section = updateData.section;
            student.currentYear = updateData.currentYear;
            student.mainTeacher = updateData.mainTeacher;
            student.teachers = updateData.teachers;
            student.lastClassChangeDate = updateData.lastClassChangeDate;
            student.needsClassAssignment = false;

            if (!student.classChangeHistory) {
                student.classChangeHistory = [];
            }

            student.classChangeHistory.push({
                fromClass: updateData.fromClass,
                toClass: updateData.classId,
                fromSection: updateData.fromSection,
                toSection: updateData.section,
                fromYear: updateData.fromYear,
                toYear: updateData.currentYear,
                date: updateData.lastClassChangeDate,
                reason: updateData.reason
            });

            await student.save();
            return student;
        } catch (error) {
            logger.error('Errore nell\'assegnazione della classe', { error, studentId, updateData });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'assegnazione della classe',
                { originalError: error.message }
            );
        }
    }

    async removeFromClass(studentId, reason = 'Rimozione dalla classe') {
        try {
            const student = await this.findById(studentId);
            
            if (!student.classChangeHistory) {
                student.classChangeHistory = [];
            }

            student.classChangeHistory.push({
                fromClass: student.classId,
                toClass: null,
                fromSection: student.section,
                toSection: null,
                fromYear: student.currentYear,
                toYear: null,
                date: new Date(),
                reason: reason
            });

            student.classId = null;
            student.section = null;
            student.mainTeacher = null;
            student.teachers = [];
            student.needsClassAssignment = true;
            student.lastClassChangeDate = new Date();

            await student.save();
            return student;
        } catch (error) {
            logger.error('Errore nella rimozione dalla classe', { error, studentId, reason });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella rimozione dalla classe',
                { originalError: error.message }
            );
        }
    }

    async findUnassigned(schoolId) {
        try {
            return await this.find(
                {
                    schoolId,
                    needsClassAssignment: true,
                    isActive: true
                },
                {
                    sort: { lastName: 1, firstName: 1 }
                }
            );
        } catch (error) {
            logger.error('Errore nella ricerca degli studenti non assegnati', { error, schoolId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca degli studenti non assegnati',
                { originalError: error.message }
            );
        }
    }

    async findByClass(classId) {
        try {
            return await this.find(
                { classId, isActive: true },
                { sort: { lastName: 1, firstName: 1 } }
            );
        } catch (error) {
            logger.error('Errore nella ricerca degli studenti della classe', { error, classId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca degli studenti della classe',
                { originalError: error.message }
            );
        }
    }

    async updateClassTeachers(classId, teacherData) {
        try {
            const result = await this.model.updateMany(
                { classId },
                {
                    $set: {
                        mainTeacher: teacherData.mainTeacher,
                        teachers: teacherData.teachers
                    }
                }
            );

            return result.modifiedCount;
        } catch (error) {
            logger.error('Errore nell\'aggiornamento degli insegnanti', { error, classId, teacherData });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nell\'aggiornamento degli insegnanti',
                { originalError: error.message }
            );
        }
    }

    async searchByName(searchTerm, schoolId) {
        try {
            const regex = new RegExp(searchTerm, 'i');
            return await this.find(
                {
                    schoolId,
                    isActive: true,
                    $or: [
                        { firstName: { $regex: regex } },
                        { lastName: { $regex: regex } }
                    ]
                },
                {
                    sort: { lastName: 1, firstName: 1 },
                    populate: {
                        path: 'classId',
                        select: 'year section'
                    }
                }
            );
        } catch (error) {
            logger.error('Errore nella ricerca degli studenti per nome', { error, searchTerm, schoolId });
            throw createError(
                ErrorTypes.DATABASE.QUERY_FAILED,
                'Errore nella ricerca degli studenti per nome',
                { originalError: error.message }
            );
        }
    }
}

module.exports = StudentRepository;