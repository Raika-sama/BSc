// src/middleware/bulkImportValidation.js

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Validazione per l'import massivo degli studenti
 */
const bulkImportValidation = {
    /**
     * Valida la struttura base del file e i dati in esso contenuti
     */
    validateImportData: (students, schoolId) => {
        try {
            if (!Array.isArray(students) || students.length === 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Nessun dato valido trovato nel file'
                );
            }

            if (!schoolId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola richiesto'
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
            logger.error('Errore nella validazione del file di import:', error);
            throw error;
        }
    }
};

module.exports = bulkImportValidation;