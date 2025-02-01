// src/middleware/bulkImportValidation.js
/**
 * @file bulkImportValidation.js
 * @description Middleware di validazione per l'import massivo degli studenti
 * @author Raika-sama
 * @date 2025-02-01 10:34:55
 */

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class BulkImportValidation {
    constructor() {
        logger.debug('BulkImportValidation middleware initialized');
    }

    /**
     * Valida la struttura base del file e i dati in esso contenuti
     * @param {Array} students - Array di studenti da validare
     * @param {string} schoolId - ID della scuola
     * @returns {boolean} - true se la validazione passa
     * @throws {Error} - Se ci sono errori di validazione
     */
    validateImportData(students, schoolId) {
        try {
            if (!Array.isArray(students) || students.length === 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Nessun dato valido trovato nel file'
                );
            }
            const errors = [];
            const emailSet = new Set(); // Per controllare email duplicate nel batch

            students.forEach((student, index) => {
                const rowErrors = [];
                const rowNum = index + 2; // +2 perché Excel parte da 1 e c'è l'header

                // Validazione campi obbligatori
                if (!student.firstName?.trim()) rowErrors.push('Nome richiesto');
                if (!student.lastName?.trim()) rowErrors.push('Cognome richiesto');
                if (!student.gender || !['M', 'F'].includes(student.gender)) {
                    rowErrors.push('Gender deve essere M o F');
                }

                // Validazione email
                if (!student.email?.trim()) {
                    rowErrors.push('Email richiesta');
                } else {
                    const email = student.email.trim().toLowerCase();
                    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                        rowErrors.push('Formato email non valido');
                    } else if (emailSet.has(email)) {
                        rowErrors.push('Email duplicata nel file');
                    } else {
                        emailSet.add(email);
                    }
                }

                // Validazione data di nascita
                if (!student.dateOfBirth) {
                    rowErrors.push('Data di nascita richiesta');
                } else {
                    // Validazione formato data italiano (DD/MM/YYYY)
                    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
                    if (!dateRegex.test(student.dateOfBirth)) {
                        rowErrors.push('Data di nascita deve essere nel formato DD/MM/YYYY');
                    } else {
                        // Verifica che la data sia valida
                        const [day, month, year] = student.dateOfBirth.split('/');
                        const date = new Date(year, month - 1, day);
                        if (date > new Date()) {
                            rowErrors.push('Data di nascita non può essere nel futuro');
                        }
                    }
                }

                // Validazione codice fiscale se presente
                if (student.fiscalCode?.trim()) {
                    if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(student.fiscalCode.trim())) {
                        rowErrors.push('Formato codice fiscale non valido');
                    }
                }

                // Validazione email genitore se presente
                if (student.parentEmail?.trim()) {
                    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(student.parentEmail.trim())) {
                        rowErrors.push('Formato email genitore non valido');
                    }
                }

                // Se ci sono errori per questa riga, li aggiungiamo all'array generale
                if (rowErrors.length > 0) {
                    errors.push({
                        row: rowNum,
                        errors: rowErrors,
                        data: student
                    });
                }
            });

            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errori di validazione nel file',
                    { details: errors }
                );
            }

            return true;
        } catch (error) {
            logger.error('Errore nella validazione del file di import:', {
                error: error.message,
                schoolId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Middleware Express per la validazione del file di import
     */
    validateImport(req, res, next) {
        try {
            const { students, schoolId } = req.body;
            this.validateImportData(students, schoolId);
            next();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BulkImportValidation;