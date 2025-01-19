// src/repositories/StudentBulkImportRepository.js

const mongoose = require('mongoose');
const BaseRepository = require('./base/BaseRepository');
const { Student } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class StudentBulkImportRepository extends BaseRepository {
    constructor() {
        super(Student);
    }

    /**
     * Converte una data dal formato IT (DD/MM/YYYY) al formato ISO
     */
    _convertDate(italianDate) {
        const [day, month, year] = italianDate.split('/');
        return new Date(year, month - 1, day).toISOString();
    }

    /**
     * Prepara i dati dello studente per l'inserimento
     */
    _prepareStudentData(studentData, schoolId) {
        return {
            firstName: studentData.firstName.trim(),
            lastName: studentData.lastName.trim(),
            gender: studentData.gender,
            dateOfBirth: this._convertDate(studentData.dateOfBirth),
            email: studentData.email.trim().toLowerCase(),
            parentEmail: studentData.parentEmail?.trim().toLowerCase(),
            fiscalCode: studentData.fiscalCode?.trim().toUpperCase(),
            schoolId: schoolId,
            specialNeeds: !!studentData.specialNeeds,
            status: 'pending',
            needsClassAssignment: true,
            isActive: true
        };
    }

    /**
     * Esegue l'import massivo degli studenti
     */
    async bulkImport(studentsData, schoolId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug('Starting bulk import', { 
                studentsCount: studentsData.length,
                schoolId 
            });

            const results = {
                imported: 0,
                failed: 0,
                errors: []
            };

            // Prepariamo tutti i dati
            const preparedStudents = studentsData.map((student, index) => {
                try {
                    return this._prepareStudentData(student, schoolId);
                } catch (error) {
                    results.errors.push({
                        row: index + 2,
                        message: 'Errore nella preparazione dei dati',
                        error: error.message,
                        data: student
                    });
                    return null;
                }
            }).filter(Boolean);

            if (preparedStudents.length === 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Nessun dato valido da importare'
                );
            }

            // Eseguiamo l'inserimento massivo
            const insertedStudents = await this.model.insertMany(preparedStudents, {
                session,
                ordered: false // Continua anche se alcuni inserimenti falliscono
            });

            results.imported = insertedStudents.length;
            results.failed = studentsData.length - insertedStudents.length;

            await session.commitTransaction();
            logger.info('Bulk import completed successfully', {
                imported: results.imported,
                failed: results.failed
            });

            return results;

        } catch (error) {
            await session.abortTransaction();
            
            logger.error('Error in bulk import:', { 
                error: error.message,
                code: error.code
            });

            // Gestione specifica per errori di duplicate key (email)
            if (error.code === 11000) {
                throw createError(
                    ErrorTypes.VALIDATION.ALREADY_EXISTS,
                    'Email già presente nel sistema',
                    { 
                        duplicateKey: error.keyValue,
                        details: error.message
                    }
                );
            }

            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = new StudentBulkImportRepository();