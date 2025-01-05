// src/repositories/ClassRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Class } = require('../models');
const { AppError } = require('../utils/errors/AppError');

/**
 * Repository per la gestione delle operazioni specifiche delle classi
 * Estende le funzionalità base del BaseRepository
 */
class ClassRepository extends BaseRepository {
    constructor() {
        super(Class);
    }

    /**
     * Trova una classe con tutti i dettagli popolati
     * @param {String} id - ID della classe
     * @returns {Promise} Classe con dettagli
     */
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
            throw new AppError(
                'Errore nel recupero dei dettagli della classe',
                error.statusCode || 500,
                error.code || 'CLASS_DETAILS_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova tutte le classi di una scuola
     * @param {String} schoolId - ID della scuola
     * @param {String} academicYear - Anno accademico (opzionale)
     * @returns {Promise} Array di classi
     */
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
            throw new AppError(
                'Errore nella ricerca delle classi della scuola',
                500,
                'SCHOOL_CLASSES_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Aggiunge un insegnante alla classe
     * @param {String} classId - ID della classe
     * @param {String} teacherId - ID dell'insegnante
     * @returns {Promise} Classe aggiornata
     */
    async addTeacher(classId, teacherId) {
        try {
            const classData = await this.findById(classId);

            if (classData.teachers.includes(teacherId)) {
                throw new AppError(
                    'Insegnante già assegnato alla classe',
                    400,
                    'TEACHER_ALREADY_ASSIGNED'
                );
            }

            classData.teachers.push(teacherId);
            await classData.save();

            return classData;
        } catch (error) {
            throw new AppError(
                'Errore nell\'aggiunta dell\'insegnante alla classe',
                error.statusCode || 500,
                error.code || 'ADD_TEACHER_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Rimuove un insegnante dalla classe
     * @param {String} classId - ID della classe
     * @param {String} teacherId - ID dell'insegnante
     * @returns {Promise} Classe aggiornata
     */
    async removeTeacher(classId, teacherId) {
        try {
            const classData = await this.findById(classId);

            // Non permettere la rimozione del mainTeacher
            if (classData.mainTeacher.toString() === teacherId) {
                throw new AppError(
                    'Impossibile rimuovere l\'insegnante principale',
                    400,
                    'MAIN_TEACHER_REMOVAL_ERROR'
                );
            }

            classData.teachers = classData.teachers.filter(
                id => id.toString() !== teacherId
            );

            await classData.save();
            return classData;
        } catch (error) {
            throw new AppError(
                'Errore nella rimozione dell\'insegnante dalla classe',
                error.statusCode || 500,
                error.code || 'REMOVE_TEACHER_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Aggiunge uno studente alla classe
     * @param {String} classId - ID della classe
     * @param {String} studentId - ID dello studente
     * @returns {Promise} Classe aggiornata
     */
    async addStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);

            if (classData.students.includes(studentId)) {
                throw new AppError(
                    'Studente già presente nella classe',
                    400,
                    'STUDENT_ALREADY_ASSIGNED'
                );
            }

            classData.students.push(studentId);
            await classData.save();

            return classData;
        } catch (error) {
            throw new AppError(
                'Errore nell\'aggiunta dello studente alla classe',
                error.statusCode || 500,
                error.code || 'ADD_STUDENT_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Rimuove uno studente dalla classe
     * @param {String} classId - ID della classe
     * @param {String} studentId - ID dello studente
     * @returns {Promise} Classe aggiornata
     */
    async removeStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);
            
            classData.students = classData.students.filter(
                id => id.toString() !== studentId
            );

            await classData.save();
            return classData;
        } catch (error) {
            throw new AppError(
                'Errore nella rimozione dello studente dalla classe',
                error.statusCode || 500,
                error.code || 'REMOVE_STUDENT_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Verifica se una classe esiste con determinati criteri
     * @param {Object} criteria - Criteri di ricerca
     * @returns {Promise<boolean>} True se la classe esiste
     */
    async exists(criteria) {
        try {
            const count = await this.count(criteria);
            return count > 0;
        } catch (error) {
            throw new AppError(
                'Errore nella verifica esistenza classe',
                500,
                'CLASS_EXISTS_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova classi per insegnante
     * @param {String} teacherId - ID dell'insegnante
     * @param {String} academicYear - Anno accademico (opzionale)
     * @returns {Promise} Array di classi
     */
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
            throw new AppError(
                'Errore nella ricerca delle classi per insegnante',
                500,
                'TEACHER_CLASSES_ERROR',
                { error: error.message }
            );
        }
    }
}

module.exports = ClassRepository;