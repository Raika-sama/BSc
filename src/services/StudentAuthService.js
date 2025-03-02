// src/services/StudentAuthService.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class StudentAuthService {
    constructor(studentAuthRepository, studentRepository, emailService, sessionService) {
        this.studentAuthRepository = studentAuthRepository;
        this.studentRepository = studentRepository;
        this.emailService = emailService;
        this.sessionService = sessionService;
        
        // Configurazioni
        this.SALT_ROUNDS = 10;
        this.JWT_SECRET = config.jwt.secret;
        this.JWT_EXPIRES_IN = '24h'; // Token più lunghi per gli studenti
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCK_TIME = 30 * 60 * 1000; // 30 minuti
        this.TEMP_PASSWORD_EXPIRES = 24 * 60 * 60 * 1000; // 24 ore
    }

/**
 * Genera credenziali per uno studente
 * @param {string} studentId - ID dello studente
 * @returns {Object} Credenziali generate
 */
async generateCredentials(studentId) {
    try {
        logger.debug('Generating credentials for student:', { studentId });

        const student = await this.studentRepository.findById(studentId);
        if (!student) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Studente non trovato'
            );
        }

        // Genera una password temporanea
        const tempPassword = Math.random().toString(36).slice(-8);
        
        // Verifica se esiste già un record di autenticazione
        let authRecord = await this.studentAuthRepository.findByStudentId(studentId);
        
        if (authRecord) {
            // Se esiste, aggiorna la password
            logger.debug('Updating existing auth record', { studentId });
            authRecord = await this.studentAuthRepository.updatePassword(
                studentId,
                tempPassword
            );
        } else {
            // Se non esiste, crea un nuovo record
            logger.debug('Creating new auth record', { studentId });
            authRecord = await this.studentAuthRepository.create({
                studentId,
                username: student.email,
                password: tempPassword,
                isFirstAccess: true,
                isActive: true,
                temporaryPasswordExpires: new Date(Date.now() + this.TEMP_PASSWORD_EXPIRES)
            });
        }

        // Aggiorna lo stato dello studente
        await this.studentRepository.update(studentId, {
            hasCredentials: true,
            credentialsSentAt: new Date()
        });

        logger.info('Credentials generated successfully', { 
            studentId,
            hasAuth: !!authRecord
        });

        return {
            username: student.email,
            temporaryPassword: tempPassword
        };
    } catch (error) {
        // Logghiamo solo le informazioni necessarie dell'errore
        logger.error('Error generating credentials:', {
            message: error.message,
            studentId,
            code: error.code,
            type: error.constructor.name
        });
        throw error;
    }
}


    async resetPassword(studentId) {
        try {
            logger.debug('Reset password request received', { studentId });

            const student = await this.studentRepository.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Studente non trovato'
                );
            }
    
            // Generate new temporary password
            const temporaryPassword = Math.random().toString(36).slice(-8);
            
            logger.debug('Generated temporary password', { 
                studentId,
                hasTemporaryPassword: !!temporaryPassword 
            });

            // Update the auth record with the plain text password
            // It will be hashed by the repository layer
            const updatedAuth = await this.studentAuthRepository.updatePassword(
                studentId, 
                temporaryPassword
            );

            if (!updatedAuth) {
                throw createError(
                    ErrorTypes.SYSTEM.OPERATION_FAILED,
                    'Errore nell\'aggiornamento della password'
                );
            }

            logger.info('Password reset successful', { 
                studentId,
                username: student.email 
            });

            // Return credentials in the expected format
            return {
                username: student.email,
                temporaryPassword: temporaryPassword  // Return the plain text password
            };
        } catch (error) {
            logger.error('Error in resetPassword service:', {
                error,
                studentId
            });
            throw error;
        }
    }

    /**
     * Genera e invia credenziali per una lista di studenti
     * @param {Array<string>} studentIds - Lista di ID studenti
     * @returns {Object} Report risultati operazione
     */
    async generateBatchCredentials(studentIds) {
        const results = {
            success: [],
            failed: []
        };

        for (const studentId of studentIds) {
            try {
                const credentials = await this.generateCredentials(studentId);
                
                // Invia email con credenziali
                await this.emailService.sendCredentials(
                    credentials.username,
                    credentials.temporaryPassword
                );

                results.success.push({
                    studentId,
                    username: credentials.username
                });
            } catch (error) {
                results.failed.push({
                    studentId,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Genera e invia credenziali per tutti gli studenti di una classe
     * @param {string} classId - ID della classe
     * @returns {Object} Report risultati operazione
     */
    async generateCredentialsForClass(classId) {
        try {
            // Recupera tutti gli studenti della classe
            const students = await this.studentRepository.findByClass(classId);
            
            // Filtra solo studenti senza credenziali
            const studentsWithoutCredentials = students.filter(s => !s.hasCredentials);
            
            // Genera credenziali in batch
            return this.generateBatchCredentials(
                studentsWithoutCredentials.map(s => s._id)
            );
        } catch (error) {
            logger.error('Error generating class credentials', { error, classId });
            throw error;
        }
    }

    /**
     * Login studente
     * @param {string} username - Username (email)
     * @param {string} password - Password
     * @param {Object} metadata - Info dispositivo
     */
    async login(username, password, metadata) {
        try {
            // Recupera auth record
            const studentAuth = await this.studentAuthRepository.findByUsername(username);
            entAuth = await this.studentAuthRepository.findByUsername(username);
            if (!studentAuth) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Verifica blocco account
            if (studentAuth.isLocked()) {
                throw createError(
                    ErrorTypes.AUTH.ACCOUNT_LOCKED,
                    'Account temporaneamente bloccato'
                );
            }

            if (studentAuth.isFirstAccess) {
                return {
                    isFirstAccess: true,
                    studentId: studentAuth.studentId,
                    message: 'Richiesto cambio password'
                };
            }

            // Verifica password
            const isValid = await studentAuth.comparePassword(password);
            if (!isValid) {
                await this.handleFailedLogin(studentAuth);
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Recupera dati studente
            const student = await this.studentRepository.findById(studentAuth.studentId);

            // Genera token
            const token = this.generateToken(student, studentAuth);

            // Aggiorna sessione
            await this.updateSession(studentAuth, metadata);

            logger.info('Student logged in successfully', {
                studentId: student._id,
                username
            });

            return {
                token,
                student: this.sanitizeStudent(student),
                isFirstAccess: studentAuth.isFirstAccess
            };
        } catch (error) {
            logger.error('Login error', { error });
            throw error;
        }
    }

    /**
     * Gestisce il cambio password al primo accesso
     * @param {string} studentId - ID studente
     * @param {string} temporaryPassword - Password temporanea
     * @param {string} newPassword - Nuova password
     */
    async handleFirstAccess(studentId, temporaryPassword, newPassword) {
        try {
            const studentAuth = await this.studentAuthRepository.findByStudentId(studentId);
            
            // Verifica password temporanea
            const isValid = await bcrypt.compare(temporaryPassword, studentAuth.password);
            if (!isValid) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Password temporanea non valida'
                );
            }
    
            // Aggiorna con nuova password e attiva l'account
            studentAuth.password = newPassword; // Verrà hashata dal model
            studentAuth.isFirstAccess = false;
            await studentAuth.save();
    
            // Genera il token di sessione
            const token = this.generateToken(studentAuth);
    
            return {
                token,
                student: await this.studentRepository.findById(studentId)
            };
        } catch (error) {
            logger.error('First access error', { error });
            throw error;
        }
    }

    /**
     * Gestisce i tentativi di login falliti
     * @private
     */
    async handleFailedLogin(studentAuth) {
        studentAuth.loginAttempts += 1;
        
        if (studentAuth.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
            studentAuth.lockUntil = Date.now() + this.LOCK_TIME;
            logger.warn('Student account locked', {
                studentId: studentAuth.studentId,
                attempts: studentAuth.loginAttempts
            });
        }
        
        await studentAuth.save();
    }

    /**
     * Genera token JWT per lo studente
     * @private
     */
    generateToken(student, studentAuth) {
        return jwt.sign(
            {
                id: student._id,
                type: 'student',
                username: studentAuth.username
            },
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN }
        );
    }

    /**
     * Aggiorna informazioni sessione
     * @private
     */
    async updateSession(studentAuth, metadata) {
        studentAuth.lastLogin = new Date();
        studentAuth.loginAttempts = 0;
        studentAuth.currentSession = {
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + ms(this.JWT_EXPIRES_IN)),
            deviceInfo: metadata
        };

        await studentAuth.save();
    }

    /**
     * Sanitizza oggetto studente per output
     * @private
     */
    sanitizeStudent(student) {
        const { email, ...safeData } = student.toObject();
        return safeData;
    }
}

module.exports = StudentAuthService;