// src/services/StudentAuthService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const Student = require('../models/Student');
const StudentAuth = require('../models/StudentAuth');

/**
 * Servizio che gestisce l'autenticazione degli studenti e le operazioni correlate
 */
class StudentAuthService {
    /**
     * Autentica uno studente e restituisce un token JWT
     * @param {string} username - Username dello studente
     * @param {string} password - Password dello studente
     * @returns {Object} Token JWT e dati dello studente
     */
    async authenticate(username, password) {
        try {
            logger.info('Tentativo di autenticazione studente', { username });

            // Cerca le credenziali di autenticazione
            const studentAuth = await StudentAuth.findOne({ username })
                .select('+password +isFirstAccess +temporaryPassword');

            if (!studentAuth) {
                logger.warn('Autenticazione fallita: username non trovato', { username });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Se è il primo accesso e viene usata la password temporanea
            if (studentAuth.isFirstAccess) {
                logger.info('Primo accesso rilevato', { username, studentId: studentAuth.studentId });
                
                // Verifica se la password fornita corrisponde alla password temporanea
                const isMatch = await bcrypt.compare(password, studentAuth.temporaryPassword);
                
                if (!isMatch) {
                    logger.warn('Password temporanea non valida al primo accesso', { username });
                    throw createError(
                        ErrorTypes.AUTH.INVALID_CREDENTIALS,
                        'Password temporanea non valida'
                    );
                }
                
                // Restituisci le info per il primo accesso
                return {
                    isFirstAccess: true,
                    studentId: studentAuth.studentId.toString(),
                    message: 'Password temporanea corretta. Richiesto cambio password.'
                };
            }

            // Verifica la password per accessi normali
            const isMatch = await bcrypt.compare(password, studentAuth.password);
            
            if (!isMatch) {
                logger.warn('Autenticazione fallita: password non valida', { username });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Recupera informazioni complete dello studente
            const student = await Student.findById(studentAuth.studentId)
                .select('-__v')
                .populate('schoolId', 'name code city address type')
                .populate('classId', 'name section year');

            if (!student) {
                logger.error('Account studente trovato, ma dati studente mancanti', { 
                    username, 
                    studentAuthId: studentAuth._id
                });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Dati studente non trovati'
                );
            }

            // Genera il token JWT
            const token = jwt.sign(
                { id: student._id, role: 'student' },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            // Registra l'ultimo accesso
            studentAuth.lastLogin = new Date();
            await studentAuth.save();

            logger.info('Studente autenticato con successo', { 
                username,
                studentId: student._id
            });

            // Restituisci il token e i dati dello studente
            return {
                token,
                student: {
                    ...student.toJSON(),
                    username: studentAuth.username, // Aggiungi username ai dati dello studente
                    lastLogin: studentAuth.lastLogin
                }
            };
        } catch (error) {
            logger.error('Errore durante l\'autenticazione dello studente', {
                username,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Gestisce il primo accesso e cambio password per uno studente
     * @param {string} studentId - ID dello studente
     * @param {string} temporaryPassword - Password temporanea
     * @param {string} newPassword - Nuova password
     * @returns {Object} Risultato dell'operazione e token JWT
     */
    async handleFirstAccess(studentId, temporaryPassword, newPassword) {
        try {
            logger.info('Gestione primo accesso studente', { studentId });

            // Verifica che la password temporanea sia corretta
            const studentAuth = await StudentAuth.findOne({ studentId })
                .select('+temporaryPassword +isFirstAccess');

            if (!studentAuth) {
                logger.warn('Primo accesso fallito: account non trovato', { studentId });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Account studente non trovato'
                );
            }

            if (!studentAuth.isFirstAccess) {
                logger.warn('Richiesta primo accesso per account già attivato', { studentId });
                throw createError(
                    ErrorTypes.AUTH.BAD_REQUEST,
                    'L\'account è già stato attivato'
                );
            }

            // Verifica la password temporanea
            const isMatch = await bcrypt.compare(temporaryPassword, studentAuth.temporaryPassword);
            if (!isMatch) {
                logger.warn('Password temporanea non valida', { studentId });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Password temporanea non valida'
                );
            }

            // Validazione della nuova password
            if (!newPassword || newPassword.length < 8) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'La nuova password deve essere di almeno 8 caratteri'
                );
            }

            // Aggiorna la password e imposta isFirstAccess a false
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            studentAuth.password = hashedPassword;
            studentAuth.isFirstAccess = false;
            studentAuth.temporaryPassword = undefined; // Rimuovi la password temporanea
            studentAuth.lastLogin = new Date();
            
            await studentAuth.save();

            // Recupera informazioni complete dello studente
            const student = await Student.findById(studentId)
                .select('-__v')
                .populate('schoolId', 'name code city address type')
                .populate('classId', 'name section year');

            if (!student) {
                logger.error('Account studente trovato, ma dati studente mancanti', { 
                    studentId, 
                    studentAuthId: studentAuth._id
                });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Dati studente non trovati'
                );
            }

            // Genera il token JWT
            const token = jwt.sign(
                { id: student._id, role: 'student' },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            logger.info('Primo accesso completato con successo', { studentId });

            // Restituisci il token e i dati dello studente
            return {
                token,
                message: 'Password aggiornata con successo',
                student: {
                    ...student.toJSON(),
                    username: studentAuth.username,
                    lastLogin: studentAuth.lastLogin
                }
            };
        } catch (error) {
            logger.error('Errore durante la gestione del primo accesso', {
                studentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Recupera il profilo completo di uno studente con tutti i dati collegati
     * @param {string} studentId - ID dello studente
     * @returns {Object} Dati completi dello studente
     */
    async getStudentProfile(studentId) {
        try {
            logger.info('Recupero profilo studente', { studentId });

            // Recupera lo studente con tutte le relazioni
            const student = await Student.findById(studentId)
                .select('-__v')
                .populate('schoolId', 'name code city address type schoolType')
                .populate('classId', 'name section year academicYear')
                .lean();

            if (!student) {
                logger.warn('Profilo studente non trovato', { studentId });
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // Recupera anche i dati di autenticazione (senza password)
            const studentAuth = await StudentAuth.findOne({ studentId })
                .select('username lastLogin createdAt')
                .lean();

            // Combina i dati
            const profileData = {
                ...student,
                username: studentAuth?.username,
                lastLogin: studentAuth?.lastLogin,
                accountCreatedAt: studentAuth?.createdAt
            };

            logger.info('Profilo studente recuperato con successo', { studentId });

            return {
                student: profileData,
                class: student.classId,
                school: student.schoolId
            };
        } catch (error) {
            logger.error('Errore durante il recupero del profilo studente', {
                studentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new StudentAuthService();