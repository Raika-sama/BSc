// src/services/StudentAuthService.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class StudentAuthService {
    constructor(studentAuthRepository, studentRepository, sessionService) {
        this.studentAuthRepository = studentAuthRepository;
        this.studentRepository = studentRepository;
        this.sessionService = sessionService;
    }

    /**
     * Effettua il login dello studente
     * @param {string} username Email/username dello studente
     * @param {string} password Password dello studente
     * @param {Object} deviceInfo Informazioni sul dispositivo
     * @returns {Object} Dati utente e token
     */
    async login(username, password, deviceInfo = {}) {
        try {
            logger.debug('Tentativo di login studente', { username });
            
            // Verifica che username e password siano presenti
            if (!username || !password) {
                logger.debug('Login fallito: credenziali mancanti', { username });
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Username e password richiesti'
                );
            }

            // Trova il record di autenticazione
            const auth = await this.studentAuthRepository.findByUsername(username);
            
            if (!auth) {
                logger.debug('Login fallito: utente non trovato', { username });
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            logger.debug('Record autenticazione trovato', { 
                studentId: auth.studentId,
                isFirstAccess: auth.isFirstAccess,
                hasTemporaryPassword: !!auth.temporaryPassword
            });

            // Verifica se l'account è attivo
            if (!auth.isActive) {
                logger.debug('Login fallito: account non attivo', { username });
                throw createError(
                    ErrorTypes.AUTH.ACCOUNT_DISABLED,
                    'Account non attivo'
                );
            }

            // Verifica se l'account è bloccato
            if (auth.isLocked && auth.isLocked()) {
                logger.debug('Login fallito: account bloccato', { username });
                throw createError(
                    ErrorTypes.AUTH.ACCOUNT_LOCKED,
                    'Troppi tentativi di login. Account bloccato temporaneamente.'
                );
            }

            // Verifica la password
            let isPasswordCorrect;
            try {
                isPasswordCorrect = await auth.comparePassword(password);
                logger.debug('Verifica password', { 
                    isCorrect: isPasswordCorrect,
                    studentId: auth.studentId
                });
            } catch (error) {
                logger.error('Errore nella verifica password', {
                    error: error.message,
                    stack: error.stack
                });
                throw createError(
                    ErrorTypes.SYSTEM.INTERNAL_ERROR,
                    'Errore durante la verifica della password'
                );
            }

            if (!isPasswordCorrect) {
                // Incrementa il contatore di tentativi falliti
                logger.debug('Password errata', { username });
                await this._handleFailedLogin(auth);
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Credenziali non valide'
                );
            }

            // Se è il primo accesso, restituisci flag speciale
            if (auth.isFirstAccess) {
                logger.debug('Primo accesso rilevato', { username });
                return {
                    isFirstAccess: true,
                    studentId: auth.studentId
                };
            }

            // Carica i dati completi dello studente
            const student = await this.studentRepository.findById(auth.studentId);
            if (!student) {
                logger.error('Record studente mancante per auth record', {
                    authId: auth._id, 
                    studentId: auth.studentId
                });
                throw createError(
                    ErrorTypes.SYSTEM.ENTITY_NOT_FOUND,
                    'Dati studente non trovati'
                );
            }

            // Genera il token
            const token = this._generateToken(auth.studentId);

            // Aggiorna il record della sessione
            const sessionExpiry = new Date();
            sessionExpiry.setDate(sessionExpiry.getDate() + 1); // 24 ore

            await this.studentAuthRepository.updateSession(auth.studentId, {
                token,
                expiresAt: sessionExpiry,
                deviceInfo
            });

            logger.info('Login studente completato con successo', {
                studentId: student._id
            });

            return {
                student: {
                    _id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email
                },
                token
            };
        } catch (error) {
            logger.error('Login error', { error });
            if (!error.code) {
                // Se non è un errore gestito, crea un errore standard
                error = createError(
                    ErrorTypes.SYSTEM.INTERNAL_ERROR,
                    'Errore durante il login',
                    {
                        originalError: error.message,
                        stack: error.stack
                    }
                );
            }
            throw error;
        }
    }

    /**
     * Genera un token JWT
     * @private
     * @param {string} studentId ID dello studente
     * @returns {string} Token JWT
     */
    _generateToken(studentId) {
        try {
            return jwt.sign(
                { id: studentId, type: 'student' },
                config.jwt.secret,
                { expiresIn: '24h' }
            );
        } catch (error) {
            logger.error('Errore nella generazione del token', {
                error,
                studentId
            });
            throw createError(
                ErrorTypes.SYSTEM.INTERNAL_ERROR,
                'Errore nella generazione del token di accesso'
            );
        }
    }

    /**
     * Gestisce un tentativo di login fallito
     * @private
     * @param {Object} auth Record di autenticazione
     */
    async _handleFailedLogin(auth) {
        try {
            const maxAttempts = 5;
            const lockTime = 15 * 60 * 1000; // 15 minuti
            
            auth.loginAttempts = (auth.loginAttempts || 0) + 1;
            
            if (auth.loginAttempts >= maxAttempts) {
                await this.studentAuthRepository.lockAccount(auth.studentId, lockTime);
                logger.warn('Account bloccato per troppi tentativi', {
                    studentId: auth.studentId,
                    attempts: auth.loginAttempts
                });
            } else {
                await this.studentAuthRepository.model.updateOne(
                    { _id: auth._id },
                    { $inc: { loginAttempts: 1 } }
                );
                logger.debug('Incrementati tentativi di login falliti', {
                    studentId: auth.studentId,
                    attempts: auth.loginAttempts
                });
            }
        } catch (error) {
            logger.error('Errore durante la gestione del login fallito', {
                error,
                studentId: auth.studentId
            });
            // Non lanciare l'errore per non bloccare il flusso
        }
    }

    // ... altri metodi della classe ...

    /**
     * Verifica un token JWT
     * @param {string} token Token da verificare
     * @returns {Object} Payload decodificato
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Verifica che sia un token di studente
            if (!decoded.id || decoded.type !== 'student') {
                throw createError(
                    ErrorTypes.AUTH.INVALID_TOKEN,
                    'Token non valido'
                );
            }
            
            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_EXPIRED,
                    'Token scaduto'
                );
            } else if (error.name === 'JsonWebTokenError') {
                throw createError(
                    ErrorTypes.AUTH.INVALID_TOKEN,
                    'Token non valido'
                );
            }
            
            throw error;
        }
    }

    /**
     * Invalida la sessione corrente
     * @param {string} studentId ID dello studente
     */
    async invalidateSession(studentId) {
        try {
            await this.studentAuthRepository.invalidateSession(studentId);
        } catch (error) {
            logger.error('Errore durante l\'invalidazione della sessione', { error, studentId });
            throw createError(
                ErrorTypes.SYSTEM.OPERATION_FAILED,
                'Impossibile invalidare la sessione'
            );
        }
    }

    /**
     * Gestisce il primo accesso e cambio password
     * @param {string} studentId ID dello studente
     * @param {string} temporaryPassword Password temporanea
     * @param {string} newPassword Nuova password
     */
    async handleFirstAccess(studentId, temporaryPassword, newPassword) {
        try {
            logger.debug('Gestione primo accesso', { studentId });
            
            // Verifica che tutti i campi siano presenti
            if (!studentId || !temporaryPassword || !newPassword) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'Tutti i campi sono richiesti'
                );
            }
            
            // Trova il record di autenticazione
            const auth = await this.studentAuthRepository.findByStudentId(studentId);
            if (!auth) {
                throw createError(
                    ErrorTypes.SYSTEM.ENTITY_NOT_FOUND,
                    'Record di autenticazione non trovato'
                );
            }
            
            // Verifica che sia effettivamente il primo accesso
            if (!auth.isFirstAccess) {
                throw createError(
                    ErrorTypes.SYSTEM.INVALID_OPERATION,
                    'Non è il primo accesso'
                );
            }
            
            // Verifica la password temporanea
            const isPasswordCorrect = await auth.comparePassword(temporaryPassword);
            if (!isPasswordCorrect) {
                throw createError(
                    ErrorTypes.AUTH.INVALID_CREDENTIALS,
                    'Password temporanea non valida'
                );
            }
            
            // Aggiorna con la nuova password
            await this.studentAuthRepository.model.findOneAndUpdate(
                { _id: auth._id },
                {
                    $set: {
                        password: await bcrypt.hash(newPassword, 10),
                        isFirstAccess: false,
                        loginAttempts: 0,
                        lockUntil: null,
                        temporaryPassword: null,
                        temporaryPasswordExpires: null,
                        updatedAt: new Date()
                    }
                }
            );
            
            logger.info('Primo accesso completato con successo', { studentId });
            
            return { success: true };
        } catch (error) {
            logger.error('Errore durante il primo accesso', {
                error,
                studentId
            });
            throw error;
        }
    }

    /**
     * Reset password studente
     * @param {string} studentId ID dello studente
     * @returns {Object} Nuove credenziali
     */
    async resetPassword(studentId) {
        try {
            // Verifica studentId
            if (!studentId) {
                throw createError(
                    ErrorTypes.VALIDATION.MISSING_FIELDS,
                    'ID studente richiesto'
                );
            }

            // Verifica che lo studente esista
            const student = await this.studentRepository.findById(studentId);
            if (!student) {
                throw createError(
                    ErrorTypes.SYSTEM.ENTITY_NOT_FOUND,
                    'Studente non trovato'
                );
            }

            // Trova o crea il record di autenticazione
            let auth = await this.studentAuthRepository.findByStudentId(studentId);
            
            // Genera una nuova password temporanea
            const temporaryPassword = this._generateTemporaryPassword();
            
            if (auth) {
                // Aggiorna il record esistente
                auth = await this.studentAuthRepository.model.findOneAndUpdate(
                    { studentId },
                    {
                        $set: {
                            temporaryPassword: await bcrypt.hash(temporaryPassword, 10),
                            temporaryPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ore
                            isFirstAccess: true,
                            loginAttempts: 0,
                            lockUntil: null,
                            updatedAt: new Date()
                        }
                    },
                    { new: true }
                );
            } else {
                // Crea un nuovo record di autenticazione
                const username = student.email;
                auth = await this.studentAuthRepository.create({
                    studentId,
                    username,
                    password: await bcrypt.hash(temporaryPassword, 10),
                    temporaryPassword: await bcrypt.hash(temporaryPassword, 10),
                    temporaryPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    isFirstAccess: true
                });
            }

            // Aggiorna il flag hasCredentials nello studente
            await this.studentRepository.update(studentId, {
                hasCredentials: true,
                credentialsSentAt: new Date()
            });

            logger.info('Reset password completato', { studentId });

            return {
                username: student.email,
                temporaryPassword
            };
        } catch (error) {
            logger.error('Errore durante il reset della password', {
                error,
                studentId
            });
            throw error;
        }
    }

    /**
     * Genera credenziali per uno studente
     * @param {string} studentId ID dello studente
     */
    async generateCredentials(studentId) {
        try {
            // Utilizza resetPassword per generare credenziali
            return await this.resetPassword(studentId);
        } catch (error) {
            logger.error('Errore nella generazione credenziali', { error, studentId });
            throw error;
        }
    }

    /**
     * Genera credenziali per multiple studenti
     * @param {Array} studentIds Lista di ID studenti
     */
    async generateBatchCredentials(studentIds) {
        const results = {
            success: [],
            failed: []
        };

        for (const studentId of studentIds) {
            try {
                const credentials = await this.generateCredentials(studentId);
                results.success.push({ studentId, credentials });
            } catch (error) {
                results.failed.push({
                    studentId,
                    error: error.message || 'Errore sconosciuto'
                });
            }
        }

        return results;
    }

    /**
     * Genera credenziali per tutti gli studenti di una classe
     * @param {string} classId ID della classe
     */
    async generateCredentialsForClass(classId) {
        try {
            // Trova tutti gli studenti nella classe
            const students = await this.studentRepository.findByClassId(classId);
            
            if (!students || students.length === 0) {
                throw createError(
                    ErrorTypes.SYSTEM.ENTITY_NOT_FOUND,
                    'Nessuno studente trovato nella classe'
                );
            }
            
            // Estrai gli ID degli studenti
            const studentIds = students.map(student => student._id);
            
            // Genera credenziali in batch
            return await this.generateBatchCredentials(studentIds);
        } catch (error) {
            logger.error('Errore nella generazione credenziali per classe', { error, classId });
            throw error;
        }
    }

    /**
     * Genera una password temporanea casuale
     * @private
     * @returns {string} Password temporanea
     */
    _generateTemporaryPassword() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

module.exports = StudentAuthService;