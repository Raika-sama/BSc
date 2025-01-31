// src/middleware/permissionMiddleware.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

class PermissionMiddleware {
    constructor(userService) {
        this.userService = userService;
    }

    /**
     * Verifica ruoli utente
     * @param {...String} roles - Ruoli permessi
     */
    checkRole = (...roles) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw createError(
                        ErrorTypes.AUTH.NO_AUTH,
                        'Autenticazione richiesta'
                    );
                }

                if (!roles.includes(req.user.role)) {
                    logger.warn('Unauthorized role access', {
                        userId: req.user.id,
                        requiredRoles: roles,
                        userRole: req.user.role,
                        path: req.path
                    });

                    throw createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Accesso non autorizzato'
                    );
                }

                logger.debug('Role check passed', {
                    userId: req.user.id,
                    role: req.user.role,
                    path: req.path
                });

                next();
            } catch (error) {
                next(error);
            }
        };
    };

    /**
     * Verifica permessi specifici
     * @param {...String} requiredPermissions - Permessi richiesti
     */
    checkPermissions = (...requiredPermissions) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw createError(
                        ErrorTypes.AUTH.NO_AUTH,
                        'Autenticazione richiesta'
                    );
                }

                const hasAllPermissions = requiredPermissions.every(
                    permission => req.user.permissions.includes(permission)
                );

                if (!hasAllPermissions) {
                    logger.warn('Permission denied', {
                        userId: req.user.id,
                        requiredPermissions,
                        userPermissions: req.user.permissions,
                        path: req.path
                    });

                    throw createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Permessi insufficienti'
                    );
                }

                logger.debug('Permission check passed', {
                    userId: req.user.id,
                    permissions: requiredPermissions,
                    path: req.path
                });

                next();
            } catch (error) {
                next(error);
            }
        };
    };

    /**
     * Verifica permessi contestuali (es. stesso utente o stessa scuola)
     */
    checkContextualPermission = (contextCheck) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    throw createError(
                        ErrorTypes.AUTH.NO_AUTH,
                        'Autenticazione richiesta'
                    );
                }

                // Se admin, bypassa i controlli contestuali
                if (req.user.role === 'admin') {
                    return next();
                }

                const hasPermission = await contextCheck(req);

                if (!hasPermission) {
                    logger.warn('Contextual permission denied', {
                        userId: req.user.id,
                        path: req.path,
                        params: req.params
                    });

                    throw createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Accesso non autorizzato'
                    );
                }

                logger.debug('Contextual permission check passed', {
                    userId: req.user.id,
                    path: req.path
                });

                next();
            } catch (error) {
                next(error);
            }
        };
    };

    /**
     * Verifica appartenenza alla stessa scuola
     */
    checkSameSchool = async (req) => {
        const targetUser = await this.userService.getUserById(req.params.id);
        return targetUser && targetUser.schoolId === req.user.schoolId;
    };

    /**
     * Verifica se l'utente sta modificando se stesso
     */
    checkSelfAction = (req) => {
        return req.params.id === req.user.id;
    };
}

// Esempio di utilizzo dei controlli contestuali
const contextualChecks = {
    updateUser: async (req) => {
        // Permetti se: stesso utente o stesso istituto (per ruoli autorizzati)
        return req.user.id === req.params.id || 
               (req.user.role === 'manager' && await this.checkSameSchool(req));
    },
    
    viewUserDetails: async (req) => {
        // Permetti se: stesso utente, stesso istituto o admin
        return req.user.id === req.params.id || 
               await this.checkSameSchool(req) ||
               req.user.role === 'admin';
    }
};

module.exports = {
    PermissionMiddleware,
    contextualChecks
};