// src/controllers/StudentAuthController.js
const BaseController = require('./baseController');
const StudentAuthService = require('../services/StudentAuthService');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Student = require('../models/Student'); // Aggiungi questa riga

/**
 * Controller che gestisce le operazioni di autenticazione degli studenti
 */
class StudentAuthController extends BaseController {
    /**
     * Effettua il login dello studente
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Username e password sono richiesti',
                    code: 'MISSING_CREDENTIALS'
                });
            }
            
            logger.info('Richiesta login studente', { username });
            
            const result = await StudentAuthService.authenticate(username, password);
            
            // Per il primo accesso, invia solo le informazioni necessarie per il cambio password
            if (result.isFirstAccess) {
                return this.sendResponse(res, {
                    status: 'success',
                    data: {
                        isFirstAccess: true,
                        studentId: result.studentId,
                        message: result.message
                    }
                });
            }
            
            // Imposta il cookie del token JWT
            const cookieOptions = {
                expires: new Date(Date.now() + config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            };
            
            res.cookie('student-token', result.token, cookieOptions);
            
            // Invia la risposta
            this.sendResponse(res, {
                status: 'success',
                data: {
                    student: result.student
                }
            });
        } catch (error) {
            logger.error('Errore durante il login dello studente', {
                error: error.message,
                stack: error.stack
            });
            
            next(error);
        }
    }
    
    /**
     * Gestisce il primo accesso e il cambio password dello studente
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async handleFirstAccess(req, res, next) {
        try {
            const { studentId } = req.params;
            const { temporaryPassword, newPassword } = req.body;
            
            if (!studentId || !temporaryPassword || !newPassword) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'StudentId, password temporanea e nuova password sono richiesti',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }
            
            logger.info('Richiesta primo accesso studente', { studentId });
            
            const result = await StudentAuthService.handleFirstAccess(studentId, temporaryPassword, newPassword);
            
            // Imposta il cookie del token JWT
            const cookieOptions = {
                expires: new Date(Date.now() + config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            };
            
            res.cookie('student-token', result.token, cookieOptions);
            
            // Invia la risposta
            this.sendResponse(res, {
                status: 'success',
                message: result.message,
                data: {
                    student: result.student
                }
            });
        } catch (error) {
            logger.error('Errore durante la gestione del primo accesso', {
                error: error.message,
                stack: error.stack
            });
            
            next(error);
        }
    }
    
    /**
     * Effettua il logout dello studente
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async logout(req, res) {
        try {
            logger.info('Richiesta logout studente');
            
            // Cancella il cookie del token JWT
            res.cookie('student-token', 'loggedout', {
                expires: new Date(Date.now() + 10 * 1000), // Scade tra 10 secondi
                httpOnly: true
            });
            
            this.sendResponse(res, {
                status: 'success',
                data: null
            });
        } catch (error) {
            logger.error('Errore durante il logout dello studente', {
                error: error.message,
                stack: error.stack
            });
            
            this.sendError(res, {
                statusCode: 500,
                message: 'Errore durante il logout',
                code: 'LOGOUT_ERROR'
            });
        }
    }
    
    /**
     * Recupera il profilo dello studente autenticato
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async getProfile(req, res, next) {
        try {
            // Check authorization token from multiple sources
            const token = req.cookies['student-token'] || 
                         (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                          ? req.headers.authorization.split(' ')[1] 
                          : null);

            if (!token) {
                return this.sendError(res, {
                    statusCode: 401,
                    message: 'Non autenticato - token mancante',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // Verifica il token JWT
            let decoded;
            try {
                decoded = jwt.verify(token, config.jwt.secret);
            } catch (err) {
                return this.sendError(res, {
                    statusCode: 401,
                    message: 'Sessione scaduta o token non valido',
                    code: 'INVALID_TOKEN'
                });
            }

            // Get studentId from token or request student
            const studentId = decoded.id || req.student?.id || req.params.studentId;
            
            if (!studentId) {
                return this.sendError(res, {
                    statusCode: 401,
                    message: 'ID studente non disponibile',
                    code: 'STUDENT_ID_MISSING'
                });
            }
                
            logger.info('Richiesta profilo studente', { studentId });
                
            const profileData = await StudentAuthService.getStudentProfile(studentId);
                
            this.sendResponse(res, {
                status: 'success',
                data: profileData
            });
        } catch (error) {
            logger.error('Errore durante il recupero del profilo studente', {
                error: error.message,
                stack: error.stack
            });
                
            next(error);
        }
    }

    /**
     * Genera le credenziali per uno studente
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async generateCredentials(req, res, next) {
        try {
            const { studentId } = req.params;
    
            if (!studentId) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'StudentId è richiesto',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }
    
            logger.info('Richiesta generazione credenziali studente', { studentId });
    
            // Generiamo le credenziali
            const credentials = await StudentAuthService.generateCredentials(studentId);
    
            // Aggiorniamo i metadati dello studente separatamente, ma solo i campi necessari
            try {
                // Usiamo findByIdAndUpdate che è più sicuro e non attiva validazioni complesse
                await Student.findByIdAndUpdate(
                    studentId,
                    { 
                        $set: { 
                            hasCredentials: true,
                            credentialsSentAt: new Date()
                        } 
                    },
                    { 
                        new: true,
                        runValidators: false // Importante: disabilitiamo i validatori qui
                    }
                );
            } catch (updateError) {
                // Log dell'errore, ma non facciamo fallire l'intera operazione
                logger.warn('Errore nell\'aggiornamento dei metadati dello studente', {
                    studentId,
                    error: updateError.message
                });
                // Non propaghiamo questo errore perché le credenziali sono state generate con successo
            }
    
            this.sendResponse(res, {
                status: 'success',
                data: {
                    credentials: {
                        username: credentials.username,
                        temporaryPassword: credentials.temporaryPassword
                    }
                }
            });
        } catch (error) {
            logger.error('Errore durante la generazione delle credenziali', {
                error: error.message,
                stack: error.stack
            });
    
            next(error);
        }
    }
    
    async resetPassword(req, res, next) {
        try {
            const { studentId } = req.params;
            let { newPassword } = req.body;
    
            if (!studentId) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'StudentId è richiesto',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }
    
            // Se non viene fornita una nuova password, effettuiamo una generazione di credenziali completa
            if (!newPassword) {
                logger.info('Nessuna password fornita, reindirizzando a generateCredentials');
                // Invece di chiamare il servizio direttamente, chiamiamo il metodo generateCredentials
                // di questo stesso controller
                return this.generateCredentials(req, res, next);
            }
    
            logger.info('Richiesta reset password studente', { studentId });
    
            const result = await StudentAuthService.resetPassword(studentId, newPassword);
    
            this.sendResponse(res, {
                status: 'success',
                data: {
                    username: result.username || "",
                    temporaryPassword: result.temporaryPassword || ""
                }
            });
        } catch (error) {
            logger.error('Errore durante il reset della password', {
                error: error.message,
                stack: error.stack
            });
    
            next(error);
        }
    }

    /**
     * Genera credenziali batch per studenti
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async generateBatchCredentials(req, res, next) {
        try {
            const { students } = req.body;

            if (!students || !Array.isArray(students)) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Lista di studenti è richiesta',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            logger.info('Richiesta generazione credenziali batch', { count: students.length });

            const result = await StudentAuthService.generateBatchCredentials(students);

            this.sendResponse(res, {
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Errore durante la generazione delle credenziali batch', {
                error: error.message,
                stack: error.stack
            });

            next(error);
        }
    }

    /**
     * Genera credenziali per una classe di studenti
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async generateClassCredentials(req, res, next) {
        try {
            const { classId } = req.params;

            if (!classId) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'ClassId è richiesto',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            logger.info('Richiesta generazione credenziali per classe', { classId });

            const result = await StudentAuthService.generateClassCredentials(classId);

            this.sendResponse(res, {
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Errore durante la generazione delle credenziali per classe', {
                error: error.message,
                stack: error.stack
            });

            next(error);
        }
    }

    /**
     * Resetta la password di uno studente
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Next middleware function
     */
    async resetPassword(req, res, next) {
        try {
            const { studentId } = req.params;
            let { newPassword } = req.body;
    
            if (!studentId) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'StudentId è richiesto',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }
    
            // Se non viene fornita una nuova password, effettuiamo una generazione di credenziali completa
            if (!newPassword) {
                logger.info('Nessuna password fornita, reindirizzando a generateCredentials');
                // Invece di chiamare il servizio direttamente, chiamiamo il metodo generateCredentials
                // di questo stesso controller
                return this.generateCredentials(req, res, next);
            }
    
            logger.info('Richiesta reset password studente', { studentId });
    
            const result = await StudentAuthService.resetPassword(studentId, newPassword);
    
            this.sendResponse(res, {
                status: 'success',
                data: result
            });
        } catch (error) {
            logger.error('Errore durante il reset della password', {
                error: error.message,
                stack: error.stack
            });
    
            next(error);
        }
    }
}

module.exports = new StudentAuthController();