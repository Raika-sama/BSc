// src/middleware/authMiddleware.js
const rateLimit = require('express-rate-limit');
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

// Rate Limiter per tentativi di login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 10, // limite di 10 tentativi
    message: 'Troppi tentativi di login. Riprova più tardi.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            status: 'error',
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Troppi tentativi. Riprova più tardi.'
            }
        });
    }
});

// Rate Limiter per tentativi di login studenti (più restrittivo)
const studentLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 5, // limite più basso per gli studenti
    message: 'Troppi tentativi di login. Riprova più tardi.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Student rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            status: 'error',
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Troppi tentativi. Riprova più tardi.'
            }
        });
    }
});

class AuthMiddleware {
    constructor(authService, sessionService, permissionService, studentAuthService) {
        if (!authService) throw new Error('AuthService is required');
        if (!sessionService) throw new Error('SessionService is required');
        if (!permissionService) throw new Error('PermissionService is required');
        
        this.authService = authService;
        this.sessionService = sessionService;
        this.permissionService = permissionService;
        this.studentAuthService = studentAuthService;
        this.tokenBlacklist = new Set();
        
        // Bind dei metodi per mantenere il contesto corretto
        this.hasPermission = this.hasPermission.bind(this);
        this._buildPermissionContext = this._buildPermissionContext.bind(this);
        this.extractToken = this.extractToken.bind(this);
        this.extractStudentToken = this.extractStudentToken.bind(this);
        this.hasTestAccess = this.hasTestAccess.bind(this);
        this.requireAdminAccess = this.requireAdminAccess.bind(this);
        this.blacklistToken = this.blacklistToken.bind(this);
    }
    
