/**
 * @file StudentBulkImportRepository.js
 * @description Repository per la gestione dell'import massivo degli studenti
 * @author Raika-sama
 * @date 2025-02-01 10:41:52
 */

const mongoose = require('mongoose');
const BaseRepository = require('./base/BaseRepository');
const { Student, Class } = require('../models');
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
     * @param {string} italianDate - Data in formato italiano DD/MM/YYYY
     * @returns {string} - Data in formato ISO
     */
    _convertDate(italianDate) {
        // Gestisce diversi formati possibili
        if (!italianDate) return null;
        
        // Prova a parsare come DD/MM/YYYY
        if (typeof italianDate === 'string' && italianDate.includes('/')) {
            const [day, month, year] = italianDate.split('/');
            return new Date(year, month - 1, day).toISOString();
        }
        
        // Se è già un Date object o una data ISO
        if (italianDate instanceof Date || (typeof italianDate === 'string' && !isNaN(Date.parse(italianDate)))) {
            return new Date(italianDate).toISOString();
        }
        
        return null;
    }

    /**
     * Prepara i dati dello studente per l'inserimento
     * @private
     * @param {Object} studentData - Dati grezzi dello studente
     * @param {string} schoolId - ID della scuola
     * @returns {Object} - Dati preparati per l'inserimento
     */
    _prepareStudentData(studentData, schoolId) {
        return {
            firstName: studentData.firstName.trim(),
            lastName: studentData.lastName.trim(),
            gender: studentData.gender,
            dateOfBirth: this._convertDate(studentData.dateOfBirth),
            email: studentData.email.trim().toLowerCase(),
            parentEmail: studentData.parentEmail?.trim().toLowerCase() || null,
            fiscalCode: studentData.fiscalCode?.trim().toUpperCase() || null,
            schoolId: schoolId,
            specialNeeds: studentData.specialNeeds === true,
            status: studentData.classId ? 'active' : 'pending',
            needsClassAssignment: !studentData.classId,
            isActive: true,
            // Aggiunti campi per assegnazione classe
            classId: studentData.classId || null,
            section: studentData.section || null,
            year: studentData.year || null
        };
    }

    /**
     * Valida i dati preparati prima dell'inserimento
     * @private
     * @param {Object} data - Dati preparati dello studente
     * @returns {boolean} - true se valido, false altrimenti
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
     * Importa studenti con assegnazione opzionale alla classe
     * @param {Array} studentsData - Array di studenti da importare
     * @param {string} schoolId - ID della scuola
     * @returns {Object} - Risultati dell'importazione
     */
    async bulkImportWithClass(studentsData, schoolId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.debug('Starting bulk import with class assignment', { 
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

            // Ottieni le classi per ID
            let classes = [];
            if (studentsData.some(s => s.classId)) {
                const classIds = [...new Set(
                    studentsData.filter(s => s.classId).map(s => s.classId)
                )];
                
                classes = await Class.find(
                    { _id: { $in: classIds } },
                    null,
                    { session }
                );
                
                logger.debug('Found classes for assignment', {
                    requestedClasses: classIds.length,
                    foundClasses: classes.length
                });
            }

            // Prepara tutti i dati degli studenti
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
                    
                    // Prepara dati di base
                    const preparedData = this._prepareStudentData(student, schoolId);
                    
                    // Se c'è un ID classe, verifica che esista
                    if (student.classId) {
                        const classObj = classes.find(c => c._id.toString() === student.classId);
                        if (!classObj) {
                            results.errors.push({
                                row: index + 2,
                                message: 'Classe non trovata',
                                error: 'CLASS_NOT_FOUND',
                                data: {
                                    classId: student.classId,
                                    studentName: `${student.firstName} ${student.lastName}`
                                }
                            });
                            return null;
                        }
                        
                        // Assegna mainTeacher e teachers dalla classe
                        preparedData.mainTeacher = classObj.mainTeacher;
                        preparedData.teachers = classObj.teachers;
                    }
                    
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

            // Aggiorna le classi con i nuovi studenti
            for (const classObj of classes) {
                // Trova gli studenti inseriti per questa classe
                const studentsForClass = insertedStudents.filter(
                    s => s.classId && s.classId.toString() === classObj._id.toString()
                );
                
                if (studentsForClass.length > 0) {
                    // Aggiungi gli studenti alla classe
                    const newStudentRecords = studentsForClass.map(student => ({
                        studentId: student._id,
                        status: 'active',
                        joinedAt: new Date()
                    }));
                    
                    classObj.students.push(...newStudentRecords);
                    await classObj.save({ session });
                    
                    logger.debug(`Added ${studentsForClass.length} students to class ${classObj.year}${classObj.section}`);
                }
            }

            await session.commitTransaction();
            
            logger.info('Bulk import with class completed successfully', {
                imported: results.imported,
                failed: results.failed,
                errors: results.errors.length,
                duplicates: results.duplicates.length,
                timestamp: new Date().toISOString()
            });

            return results;

        } catch (error) {
            await session.abortTransaction();
            
            logger.error('Error in bulk import with class:', { 
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

    /**
     * Esegue l'import massivo di studenti senza assegnazione classe
     * @param {Array} studentsData - Array di dati degli studenti da importare
     * @param {string} schoolId - ID della scuola
     * @returns {Object} Risultati dell'importazione
     * @throws {Error} In caso di errori durante l'importazione
     */
    async bulkImport(studentsData, schoolId) {
        return this.bulkImportWithClass(
            studentsData.map(student => ({
                ...student,
                classId: null,
                year: null,
                section: null
            })),
            schoolId
        );
    }
}

// Esporta la classe invece dell'istanza
module.exports = StudentBulkImportRepository;