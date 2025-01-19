// src/middleware/studentValidation.js

const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

/**
 * Validazioni per le operazioni sugli studenti
 */
const studentValidation = {
    validateCreate: (req, res, next) => {
        try {
            const {
                firstName,
                lastName,
                gender,
                dateOfBirth,
                fiscalCode,
                email,
                parentEmail,
                schoolId,
                mainTeacher,
                teachers,
                status,
                needsClassAssignment,
                isActive,
                specialNeeds
            } = req.body;

            const errors = [];

            // Validazione campi obbligatori base
            if (!firstName?.trim()) errors.push('Nome richiesto');
            if (!lastName?.trim()) errors.push('Cognome richiesto');
            if (!['M', 'F'].includes(gender)) errors.push('Genere non valido');
            if (!dateOfBirth) errors.push('Data di nascita richiesta');
            if (!email?.trim()) errors.push('Email richiesta');
            if (!schoolId) errors.push('Scuola richiesta');

            // Validazione formato email principale
            if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                errors.push('Formato email non valido');
            }

            // Validazione email genitore se presente
            if (parentEmail?.trim() && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(parentEmail)) {
                errors.push('Formato email genitore non valido');
            }

            // Validazione codice fiscale se presente
            if (fiscalCode?.trim() && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(fiscalCode)) {
                errors.push('Formato codice fiscale non valido');
            }

            // Validazione data di nascita
            const birthDate = new Date(dateOfBirth);
            const now = new Date();
            if (birthDate > now) {
                errors.push('Data di nascita non valida');
            }

            // Validazione mainTeacher se presente
            if (mainTeacher && !mongoose.Types.ObjectId.isValid(mainTeacher)) {
                errors.push('ID docente principale non valido');
            }

            // Validazione array teachers se presente
            if (teachers) {
                if (!Array.isArray(teachers)) {
                    errors.push('Il campo teachers deve essere un array');
                } else {
                    const invalidTeachers = teachers.filter(id => !mongoose.Types.ObjectId.isValid(id));
                    if (invalidTeachers.length > 0) {
                        errors.push('ID docenti non validi');
                    }
                }
            }

            // Validazione status se presente
            if (status && !['pending', 'active', 'inactive', 'transferred', 'graduated'].includes(status)) {
                errors.push('Stato non valido');
            }

            // Validazione campi booleani
            if (needsClassAssignment !== undefined && typeof needsClassAssignment !== 'boolean') {
                errors.push('Il campo needsClassAssignment deve essere un booleano');
            }
            if (isActive !== undefined && typeof isActive !== 'boolean') {
                errors.push('Il campo isActive deve essere un booleano');
            }
            if (specialNeeds !== undefined && typeof specialNeeds !== 'boolean') {
                errors.push('Il campo specialNeeds deve essere un booleano');
            }

            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errori di validazione',
                    { details: errors }
                );
            }

            // Log dei dati validati
            logger.debug('Validated student data:', {
                ...req.body,
                email: '***' // Nascondi email per privacy nei log
            });

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
                parentEmail,
                fiscalCode,
                gender,
                mainTeacher,
                teachers,
                status,
                needsClassAssignment,
                isActive,
                specialNeeds
            } = req.body;

            const errors = [];

            // Validazioni come in validateCreate ma solo per i campi presenti
            if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                errors.push('Formato email non valido');
            }

            if (parentEmail?.trim() && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(parentEmail)) {
                errors.push('Formato email genitore non valido');
            }

            if (fiscalCode && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(fiscalCode)) {
                errors.push('Formato codice fiscale non valido');
            }

            if (gender && !['M', 'F'].includes(gender)) {
                errors.push('Genere non valido');
            }

            

            if (mainTeacher && !mongoose.Types.ObjectId.isValid(mainTeacher)) {
                errors.push('ID docente principale non valido');
            }

            if (teachers !== undefined) {
                if (!Array.isArray(teachers)) {
                    errors.push('Il campo teachers deve essere un array');
                } else {
                    const invalidTeachers = teachers.filter(id => !mongoose.Types.ObjectId.isValid(id));
                    if (invalidTeachers.length > 0) {
                        errors.push('ID docenti non validi');
                    }
                }
            }

            if (status && !['pending', 'active', 'inactive', 'transferred', 'graduated'].includes(status)) {
                errors.push('Stato non valido');
            }

            if (needsClassAssignment !== undefined && typeof needsClassAssignment !== 'boolean') {
                errors.push('Il campo needsClassAssignment deve essere un booleano');
            }

            if (isActive !== undefined && typeof isActive !== 'boolean') {
                errors.push('Il campo isActive deve essere un booleano');
            }

            if (specialNeeds !== undefined && typeof specialNeeds !== 'boolean') {
                errors.push('Il campo specialNeeds deve essere un booleano');
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