    /**
     * Middleware di protezione route
     */
    protect = async (req, res, next) => {
        try {
            const token = this.extractToken(req);
            
            if (!token) {
                throw createError(
                    ErrorTypes.AUTH.NO_TOKEN,
                    'Autenticazione richiesta'
                );
            }
    
            // Verifica blacklist
            if (this.tokenBlacklist.has(token)) {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_BLACKLISTED,
                    'Token non più valido'
                );
            }
    
            // Verifica e decodifica token
            const decoded = await this.authService.verifyToken(token);
    
            logger.debug('Token decoded:', {
                userId: decoded.id,
                sessionId: decoded.sessionId,
                path: req.path
            });
    
            // Verifica sessione
            const { user, session } = await this.sessionService.validateSession(
                decoded.sessionId
            );
    
            // Aggiungi user al request
            req.user = {
                id: decoded.id,
                role: decoded.role,
                permissions: decoded.permissions,
                sessionId: decoded.sessionId,
                schoolId: decoded.schoolId,
                testAccessLevel: decoded.testAccessLevel
            };
    
            logger.debug('Authentication successful', {
                userId: decoded.id,
                path: req.path,
                sessionId: decoded.sessionId
            });
    
            next();
        } catch (error) {
            logger.error('Authentication failed', {
                error,
                path: req.path,
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * Middleware di protezione route studenti
     */
    protectStudent = async (req, res, next) => {
        try {
            const token = this.extractStudentToken(req);
            
            if (!token) {
                throw createError(
                    ErrorTypes.AUTH.NO_TOKEN,
                    'Autenticazione studente richiesta'
                );
            }

            // Verifica blacklist
            if (this.tokenBlacklist.has(token)) {
                throw createError(
                    ErrorTypes.AUTH.TOKEN_BLACKLISTED,
                    'Token non più valido'
                );
            }

            // Verifica e decodifica token
            const decoded = await this.studentAuthService.verifyToken(token);

            logger.debug('Student token decoded:', {
                studentId: decoded.id,
                path: req.path
            });

            // Recupera dati completi dello studente per avere accesso a schoolId
            const student = await req.studentRepository.findById(decoded.id);
            
            if (!student) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Dati studente non trovati'
                );
            }

            // Aggiungi student al request con schoolId
            req.student = {
                id: decoded.id,
                type: 'student',
                _id: decoded.id, // Aggiungiamo anche _id per compatibilità con il formato usato nei controlli di permesso
                schoolId: student.schoolId,
                testAccessLevel: 8 // Studente ha sempre livello 8
            };

            logger.debug('Student authenticated:', {
                studentId: decoded.id,
                schoolId: student.schoolId,
                path: req.path
            });

            next();
        } catch (error) {
            logger.error('Student authentication failed', {
                error,
                path: req.path,
                ip: req.ip
            });
            next(error);
        }
    };

    /**
     * Middleware per verificare ruolo
     * @param {...string} roles - Ruoli consentiti
     */
    restrictTo = (...roles) => {
        return (req, res, next) => {
            // Verifica che ci sia un utente autenticato
            if (!req.user && !req.student) {
                return next(createError(
                    ErrorTypes.AUTH.NO_USER,
                    'Utente non autenticato'
                ));
            }
            
            // Se è uno studente, ma la route richiede un ruolo specifico non studente
            if (req.student && !roles.includes('student')) {
                return next(createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Accesso non consentito'
                ));
            }
            
            // Se è un utente, verifica il ruolo
            if (req.user && !roles.includes(req.user.role)) {
                return next(createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Accesso non consentito per questo ruolo'
                ));
            }
            
            next();
        };
    };
    
     /**
     * Middleware per verificare i permessi
     * @param {string} resource - Risorsa richiesta
     * @param {string} action - Azione richiesta (read, create, update, delete, manage)
     */
     hasPermission = (resource, action) => {
        return async (req, res, next) => {
            try {
                logger.debug('hasPermission chiamato per:', {
                    resource,
                    action,
                    user: req.user?.id,
                    student: req.student?.id
                });
                
                // Verifica che ci sia un utente autenticato
                if (!req.user && !req.student) {
                    logger.error('Nessun utente autenticato trovato');
                    return next(createError(
                        ErrorTypes.AUTH.NO_USER,
                        'Utente non autenticato'
                    ));
                }
                
                // Per gli studenti, controllo semplificato
                if (req.student) {
                    // Costruisci il contesto per il controllo dei permessi
                    const context = {};
                    
                    // Aggiungi studentId al contesto
                    if (req.params.studentId) {
                        context.studentId = req.params.studentId;
                    } else if (req.params.id && resource === 'students') {
                        // Molte volte l'ID dello studente potrebbe essere passato come 'id' generico
                        context.studentId = req.params.id;
                    }
                    
                    // Aggiungi schoolId al contesto
                    if (req.params.schoolId) {
                        context.schoolId = req.params.schoolId;
                    }
                    
                    logger.debug('Student permission check:', {
                        studentId: req.student.id,
                        resource,
                        action,
                        context
                    });
                    
                    // Permetti sempre allo studente di leggere il proprio profilo
                    if (resource === 'students' && action === 'read' && 
                        (context.studentId === req.student.id || !context.studentId)) {
                        return next();
                    }
                    
                    // Permetti sempre allo studente di leggere la propria scuola
                    if (resource === 'schools' && action === 'read') {
                        return next();
                    }
                    
                    // Permetti sempre allo studente di leggere i test a lui assegnati
                    if (resource === 'tests' && action === 'read') {
                        return next();
                    }
                    
                    return next(createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Accesso non consentito'
                    ));
                }
                
             // Per utenti normali, controlla permessi complessi
             const context = this._buildPermissionContext(req);
             logger.debug('Contesto costruito:', context);
             
             // Verifico che userRepository sia disponibile nella richiesta
             if (!req.userRepository) {
                 logger.error('UserRepository non trovato nella richiesta');
                 return next(createError(
                     ErrorTypes.SYSTEM.INTERNAL_ERROR,
                     'Repository non trovato nella richiesta'
                 ));
             }
             
             logger.debug('Chiamata a userRepository.findById con ID:', req.user.id);
             // Recupera l'utente completo dal database - USA IL REPOSITORY DALLA REQUEST
             const user = await req.userRepository.findById(req.user.id);
             
             if (!user) {
                 logger.error('Utente non trovato con ID:', req.user.id);
                 return next(createError(
                     ErrorTypes.AUTH.USER_NOT_FOUND,
                     'Utente non trovato'
                 ));
             }
             
             logger.debug('Utente trovato:', {
                 userId: user._id,
                 role: user.role
             });
             
             logger.debug('Chiamata a permissionService.hasPermission con parametri:', {
                 userId: user._id,
                 resource,
                 action,
                 context
             });
             
             const hasPermission = await this.permissionService.hasPermission(
                 user,
                 resource,
                 action,
                 context
             );
             
             logger.debug('Risultato permissionService.hasPermission:', hasPermission);
             
             if (!hasPermission) {
                 logger.warn('Permesso negato per utente:', {
                     userId: user._id,
                     resource,
                     action,
                     context
                 });
                 return next(createError(
                     ErrorTypes.AUTH.FORBIDDEN,
                     'Permessi insufficienti'
                 ));
             }
             
             logger.debug('Permessi verificati con successo');
             next();
         } catch (error) {
             logger.error('Permission check failed', {
                 error: {
                     message: error.message,
                     stack: error.stack
                 },
                 resource,
                 action,
                 userId: req.user?.id
             });
             next(error);
         }
     };
 };


    /**
     * Middleware per verificare accesso a test
     */
    hasTestAccess = () => {
        return async (req, res, next) => {
            try {
                // Se non c'è utente autenticato
                if (!req.user && !req.student) {
                    return next(createError(
                        ErrorTypes.AUTH.NO_USER,
                        'Utente non autenticato'
                    ));
                }
                
                // Recupera dati del test
                const testId = req.params.testId || req.body.testId;
                if (!testId) {
                    return next(createError(
                        ErrorTypes.VALIDATION.MISSING_FIELDS,
                        'ID test mancante'
                    ));
                }
                
                // Recupera il test
                const test = await req.testRepository.findById(testId);
                
                // Per gli studenti, verifica che il test sia assegnato a loro
                if (req.student) {
                    if (test.studentId && test.studentId.toString() === req.student.id.toString()) {
                        return next();
                    }
                    return next(createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Test non accessibile'
                    ));
                }
                
                // Per utenti normali, controlla in base al livello di accesso
                const user = await req.userRepository.findById(req.user.id);
                
                const hasAccess = await this.permissionService.hasTestAccess(user, test);
                
                if (!hasAccess) {
                    return next(createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Accesso non consentito a questo test'
                    ));
                }
                
                next();
            } catch (error) {
                logger.error('Test access check failed', {
                    error,
                    testId: req.params.testId || req.body.testId,
                    userId: req.user?.id
                });
                next(error);
            }
        };
    };

    /**
     * Middleware per verificare accesso all'admin frontend
     */
    requireAdminAccess = () => {
        return async (req, res, next) => {
            // Verifica che ci sia un utente autenticato
            if (!req.user) {
                return next(createError(
                    ErrorTypes.AUTH.NO_USER,
                    'Utente non autenticato'
                ));
            }
            
            // Recupera l'utente completo
            const user = await req.userRepository.findById(req.user.id);
            
            // Verifica accesso admin
            if (!user.hasAdminAccess) {
                return next(createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Accesso non consentito al pannello amministrativo'
                ));
            }
            
            next();
        };
    };

    /**
     * Estrae token dalla request
     */
    extractToken = (req) => {
        if (req.cookies && req.cookies['access-token']) {
            return req.cookies['access-token'];
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }

        return null;
    };

    /**
     * Estrae token studente dalla request
     */
    extractStudentToken = (req) => {
        if (req.cookies && req.cookies['student-token']) {
            return req.cookies['student-token'];
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }

        return null;
    };

    /**
     * Aggiunge token alla blacklist
     */
    blacklistToken = (token) => {
        this.tokenBlacklist.add(token);
        // In produzione, impostare TTL basato sulla scadenza del token
        setTimeout(() => {
            this.tokenBlacklist.delete(token);
        }, 24 * 60 * 60 * 1000); // 24 ore
    };

    /**
     * Costruisce il contesto per i controlli di permesso
     * @private
     */
    _buildPermissionContext(req) {
        const context = {
            userId: req.user.id
        };
        
        // Aggiungi schoolId dal parametro o body
        if (req.params.schoolId) {
            context.schoolId = req.params.schoolId;
        } else if (req.body.schoolId) {
            context.schoolId = req.body.schoolId;
        } else if (req.user.schoolId) {
            context.schoolId = req.user.schoolId;
        }
        
        // Aggiungi classId dal parametro o body
        if (req.params.classId) {
            context.classId = req.params.classId;
        } else if (req.body.classId) {
            context.classId = req.body.classId;
        }
        
        // Aggiungi studentId dal parametro o body
        if (req.params.studentId) {
            context.studentId = req.params.studentId;
        } else if (req.body.studentId) {
            context.studentId = req.body.studentId;
        }
        
        // Aggiungi ownerId per test
        if (req.body.ownerId) {
            context.ownerId = req.body.ownerId;
        }
        
        return context;
    }
}

// Factory function
const createAuthMiddleware = (authService, sessionService, permissionService, studentAuthService) => {
    const middleware = new AuthMiddleware(authService, sessionService, permissionService, studentAuthService);
    return {
        loginLimiter,
        studentLoginLimiter,
        protect: middleware.protect.bind(middleware),
        protectStudent: middleware.protectStudent.bind(middleware),
        restrictTo: middleware.restrictTo.bind(middleware),
        hasPermission: middleware.hasPermission.bind(middleware),
        hasTestAccess: middleware.hasTestAccess.bind(middleware),
        requireAdminAccess: middleware.requireAdminAccess.bind(middleware),
        blacklistToken: middleware.blacklistToken.bind(middleware)
    };
};

module.exports = createAuthMiddleware;