/**
 * @file StudentBulkImportRepository.js
 * @description Repository per la gestione dell'import massivo degli studenti
 * @author Raika-sama
 * @date 2025-02-01 10:41:52
 */

const mongoose = require('mongoose');
const BaseRepository = require('./base/BaseRepository');
const { Student } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class StudentBulkImportRepository extends BaseRepository {
    constructor() {
        super(Student);
        this.model = Student;
    }

    /**
     * Converte una data dal formato IT (DD/MM/YYYY) al formato ISO
     * @private
     */
    _convertDate(italianDate) {
        const [day, month, year] = italianDate.split('/');
        return new Date(year, month - 1, day).toISOString();
    }

    /**
     * Prepara i dati dello studente per l'inserimento
     * @private
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
     * Valida i dati preparati prima dell'inserimento
     * @private
     */
    _validatePreparedData(data) {
        return !!(
            data &&
            data.firstName &&
            data.lastName &&
            data.email &&
            data.dateOfBirth &&
            data.gender &&
            data.schoolId
        );
    }

    /**
     * Esegue l'import massivo degli studenti
     * @param {Array} studentsData - Array di dati degli studenti da importare
     * @param {string} schoolId - ID della scuola
     * @returns {Object} Risultati dell'importazione
     * @throws {Error} In caso di errori durante l'importazione
     */
    async bulkImport(studentsData, schoolId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug('Starting bulk import process', { 
                studentsCount: studentsData.length,
                schoolId,
                timestamp: new Date().toISOString()
            });

            const results = {
                imported: 0,
                failed: 0,
                errors: [],
                duplicates: []
            };

            // Verifica preliminare delle email duplicate nel database
            const emails = studentsData.map(student => student.email?.trim().toLowerCase()).filter(Boolean);
            const existingEmails = await this.model.find(
                { email: { $in: emails } },
                { email: 1 },
                { session }
            );

            if (existingEmails.length > 0) {
                results.duplicates = existingEmails.map(doc => doc.email);
                logger.warn('Found duplicate emails in database', {
                    count: existingEmails.length,
                    emails: results.duplicates
                });
            }

            // Prepariamo tutti i dati
            const preparedStudents = studentsData.map((student, index) => {
                try {
                    // Salta gli studenti con email duplicate
                    if (results.duplicates.includes(student.email?.trim().toLowerCase())) {
                        results.errors.push({
                            row: index + 2,
                            message: 'Email già presente nel sistema',
                            error: 'DUPLICATE_EMAIL',
                            data: {
                                email: student.email,
                                firstName: student.firstName,
                                lastName: student.lastName
                            }
                        });
                        return null;
                    }

                    const preparedData = this._prepareStudentData(student, schoolId);
                    
                    // Validazione aggiuntiva dei dati preparati
                    if (!this._validatePreparedData(preparedData)) {
                        throw new Error('Dati preparati non validi');
                    }

                    return preparedData;

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
                    'Nessun dato valido da importare',
                    { details: results.errors }
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
                failed: results.failed,
                errors: results.errors.length,
                duplicates: results.duplicates.length,
                timestamp: new Date().toISOString()
            });

            return results;

        } catch (error) {
            await session.abortTransaction();
            
            logger.error('Error in bulk import:', { 
                error: error.message,
                code: error.code,
                stack: error.stack,
                timestamp: new Date().toISOString()
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

            // Se è un errore di validazione, lo propaghiamo
            if (error.code === ErrorTypes.VALIDATION.BAD_REQUEST.code) {
                throw error;
            }

            // Altri errori vengono convertiti in errori interni
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Errore durante l\'importazione degli studenti',
                { originalError: error.message }
            );

        } finally {
            session.endSession();
        }
    }
}

// Esporta la classe invece dell'istanza
module.exports = StudentBulkImportRepository;