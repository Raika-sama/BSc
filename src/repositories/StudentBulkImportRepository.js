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
                { email: 1, firstName: 1, lastName: 1 },
                { session }
            );

            if (existingEmails.length > 0) {
                results.duplicates = existingEmails.map(doc => doc.email);
                logger.warn('Found duplicate emails in database', {
                    count: existingEmails.length,
                    emails: results.duplicates
                });
                
                // Aggiungi errori per tutte le email duplicate trovate
                studentsData.forEach((student, index) => {
                    if (results.duplicates.includes(student.email?.trim().toLowerCase())) {
                        results.errors.push({
                            row: index + 2, // +2 perché Excel parte da 1 e c'è l'header
                            message: 'Email già presente nel sistema',
                            error: 'DUPLICATE_EMAIL',
                            data: {
                                email: student.email,
                                firstName: student.firstName,
                                lastName: student.lastName
                            }
                        });
                    }
                });
                
                // Se tutte le email sono duplicate, restituisci subito il risultato
                if (results.duplicates.length === studentsData.length) {
                    logger.warn('All emails in import are duplicates, skipping import');
                    await session.abortTransaction();
                    session.endSession();
                    
                    return {
                        imported: 0,
                        failed: studentsData.length,
                        errors: results.errors,
                        duplicates: results.duplicates
                    };
                }
            }

            // Raccogli tutti gli ID delle classi dal file
            const classIds = [...new Set(
                studentsData
                    .filter(s => s.classId)
                    .map(s => s.classId)
            )];

            logger.debug('Class IDs found in import data:', { classIds });

            // Carica tutte le classi necessarie in una sola query
            let classesMap = new Map();
            if (classIds.length > 0) {
                const classes = await Class.find(
                    { _id: { $in: classIds }, schoolId: schoolId },
                    null,
                    { session }
                ).populate('mainTeacher teachers');

                classesMap = new Map(classes.map(c => [c._id.toString(), c]));
                
                logger.debug('Classes loaded:', {
                    requested: classIds.length,
                    found: classes.length,
                    classes: classes.map(c => ({
                        id: c._id,
                        year: c.year,
                        section: c.section
                    }))
                });
            }

            // Prepara tutti i dati degli studenti
            const preparedStudents = studentsData.map((student, index) => {
                try {
                    // Salta gli studenti con email duplicate
                    if (results.duplicates.includes(student.email?.trim().toLowerCase())) {
                        return null;
                    }

                    // Dati di base dello studente
                    const preparedData = {
                        firstName: student.firstName?.trim(),
                        lastName: student.lastName?.trim(),
                        email: student.email?.trim().toLowerCase(),
                        parentEmail: student.parentEmail?.trim().toLowerCase() || null,
                        fiscalCode: student.fiscalCode?.trim().toUpperCase() || null,
                        gender: student.gender,
                        dateOfBirth: student.dateOfBirth,
                        schoolId: schoolId,
                        specialNeeds: student.specialNeeds === true || student.specialNeeds === 'true' || student.specialNeeds === '1',
                        status: 'pending',
                        isActive: true
                    };

                    // Se c'è un ID classe, verifica che esista e aggiungi i dati relativi
                    if (student.classId) {
                        const classDoc = classesMap.get(student.classId.toString());
                        if (!classDoc) {
                            results.errors.push({
                                row: index + 2,
                                message: 'Classe non trovata o non valida',
                                error: 'CLASS_NOT_FOUND',
                                data: {
                                    classId: student.classId,
                                    studentName: `${student.firstName} ${student.lastName}`
                                }
                            });
                            return null;
                        }

                        preparedData.classId = classDoc._id;
                        preparedData.currentYear = classDoc.year;
                        preparedData.section = classDoc.section;
                        preparedData.status = 'active';
                        preparedData.needsClassAssignment = false;
                        preparedData.mainTeacher = classDoc.mainTeacher?._id;
                        preparedData.teachers = classDoc.teachers?.map(t => t._id) || [];
                        preparedData.lastClassChangeDate = new Date();
                    } else {
                        preparedData.needsClassAssignment = true;
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

            // Log dei dati preparati per debug
            logger.debug('Prepared students data:', {
                total: studentsData.length,
                prepared: preparedStudents.length,
                withClass: preparedStudents.filter(s => s.classId).length,
                sampleStudent: preparedStudents[0]
            });

            if (preparedStudents.length === 0) {
                // Invece di lanciare un errore, restituiamo un risultato con zero studenti importati
                logger.warn('No valid data to import after filtering duplicates and invalid entries');
                await session.abortTransaction();
                session.endSession();
                
                return {
                    imported: 0,
                    failed: studentsData.length,
                    errors: results.errors,
                    duplicates: results.duplicates
                };
            }

            // Esegui l'inserimento massivo
            const insertedStudents = await this.model.insertMany(preparedStudents, {
                session,
                ordered: false
            });

            // Aggiorna le classi con i nuovi studenti
            for (const [classId, classDoc] of classesMap) {
                const studentsForClass = insertedStudents.filter(
                    s => s.classId && s.classId.toString() === classId
                );

                if (studentsForClass.length > 0) {
                    classDoc.students.push(...studentsForClass.map(student => ({
                        studentId: student._id,
                        status: 'active',
                        joinedAt: new Date()
                    })));
                    await classDoc.save({ session });
                }
            }

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