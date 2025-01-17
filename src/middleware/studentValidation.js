// src/middleware/studentValidation.js

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Validazioni per le operazioni sugli studenti
 */
const studentValidation = {
    /**
     * Valida i dati per la creazione di uno studente
     */
    validateCreate: (req, res, next) => {
        try {
            const {
                firstName,
                lastName,
                gender,
                dateOfBirth,
                fiscalCode,
                email,
                schoolId,
                currentYear
            } = req.body;

            const errors = [];

            // Validazione campi obbligatori
            if (!firstName?.trim()) errors.push('Nome richiesto');
            if (!lastName?.trim()) errors.push('Cognome richiesto');
            if (!['M', 'F'].includes(gender)) errors.push('Genere non valido');
            if (!dateOfBirth) errors.push('Data di nascita richiesta');
            if (!email?.trim()) errors.push('Email richiesta');
            if (!schoolId) errors.push('Scuola richiesta');
            if (!currentYear) errors.push('Anno corrente richiesto');

            // Validazione formato email
            if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                errors.push('Formato email non valido');
            }

            // Validazione codice fiscale
            if (fiscalCode?.trim() && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(fiscalCode)) {
                errors.push('Formato codice fiscale non valido');
            }

            // Validazione data di nascita
            const birthDate = new Date(dateOfBirth);
            const now = new Date();
            if (birthDate > now) {
                errors.push('Data di nascita non valida');
            }

            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errori di validazione',
                    { details: errors }
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Valida i dati per l'aggiornamento di uno studente
     */
    validateUpdate: (req, res, next) => {
        try {
            const {
                email,
                fiscalCode,
                currentYear,
                gender
            } = req.body;

            const errors = [];

            // Validazione formato email se presente
            if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                errors.push('Formato email non valido');
            }

            // Validazione codice fiscale se presente
            if (fiscalCode && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(fiscalCode)) {
                errors.push('Formato codice fiscale non valido');
            }

            // Validazione genere se presente
            if (gender && !['M', 'F'].includes(gender)) {
                errors.push('Genere non valido');
            }

            // Validazione anno corrente se presente
            if (currentYear && (currentYear < 1 || currentYear > 5)) {
                errors.push('Anno corrente non valido');
            }

            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errori di validazione',
                    { details: errors }
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Valida i dati per l'assegnazione a una classe
     */
    validateClassAssignment: (req, res, next) => {
        try {
            const { classId } = req.body;

            if (!classId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID classe richiesto'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Valida i parametri di ricerca
     */
    validateSearch: (req, res, next) => {
        try {
            const { query } = req.query;

            if (!query?.trim()) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Parametro di ricerca richiesto'
                );
            }

            if (query.length < 2) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Il termine di ricerca deve contenere almeno 2 caratteri'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    },

    validateBatchAssignment: (req, res, next) => {
        try {
            const { studentIds, classId, academicYear } = req.body;
    
            const errors = [];
    
            if (!Array.isArray(studentIds) || studentIds.length === 0) {
                errors.push('Lista studenti richiesta');
            }
    
            if (!classId?.trim()) {
                errors.push('ID classe richiesto');
            }
    
            if (!academicYear?.trim()) {
                errors.push('Anno accademico richiesto');
            } else if (!/^\d{4}\/\d{4}$/.test(academicYear)) {
                errors.push('Formato anno accademico non valido (YYYY/YYYY)');
            }
    
            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errori di validazione',
                    { details: errors }
                );
            }
    
            next();
        } catch (error) {
            next(error);
        }
    }
    
};

module.exports = studentValidation;