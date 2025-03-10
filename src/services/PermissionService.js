// src/services/PermissionService.js
const { createError, ErrorTypes } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const mongoose = require('mongoose');

/**
 * Servizio per la gestione dei permessi degli utenti
 */
class PermissionService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        
        // Mapping dei permessi predefiniti per ruolo
        this.rolePermissions = {
            admin: this._generateAdminPermissions(),
            developer: this._generateDeveloperPermissions(),
            manager: this._generateManagerPermissions(),
            pcto: this._generatePCTOPermissions(),
            teacher: this._generateTeacherPermissions(),
            tutor: this._generateTutorPermissions(),
            researcher: this._generateResearcherPermissions(),
            health: this._generateHealthProfessionalPermissions(),
            student: this._generateStudentPermissions()
        };
        
        // Mapping dei livelli di accesso ai test
        this.testAccessLevels = {
            admin: 0,       // Tutti i test
            developer: 1,   // Tutti i test
            manager: 2,     // Test nella propria scuola
            pcto: 3,        // Test nella propria scuola
            teacher: 4,     // Test nelle proprie classi
            tutor: 5,       // Test assegnati ai propri studenti
            researcher: 6,  // Analytics con quotazione
            health: 7,      // Test con quotazione
            student: 8      // Test assegnati a se stesso
        };
    }
    
    /**
     * Verifica se un utente ha un determinato permesso
     * @param {Object} user - Utente da verificare
     * @param {string} resource - Risorsa richiesta (users, schools, etc.)
     * @param {string} action - Azione richiesta (read, create, update, delete, manage)
     * @param {Object} context - Contesto della richiesta (es. schoolId, classId)
     * @returns {boolean} True se l'utente ha il permesso, false altrimenti
     */
    async hasPermission(user, resource, action, context = {}) {
        try {
            logger.debug('Checking permission', { 
                userId: user._id ? user._id.toString() : user.id?.toString(), // Convert ID to string to prevent character-by-character logging
                role: user.role,
                resource,
                action,
                context
            });
            
            // Admin e Developer hanno accesso completo a quasi tutto
            if (user.role === 'admin') {
                // Admin ha accesso completo a tutto
                return true;
            }
            
            if (user.role === 'developer' && resource !== 'finance') {
                // Developer ha accesso completo a tutto tranne Finance
                return true;
            }
            
            // Controlla permessi espliciti
            const explicitPermission = this._checkExplicitPermission(user, resource, action, context);
            if (explicitPermission !== null) {
                return explicitPermission;
            }
            
            // Controlla permessi basati sul ruolo
            return this._checkRolePermission(user, resource, action, context);
            
        } catch (error) {
            logger.error('Error checking permission', { error });
            return false;
        }
    }
    
    /**
     * Verifica se un utente ha accesso a un test specifico
     * @param {Object} user - Utente da verificare
     * @param {Object} test - Test da verificare
     * @returns {boolean} True se l'utente ha accesso, false altrimenti
     */
    async hasTestAccess(user, test) {
        try {
            const accessLevel = user.testAccessLevel || this.testAccessLevels[user.role] || 8;
            
            // Livello 0-1: Accesso a tutti i test
            if (accessLevel <= 1) {
                return true;
            }
            
            // Livello 2-3: Test nella propria scuola
            if (accessLevel <= 3) {
                return user.assignedSchoolId && 
                       test.schoolId && 
                       user.assignedSchoolId.toString() === test.schoolId.toString();
            }
            
            // Livello 4: Test nelle proprie classi
            if (accessLevel === 4) {
                return user.assignedClassIds && 
                       test.classId && 
                       user.assignedClassIds.some(id => id.toString() === test.classId.toString());
            }
            
            // Livello 5-7: Test assegnati ai propri studenti
            if (accessLevel <= 7) {
                return user.assignedStudentIds && 
                       test.studentId && 
                       user.assignedStudentIds.some(id => id.toString() === test.studentId.toString());
            }
            
            // Livello 8: Solo test assegnati a se stesso (studente)
            return test.studentId && 
                   user._id.toString() === test.studentId.toString();
            
        } catch (error) {
            logger.error('Error checking test access', { error });
            return false;
        }
    }
    
    /**
     * Inizializza i permessi per un nuovo utente basati sul ruolo
     * @param {Object} user - Utente da inizializzare
     * @returns {Object} Utente con permessi inizializzati
     */
    initializeUserPermissions(user) {
        try {
            // Assegna il livello di accesso ai test
            user.testAccessLevel = this.testAccessLevels[user.role] || 8;
            
            // Abilità accesso all'admin solo per admin e developer
            user.hasAdminAccess = ['admin', 'developer'].includes(user.role);
            
            // Imposta permessi predefiniti basati sul ruolo
            user.permissions = this.rolePermissions[user.role] || [];
            
            return user;
            
        } catch (error) {
            logger.error('Error initializing user permissions', { error });
            throw error;
        }
    }
    
    /**
     * Aggiorna i permessi di un utente
     * @param {string} userId - ID utente
     * @param {Array} permissions - Nuovo array di permessi
     * @returns {Object} Utente aggiornato
     */
    async updateUserPermissions(userId, permissions) {
        try {
            // Validazione
            if (!Array.isArray(permissions)) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_DATA,
                    'Formato permessi non valido'
                );
            }
            
            // Aggiorna i permessi
            const user = await this.userRepository.update(userId, { permissions });
            
            logger.info('User permissions updated', { userId });
            return user;
            
        } catch (error) {
            logger.error('Error updating user permissions', { error });
            throw error;
        }
    }
    
    /**
     * Assegna risorse a un utente (scuola, classi, studenti)
     * @param {string} userId - ID utente
     * @param {Object} resources - Risorse da assegnare {schoolId, classIds, studentIds}
     * @returns {Object} Utente aggiornato
     */
    async assignResources(userId, resources) {
        try {
            const updateData = {};
            
            // Assegna scuola
            if (resources.schoolId) {
                if (!mongoose.Types.ObjectId.isValid(resources.schoolId)) {
                    throw createError(
                        ErrorTypes.VALIDATION.INVALID_ID,
                        'ID scuola non valido'
                    );
                }
                updateData.assignedSchoolId = resources.schoolId;
            }
            
            // Assegna classi
            if (resources.classIds && Array.isArray(resources.classIds)) {
                // Validazione
                const invalidIds = resources.classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
                if (invalidIds.length > 0) {
                    throw createError(
                        ErrorTypes.VALIDATION.INVALID_ID,
                        'ID classi non validi'
                    );
                }
                updateData.assignedClassIds = resources.classIds;
            }
            
            // Assegna studenti
            if (resources.studentIds && Array.isArray(resources.studentIds)) {
                // Validazione
                const invalidIds = resources.studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
                if (invalidIds.length > 0) {
                    throw createError(
                        ErrorTypes.VALIDATION.INVALID_ID,
                        'ID studenti non validi'
                    );
                }
                updateData.assignedStudentIds = resources.studentIds;
            }
            
            // Aggiorna l'utente
            const user = await this.userRepository.update(userId, updateData);
            
            logger.info('User resources assigned', { 
                userId,
                resources: {
                    schoolId: resources.schoolId,
                    classCount: resources.classIds?.length,
                    studentCount: resources.studentIds?.length
                }
            });
            
            return user;
            
        } catch (error) {
            logger.error('Error assigning resources', { error });
            throw error;
        }
    }
    
    // =================== METODI PRIVATI ===================
    
    /**
     * Controlla permessi espliciti dell'utente
     * @private
     */
    _checkExplicitPermission(user, resource, action, context) {
        // Se l'utente non ha permessi espliciti, ritorna null per procedere con il controllo basato su ruolo
        if (!user.permissions || user.permissions.length === 0) {
            return null;
        }
        
        // Cerca un permesso specifico per la risorsa e azione
        const permission = user.permissions.find(p => 
            p.resource === resource && 
            (p.actions.includes(action) || p.actions.includes('manage'))
        );
        
        if (!permission) {
            return null;
        }
        
        // Verificare lo scope del permesso
        switch (permission.scope) {
            case 'all':
                return true;
                
            case 'school':
                return context.schoolId && 
                       user.assignedSchoolId && 
                       context.schoolId.toString() === user.assignedSchoolId.toString();
                
            case 'class':
                return context.classId && 
                       user.assignedClassIds && 
                       user.assignedClassIds.some(id => id.toString() === context.classId.toString());
                
            case 'assigned':
                return context.studentId && 
                       user.assignedStudentIds && 
                       user.assignedStudentIds.some(id => id.toString() === context.studentId.toString());
                
            case 'own':
                return context.userId && user._id.toString() === context.userId.toString();
                
            default:
                return false;
        }
    }
    
    /**
     * Controlla permessi basati sul ruolo dell'utente
     * @private
     */
    _checkRolePermission(user, resource, action, context) {
        switch (user.role) {
            case 'manager':
                return this._checkManagerPermission(user, resource, action, context);
                
            case 'pcto':
                return this._checkPCTOPermission(user, resource, action, context);
                
            case 'teacher':
                return this._checkTeacherPermission(user, resource, action, context);
                
            case 'tutor':
                return this._checkTutorPermission(user, resource, action, context);
                
            case 'researcher':
                return this._checkResearcherPermission(user, resource, action, context);
                
            case 'health':
                return this._checkHealthProfessionalPermission(user, resource, action, context);
                
            case 'student':
                return this._checkStudentPermission(user, resource, action, context);
                
            default:
                return false;
        }
    }
    
    // Controlli specifici per ruolo
    
    _checkManagerPermission(user, resource, action, context) {
        // Manager: gestisce utenti, classi, studenti e test nella propria scuola
        if (!user.assignedSchoolId) {
            return false;
        }
        
        if (resource === 'users' && action === 'read') {
            return true;
        }
        
        if (['schools', 'classes', 'students'].includes(resource)) {
            // Verifica che la risorsa appartenga alla scuola del manager
            if (context.schoolId && context.schoolId.toString() !== user.assignedSchoolId.toString()) {
                return false;
            }
            return action === 'read' || action === 'create' || action === 'update';
        }
        
        if (resource === 'tests') {
            return true; // Manager ha accesso completo ai test nella propria scuola
        }
        
        return false;
    }
    
    _checkPCTOPermission(user, resource, action, context) {
        // PCTO: lettura classi/studenti, scrittura/lettura test
        if (!user.assignedSchoolId) {
            return false;
        }
        
        if (['classes', 'students'].includes(resource)) {
            // Verifica che la risorsa appartenga alla scuola del PCTO
            if (context.schoolId && context.schoolId.toString() !== user.assignedSchoolId.toString()) {
                return false;
            }
            return action === 'read';
        }
        
        if (resource === 'tests') {
            return true; // PCTO ha accesso completo ai test
        }
        
        return false;
    }
    
    _checkTeacherPermission(user, resource, action, context) {
        // Teacher: lettura classi/studenti, scrittura/lettura test
        if (!user.assignedClassIds || user.assignedClassIds.length === 0) {
            return false;
        }
        
        if (['classes', 'students'].includes(resource)) {
            // Verifica che la risorsa appartenga a una classe dell'insegnante
            if (context.classId && !user.assignedClassIds.some(id => id.toString() === context.classId.toString())) {
                return false;
            }
            return action === 'read';
        }
        
        if (resource === 'tests') {
            return true; // Teacher ha accesso completo ai test
        }
        
        return false;
    }
    
    _checkTutorPermission(user, resource, action, context) {
        // Tutor: lettura studenti assegnati, scrittura/lettura test
        if (!user.assignedStudentIds || user.assignedStudentIds.length === 0) {
            return false;
        }
        
        if (resource === 'students') {
            // Verifica che lo studente sia assegnato al tutor
            if (context.studentId && !user.assignedStudentIds.some(id => id.toString() === context.studentId.toString())) {
                return false;
            }
            return action === 'read';
        }
        
        if (resource === 'tests') {
            return true; // Tutor ha accesso completo ai test per i propri studenti
        }
        
        return false;
    }
    
    _checkResearcherPermission(user, resource, action, context) {
        // Researcher: sola lettura analytics
        return resource === 'analytics' && action === 'read';
    }
    
    _checkHealthProfessionalPermission(user, resource, action, context) {
        // Health: lettura engines esistenti, scrittura engines propri
        if (resource !== 'tests') {
            return false;
        }
        
        if (action === 'read') {
            return true; // Può leggere tutti i test
        }
        
        // Per create/update, verifica che il test sia di sua proprietà
        return context.ownerId && context.ownerId.toString() === user._id.toString();
    }
    
    // Modifica al metodo _checkStudentPermission nel file PermissionService.js

