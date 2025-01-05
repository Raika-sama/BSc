// src/repositories/StudentRepository.js

const BaseRepository = require('./base/BaseRepository');
const { Student } = require('../models');
const { AppError } = require('../utils/errors/AppError');

/**
 * Repository per la gestione delle operazioni specifiche degli studenti
 * Estende le funzionalità base del BaseRepository
 */
class StudentRepository extends BaseRepository {
    constructor() {
        super(Student);
    }

    /**
     * Trova uno studente con tutti i dettagli popolati
     * @param {String} id - ID dello studente
     * @returns {Promise} Studente con dettagli
     */
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
            throw new AppError(
                'Errore nel recupero dei dettagli dello studente',
                error.statusCode || 500,
                error.code || 'STUDENT_DETAILS_ERROR',
                { error: error.message }
            );
        }
    }

/**
     * Trova una classe per ID
     * @param {String} classId - ID della classe
     * @returns {Promise} Classe trovata
     */
    async findClass(classId) {
        try {
            return await Class.findById(classId);
        } catch (error) {
            throw new AppError(
                'Errore nel recupero della classe',
                500,
                'CLASS_FETCH_ERROR',
                { error: error.message }
            );
        }
    }


    /**
     * Trova una classe per anno e sezione in una scuola
     * @param {String} schoolId - ID della scuola
     * @param {Number} year - Anno scolastico
     * @param {String} section - Sezione
     * @returns {Promise} Classe trovata
     */
    async findClassByYearAndSection(schoolId, year, section) {
        try {
            return await Class.findOne({ schoolId, year, section });
        } catch (error) {
            throw new AppError(
                'Errore nel recupero della classe',
                500,
                'CLASS_FETCH_ERROR',
                { error: error.message }
            );
        }
    }


    /**
     * Assegna uno studente a una classe con gestione dello storico
     * @param {String} studentId - ID dello studente
     * @param {Object} updateData - Dati per l'aggiornamento incluso lo storico
     * @returns {Promise} Studente aggiornato
     */
    async assignToClass(studentId, updateData) {
        try {
            const student = await this.findById(studentId);
            
            // Aggiorna i campi base
            student.classId = updateData.classId;
            student.section = updateData.section;
            student.currentYear = updateData.currentYear;
            student.mainTeacher = updateData.mainTeacher;
            student.teachers = updateData.teachers;
            student.lastClassChangeDate = updateData.lastClassChangeDate;
            student.needsClassAssignment = false;

            // Aggiungi la voce allo storico
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
            throw new AppError(
                'Errore nell\'assegnazione della classe',
                error.statusCode || 500,
                error.code || 'CLASS_ASSIGNMENT_ERROR',
                { error: error.message }
            );
        }
    }


    /**
     * Rimuove uno studente da una classe con registrazione storico
     * @param {String} studentId - ID dello studente
     * @param {String} reason - Motivo della rimozione
     * @returns {Promise} Studente aggiornato
     */
    async removeFromClass(studentId, reason = 'Rimozione dalla classe') {
        try {
            const student = await this.findById(studentId);
            
            // Aggiungi la voce allo storico prima della rimozione
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

            // Rimuovi l'assegnazione alla classe
            student.classId = null;
            student.section = null;
            student.mainTeacher = null;
            student.teachers = [];
            student.needsClassAssignment = true;
            student.lastClassChangeDate = new Date();

            await student.save();
            return student;
        } catch (error) {
            throw new AppError(
                'Errore nella rimozione dalla classe',
                error.statusCode || 500,
                error.code || 'CLASS_REMOVAL_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova studenti senza classe assegnata
     * @param {String} schoolId - ID della scuola
     * @returns {Promise} Array di studenti
     */
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
            throw new AppError(
                'Errore nella ricerca degli studenti non assegnati',
                500,
                'UNASSIGNED_SEARCH_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Trova studenti per classe
     * @param {String} classId - ID della classe
     * @returns {Promise} Array di studenti
     */
    async findByClass(classId) {
        try {
            return await this.find(
                { classId, isActive: true },
                { sort: { lastName: 1, firstName: 1 } }
            );
        } catch (error) {
            throw new AppError(
                'Errore nella ricerca degli studenti della classe',
                500,
                'CLASS_STUDENTS_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Aggiorna i dati degli insegnanti per gli studenti di una classe
     * @param {String} classId - ID della classe
     * @param {Object} teacherData - Dati degli insegnanti da aggiornare
     * @returns {Promise} Numero di studenti aggiornati
     */
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
            throw new AppError(
                'Errore nell\'aggiornamento degli insegnanti',
                500,
                'TEACHER_UPDATE_ERROR',
                { error: error.message }
            );
        }
    }

    /**
     * Cerca studenti per nome o cognome
     * @param {String} searchTerm - Termine di ricerca
     * @param {String} schoolId - ID della scuola
     * @returns {Promise} Array di studenti
     */
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
            throw new AppError(
                'Errore nella ricerca degli studenti per nome',
                500,
                'NAME_SEARCH_ERROR',
                { error: error.message }
            );
        }
    }
}

module.exports = StudentRepository;