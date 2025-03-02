// src/controllers/StudentAuthController.js
const BaseController = require('./baseController');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class StudentAuthController extends BaseController {
    constructor(studentAuthService, studentService) {
        super();
        this.studentAuthService = studentAuthService;
        this.studentService = studentService;
    }

    /**
     * Genera e invia credenziali per uno studente
     */
    generateCredentials = async (req, res) => {
        try {
            const { studentId } = req.params;
            const result = await this.studentAuthService.generateCredentials(studentId);
            
            // Modifica il formato della risposta per allinearlo alle aspettative del frontend
            return res.status(200).json({
                status: 'success',
                data: {
                    credentials: {
                        username: result.username,
                        temporaryPassword: result.temporaryPassword
                    }
                }
            });
        } catch (error) {
            logger.error('Error generating credentials:', error);
            return this.sendError(res, error);
        }
    };

    /**
     * Genera e invia credenziali per una lista di studenti
     */
    generateBatchCredentials = async (req, res) => {
        try {
            const { studentIds } = req.body;
            
            if (!Array.isArray(studentIds) || studentIds.length === 0) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_DATA,
                    'Lista studenti non valida'
                );
            }

            logger.debug('Generating batch credentials', { 
                studentCount: studentIds.length,
                requestedBy: req.user.id 
            });

            const results = await this.studentAuthService.generateBatchCredentials(studentIds);

            logger.info('Batch credentials generation completed', {
                success: results.success.length,
                failed: results.failed.length
            });

            return this.sendResponse(res, {
                status: 'success',
                data: results
            });
        } catch (error) {
            logger.error('Error in batch credentials generation', { error });
            return this.sendError(res, error);
        }
    };

    /**
     * Genera e invia credenziali per tutti gli studenti di una classe
     */
    generateClassCredentials = async (req, res) => {
        try {
            const { classId } = req.params;

            logger.debug('Generating credentials for class', { 
                classId,
                requestedBy: req.user.id 
            });

            const results = await this.studentAuthService.generateCredentialsForClass(classId);

            logger.info('Class credentials generation completed', {
                classId,
                success: results.success.length,
                failed: results.failed.length
            });

            return this.sendResponse(res, {
                status: 'success',
                data: results
            });
        } catch (error) {
            logger.error('Error generating class credentials', { error });
            return this.sendError(res, error);
        }
    };

    /**
     * Login studente
     */
    login = async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Username e password richiesti'
                );
            }

            logger.debug('Student login attempt', { username });

            const result = await this.studentAuthService.login(
                username, 
                password,
                {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            );

            // Se è il primo accesso, restituisci flag specifico
            if (result.isFirstAccess) {
                return this.sendResponse(res, {
                    status: 'success',
                    data: {
                        isFirstAccess: true,
                        message: 'Cambio password richiesto'
                    }
                });
            }

            // Imposta il cookie del token
            res.cookie('student-token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 ore
            });

            logger.info('Student logged in successfully', { 
                studentId: result.student._id 
            });

            return this.sendResponse(res, {
                status: 'success',
                data: {
                    student: result.student
                }
            });
        } catch (error) {
            logger.error('Student login error', { error });
            return this.sendError(res, error);
        }
    };

    /**
     * Gestisce il primo accesso e cambio password
     */
    handleFirstAccess = async (req, res) => {
        try {
            const { temporaryPassword, newPassword } = req.body;
            const studentId = req.params.studentId;

            if (!temporaryPassword || !newPassword) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Password temporanea e nuova password richieste'
                );
            }

            logger.debug('Processing first access', { studentId });

            await this.studentAuthService.handleFirstAccess(
                studentId,
                temporaryPassword,
                newPassword
            );

            logger.info('First access completed successfully', { studentId });

            return this.sendResponse(res, {
                status: 'success',
                message: 'Password aggiornata con successo. Effettua il login con la nuova password.'
            });
        } catch (error) {
            logger.error('First access error', { error });
            return this.sendError(res, error);
        }
    };

    /**
     * Logout studente
     */
    logout = async (req, res) => {
        try {
            // Rimuovi il cookie del token
            res.clearCookie('student-token');

            // Invalida la sessione se necessario
            if (req.student) {
                await this.studentAuthService.invalidateSession(req.student.id);
            }

            logger.info('Student logged out', {
                studentId: req.student?.id
            });

            return this.sendResponse(res, {
                status: 'success',
                message: 'Logout effettuato con successo'
            });
        } catch (error) {
            logger.error('Logout error', { error });
            return this.sendError(res, error);
        }
    };

    /**
     * Reset password studente
     */
    // In StudentAuthController.js
    resetPassword = async (req, res) => {
        try {
            const { studentId } = req.params;
            
            logger.debug('Reset password controller request:', { 
                studentId,
                userId: req.user?.id 
            });
            
            const result = await this.studentAuthService.resetPassword(studentId);
            
            // Log dettagliato del risultato
            logger.debug('Reset password service result:', {
                result,
                hasUsername: !!result?.username,
                hasPassword: !!result?.temporaryPassword
            });
            
            if (!result?.username || !result?.temporaryPassword) {
                logger.error('Invalid service response:', { result });
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Risposta non valida dal servizio'
                );
            }
            
            // Struttura della risposta semplificata
            const response = {
                success: true,
                username: result.username,
                temporaryPassword: result.temporaryPassword
            };

            logger.debug('Sending response:', response);
            
            return res.status(200).json(response);
        } catch (error) {
            logger.error('Password reset controller error:', { 
                error, 
                studentId: req.params.studentId 
            });
            return this.sendError(res, error);
        }
    };
}

module.exports = StudentAuthController;