_checkStudentPermission(user, resource, action, context) {
    // Student: lettura scuola, propri dati e test assegnati
    if (resource === 'schools' && action === 'read') {
        // Gestisci il caso in cui schoolId possa provenire dal modello Student
        // Permetti l'accesso se non c'è un context.schoolId (visualizzazione generale)
        // o se il context.schoolId corrisponde allo schoolId dello studente
        if (!context.schoolId) return true;
        
        return user.schoolId && context.schoolId.toString() === user.schoolId.toString();
    }
    
    // Aggiungi permesso per visualizzare i propri dati studente
    if (resource === 'students' && action === 'read') {
        // Permetti l'accesso se non c'è un context.studentId (visualizzazione generale)
        // o se il context.studentId corrisponde all'ID dello studente
        if (!context.studentId) return true;
        
        return context.studentId.toString() === user._id.toString();
    }
    
    if (resource === 'tests' && action === 'read') {
        // Permetti l'accesso se non c'è un context.studentId (visualizzazione generale)
        // o se il context.studentId corrisponde all'ID dello studente
        if (!context.studentId) return true;
        
        return context.studentId.toString() === user._id.toString();
    }
    
    return false;
}
    
    // =================== GENERAZIONE PERMESSI PREDEFINITI ===================
    
    _generateAdminPermissions() {
        // Admin ha accesso completo a tutto
        return [
            { resource: 'users', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'schools', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'classes', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'students', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'tests', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'api', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'finance', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'services', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'analytics', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' },
            { resource: 'materials', actions: ['read', 'create', 'update', 'delete', 'manage'], scope: 'all' }
        ];
    }
    
    _generateDeveloperPermissions() {
        // Developer ha accesso completo a tutto tranne finance
        const permissions = this._generateAdminPermissions();
        const financeIndex = permissions.findIndex(p => p.resource === 'finance');
        if (financeIndex !== -1) {
            permissions.splice(financeIndex, 1);
        }
        return permissions;
    }
    
    _generateManagerPermissions() {
        // Manager: gestione utenti, scuole, classi, studenti nella propria scuola
        return [
            { resource: 'users', actions: ['read'], scope: 'school' },
            { resource: 'schools', actions: ['read'], scope: 'school' },
            { resource: 'classes', actions: ['read', 'create', 'update'], scope: 'school' },
            { resource: 'students', actions: ['read', 'create', 'update'], scope: 'school' },
            { resource: 'tests', actions: ['read', 'create', 'update'], scope: 'school' }
        ];
    }
    
    _generatePCTOPermissions() {
        // PCTO: lettura classi/studenti, scrittura/lettura test
        return [
            { resource: 'classes', actions: ['read'], scope: 'school' },
            { resource: 'students', actions: ['read'], scope: 'school' },
            { resource: 'tests', actions: ['read', 'create', 'update'], scope: 'school' }
        ];
    }
    
    _generateTeacherPermissions() {
        // Teacher: lettura classi/studenti, scrittura/lettura test
        return [
            { resource: 'classes', actions: ['read'], scope: 'class' },
            { resource: 'students', actions: ['read'], scope: 'class' },
            { resource: 'tests', actions: ['read', 'create', 'update'], scope: 'class' }
        ];
    }
    
    _generateTutorPermissions() {
        // Tutor: lettura studenti assegnati, scrittura/lettura test
        return [
            { resource: 'students', actions: ['read'], scope: 'assigned' },
            { resource: 'tests', actions: ['read', 'create', 'update'], scope: 'assigned' }
        ];
    }
    
    _generateResearcherPermissions() {
        // Researcher: sola lettura analytics
        return [
            { resource: 'analytics', actions: ['read'], scope: 'all' }
        ];
    }
    
    _generateHealthProfessionalPermissions() {
        // Health: lettura engines esistenti, scrittura engines propri
        return [
            { resource: 'tests', actions: ['read'], scope: 'all' },
            { resource: 'tests', actions: ['create', 'update'], scope: 'own' }
        ];
    }
    
    _generateStudentPermissions() {
        // Student: lettura scuola, propri dati e test assegnati
        return [
            { resource: 'schools', actions: ['read'], scope: 'own' },
            { resource: 'students', actions: ['read'], scope: 'own' },
            { resource: 'tests', actions: ['read'], scope: 'own' }
        ];
    }
}

module.exports = PermissionService;