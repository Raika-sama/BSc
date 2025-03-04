# Documentazione del Sistema di Gestione Utenti - Guida per Utenti Avanzati

## Panoramica del Sistema

Il sistema di gestione utenti fornisce una soluzione completa per la gestione degli utenti all'interno di una piattaforma educativa. È progettato per gestire diversi ruoli utente, permessi e livelli di accesso, con particolare attenzione ai contesti educativi come scuole, classi e studenti.

Il sistema integra il controllo degli accessi basato sui ruoli (RBAC) con permessi basati su attributi, consentendo un controllo granulare su quali risorse gli utenti possono accedere e quali azioni possono eseguire. Include anche una traccia completa degli audit per le modifiche agli account utente per mantenere conformità e sicurezza.

Caratteristiche principali:

- Ruoli utente gerarchici (admin, developer, manager, teacher, ecc.)
- Sistema di permessi granulari a tre dimensioni (risorsa, azione, ambito)
- Gestione del profilo utente
- Relazioni utente-risorse (scuole, classi, studenti)
- Controllo del livello di accesso ai test
- Logging completo degli audit
- Ricerca e filtro avanzati degli utenti
- Funzionalità di soft delete per mantenere l'integrità dei dati
- Integrazione frontend tramite React Context

## Architettura

Il sistema di gestione utenti segue un'architettura a strati con una chiara separazione delle responsabilità:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Route    │────▶│ Controller  │────▶│  Servizi    │────▶│ Repository  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                  │                   │
       ▼                   ▼                  ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Middleware │     │Gestione Errori│    │Gestione Permessi│  │   Modelli   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

- **Route**: Definiscono gli endpoint API per la gestione degli utenti
- **Controller**: Gestiscono le richieste/risposte HTTP e delegano la logica di business ai servizi
- **Servizi**: Implementano la logica di business e le operazioni sugli utenti
- **Repository**: Gestiscono l'accesso ai dati e le operazioni di persistenza
- **Modelli**: Definiscono lo schema dei dati utente e le regole di validazione
- **Middleware**: Gestiscono autenticazione e autorizzazione

## Modello Utente

### Struttura dello Schema

Il modello User è definito come schema Mongoose in `src/models/User.js` e include i seguenti componenti chiave:

```javascript
// Schema SessionToken (documento incorporato)
const sessionTokenSchema = {
    token: String,        // Identificatore di sessione
    createdAt: Date,      // Timestamp di creazione
    lastUsedAt: Date,     // Timestamp ultima attività
    userAgent: String,    // Info client
    ipAddress: String,    // Indirizzo IP client
    expiresAt: Date       // Timestamp di scadenza
}

// Schema Permission (documento incorporato)
const permissionSchema = {
    resource: String,     // Tipo di risorsa (users, schools, classes, ecc.)
    actions: [String],    // Azioni consentite (read, create, update, delete, manage)
    scope: String         // Ambito del permesso (all, school, class, assigned, own)
}

// Schema User (documento principale)
const userSchema = {
    // Informazioni di Base
    firstName: String,
    lastName: String,
    email: String,        // Usato per il login, deve essere unico
    password: String,     // Memorizzato con hash bcrypt
    
    // Ruolo e Permessi
    role: String,         // Uno tra admin, developer, manager, pcto, teacher, ecc.
    permissions: [permissionSchema],
    
    // Associazione Risorse
    assignedSchoolId: ObjectId,      // Per ruoli con ambito scuola
    assignedClassIds: [ObjectId],    // Per ruoli con ambito classe
    assignedStudentIds: [ObjectId],  // Per ruoli con ambito studente
    schoolId: ObjectId,              // Campo legacy
    
    // Controllo Accessi
    testAccessLevel: Number,         // Livello accesso test (0-8)
    hasAdminAccess: Boolean,         // Flag accesso pannello admin
    
    // Stato Account
    status: String,       // active, inactive o suspended
    lastLogin: Date,      // Timestamp ultimo login
    loginAttempts: Number,// Conteggio login falliti
    lockUntil: Date,      // Scadenza blocco account
    
    // Gestione Password
    passwordHistory: [{   // Password precedenti
        password: String,
        changedAt: Date
    }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Sessioni
    sessionTokens: [sessionTokenSchema],
    
    // Soft Delete
    isDeleted: Boolean,   // Flag soft delete
    deletedAt: Date       // Timestamp soft delete
}
```

### Indici

Il modello User definisce diversi indici per ottimizzare le prestazioni delle query:

```javascript
// Indici primari
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ schoolId: 1 });
userSchema.index({ status: 1 });

// Indici sessione
userSchema.index({ 'sessionTokens.token': 1 });
userSchema.index({ 'sessionTokens.expiresAt': 1 });

// Ottimizzazione ricerca nomi
userSchema.index({ firstName: 1, lastName: 1 });

// Pattern di query comuni
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ lastLogin: -1 });

// Indici associazione risorse
userSchema.index({ assignedSchoolId: 1 });
userSchema.index({ assignedClassIds: 1 });
userSchema.index({ assignedStudentIds: 1 });

// Indice soft delete
userSchema.index({ isDeleted: 1 });
```

### Metodi

Il modello User include diversi metodi di istanza per gestire operazioni comuni:

#### Gestione Sessioni
- `addSessionToken(tokenData)`: Aggiunge un nuovo token di sessione, con eliminazione automatica delle sessioni scadute e limite massimo di sessioni
- `removeSessionToken(token)`: Rimuove uno specifico token di sessione
- `updateSessionLastUsed(token)`: Aggiorna il timestamp di ultimo utilizzo per una sessione

#### Profilo Utente
- `setPerformer(userId)`: Imposta l'ID dell'utente che sta effettuando le modifiche (per audit)
- `getAuditHistory()`: Ottiene la cronologia completa degli audit per l'utente
- `isLocked()`: Controlla se l'account è attualmente bloccato
- `initializePermissions()`: Inizializza i permessi predefiniti in base al ruolo dell'utente

#### Proprietà Virtuali
- `fullName`: Restituisce il nome e cognome combinati

### Hook

Il modello User implementa diversi hook:

#### Hook Pre-save
- Hashing password: Esegue automaticamente l'hashing delle password quando vengono modificate
- Logging audit: Registra le modifiche ai dati utente nella collezione audit
- Inizializzazione ruolo: Imposta valori predefiniti per `hasAdminAccess` e `testAccessLevel` in base al ruolo

```javascript
// Hook per hashing password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Hook per impostare valori predefiniti basati sul ruolo
userSchema.pre('save', function(next) {
    if (this.isNew) {
        // Imposta accesso all'admin per admin e developer
        if (['admin', 'developer'].includes(this.role)) {
            this.hasAdminAccess = true;
        }
        
        // Imposta livello di accesso ai test basato sul ruolo
        if (this.testAccessLevel === undefined) {
            const testAccessLevels = {
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
            
            this.testAccessLevel = testAccessLevels[this.role] || 8;
        }
    }
    
    next();
});
```

## Sistema di Permessi Granulari

### Introduzione

Il sistema di permessi granulari implementa un modello di controllo degli accessi a tre dimensioni che combina:

1. **Resource** (Risorsa): L'entità su cui si applica il permesso
2. **Actions** (Azioni): Le operazioni permesse sulla risorsa
3. **Scope** (Ambito): Il contesto specifico in cui il permesso viene applicato

Questa struttura offre un controllo molto preciso, consentendo di configurare esattamente quali operazioni un utente può compiere su determinate risorse e in quali contesti.

### Risorse Disponibili

Le risorse rappresentano i differenti tipi di entità nel sistema:

```javascript
// Definite in PERMISSION_GROUPS in UserPermissions.jsx
const resources = [
    'users',      // Utenti del sistema
    'schools',    // Scuole/istituti
    'classes',    // Classi scolastiche
    'students',   // Studenti
    'tests',      // Test/valutazioni
    'api',        // Endpoint API
    'finance',    // Dati finanziari
    'services',   // Stato dei servizi/sistemi
    'analytics',  // Dati di analytics
    'materials'   // Materiale didattico
];
```

### Azioni Disponibili

Le azioni rappresentano le operazioni che un utente può eseguire su una risorsa:

```javascript
// Azioni standard per ogni risorsa
const actions = [
    'read',       // Visualizzazione (GET)
    'create',     // Creazione (POST)
    'update',     // Modifica (PUT/PATCH)
    'delete',     // Eliminazione (DELETE)
    'manage'      // Gestione completa (include tutte le precedenti)
];
```

### Ambiti (Scope) Disponibili

L'ambito limita il contesto in cui un permesso viene applicato:

```javascript
// Definiti in PERMISSION_SCOPES in UserPermissions.jsx
const scopes = [
    'all',        // Tutte le risorse di quel tipo
    'school',     // Solo risorse nella scuola assegnata
    'class',      // Solo risorse nelle classi assegnate
    'assigned',   // Solo risorse specificamente assegnate all'utente
    'own'         // Solo risorse create/possedute dall'utente
];
```

### Rappresentazione dei Permessi

I permessi sono memorizzati come array di oggetti nella proprietà `permissions` dell'utente:

```javascript
// Esempio di permessi per un insegnante
user.permissions = [
    {
        resource: 'classes',
        actions: ['read', 'update'],
        scope: 'school'
    },
    {
        resource: 'students',
        actions: ['read'],
        scope: 'class'
    },
    {
        resource: 'tests',
        actions: ['read', 'create', 'update'],
        scope: 'class'
    }
];
```

### Permessi Predefiniti per Ruolo

Il sistema assegna automaticamente permessi predefiniti in base al ruolo dell'utente tramite il metodo `initializeUserPermissions` del `PermissionService`:

```javascript
// Funzionamento semplificato dell'inizializzazione dei permessi
initializeUserPermissions(user) {
    switch(user.role) {
        case 'admin':
            // Accesso completo a tutto
            return this._setAdminPermissions(user);
        case 'teacher':
            // Accesso alle classi e studenti assegnati
            return this._setTeacherPermissions(user);
        case 'student':
            // Accesso solo ai propri dati
            return this._setStudentPermissions(user);
        // Altri ruoli...
        default:
            return this._setDefaultPermissions(user);
    }
}
```

## Sistema di Audit Utente

Il sistema include una completa traccia di audit per le azioni degli utenti attraverso il modello `UserAudit`, definito in `src/models/UserAudit.js`:

```javascript
const userAuditSchema = {
    userId: ObjectId,         // Utente oggetto dell'audit
    action: String,           // Tipo di azione (created, updated, deleted, ecc.)
    performedBy: ObjectId,    // Utente che ha eseguito l'azione
    changes: Mixed,           // Modifiche effettuate (vecchi e nuovi valori)
    ipAddress: String,        // Indirizzo IP
    userAgent: String         // User agent
}
```

Il modello User include un middleware pre-save che registra automaticamente le modifiche:

```javascript
// Middleware per audit automatico
userSchema.pre('save', async function(next) {
    if (this.isNew) return next();
    
    const changes = this.modifiedPaths().reduce((acc, path) => {
        acc[path] = {
            old: this._original ? this._original[path] : undefined,
            new: this[path]
        };
        return acc;
    }, {});
    
    if (Object.keys(changes).length > 0) {
        try {
            const UserAudit = mongoose.models.UserAudit || require('./UserAudit');
            await UserAudit.create({
                userId: this._id,
                action: 'updated',
                performedBy: this._performedBy || this._id,
                changes
            });
        } catch (error) {
            console.error('Error creating audit log:', error);
        }
    }
    
    next();
});
```

## Servizi di Gestione Utenti

Il `UserService` in `src/services/UserService.js` gestisce la logica di business per le operazioni sugli utenti.

### Servizi Principali

#### Operazioni di Base
- `getUserById(userId)`: Ottiene un utente specifico
- `findWithFilters(filters)`: Cerca utenti con filtri specifici
- `listUsers(filters, options)`: Ottiene una lista paginata di utenti
- `getSchoolTeachers(schoolId)`: Ottiene gli insegnanti di una specifica scuola

#### Gestione degli Utenti
- `createUser(userData, options)`: Crea un nuovo utente
- `updateUser(userId, updateData)`: Aggiorna un utente esistente
- `changeUserStatus(userId, newStatus)`: Modifica lo stato di un utente
- `deleteUser(userId)`: Elimina un utente (soft delete)
- `softDeleteUser(userId)`: Esegue il soft delete di un utente

#### Gestione Password
- `hashPassword(password)`: Genera l'hash di una password
- `handlePasswordUpdate(userId, newPassword)`: Gestisce l'aggiornamento delle password
- `validateUserData(userData, isNewUser)`: Valida i dati utente

### Gestione Permessi

Il servizio si integra con `PermissionService` per gestire i permessi e l'accesso alle risorse:

- `assignResources(userId, resources)`: Assegna risorse (scuole, classi, studenti) a un utente
- `updateUserPermissions(userId, permissions)`: Aggiorna i permessi di un utente
- `managePermissions(userId, permissions, action)`: Aggiunge o rimuove permessi

### Funzionalità di Sicurezza

- Tracciamento cronologia password (per evitare il riutilizzo)
- Validazione dei dati utente
- Sanitizzazione dei dati utente per le risposte API
- Gestione delle relazioni tra entità durante l'eliminazione degli utenti

```javascript
async handlePasswordUpdate(userId, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
        throw createError(
            ErrorTypes.RESOURCE.NOT_FOUND,
            'Utente non trovato'
        );
    }

    // Verifica se la password è stata usata di recente
    const hashedPassword = await this.hashPassword(newPassword);
    const isPasswordReused = user.passwordHistory.some(
        history => bcrypt.compareSync(newPassword, history.password)
    );

    if (isPasswordReused) {
        throw createError(
            ErrorTypes.VALIDATION.PASSWORD_REUSED,
            'Password già utilizzata di recente'
        );
    }

    // Aggiorna cronologia password
    user.passwordHistory.unshift({
        password: hashedPassword,
        changedAt: new Date()
    });

    // Mantieni solo le ultime N password
    if (user.passwordHistory.length > this.PASSWORD_HISTORY_LIMIT) {
        user.passwordHistory = user.passwordHistory.slice(0, this.PASSWORD_HISTORY_LIMIT);
    }

    user.password = hashedPassword;
    await user.save();

    // Invalida tutte le sessioni esistenti
    await this.sessionService.removeAllSessions(userId);
}
```

## Servizio di Gestione Permessi

Il `PermissionService` in `src/services/PermissionService.js` è responsabile della gestione dei permessi utente.

### Metodi Principali

#### Inizializzazione Permessi

```javascript
/**
 * Inizializza i permessi per un nuovo utente basati sul ruolo
 * @param {Object} user - Utente da inizializzare
 * @returns {Object} Utente con permessi inizializzati
 */
initializeUserPermissions(user) {
    // Assegna livello di accesso ai test in base al ruolo
    user.testAccessLevel = this.testAccessLevels[user.role] || 8;
    
    // Abilita accesso all'admin solo per admin e developer
    user.hasAdminAccess = ['admin', 'developer'].includes(user.role);
    
    // Imposta permessi predefiniti basati sul ruolo
    user.permissions = this.rolePermissions[user.role] || [];
    
    return user;
}
```

#### Assegnazione Risorse

```javascript
/**
 * Assegna risorse a un utente (scuola, classi, studenti)
 * @param {string} userId - ID utente
 * @param {Object} resources - Risorse da assegnare {schoolId, classIds, studentIds}
 * @returns {Object} Utente aggiornato
 */
async assignResources(userId, resources) {
    const user = await User.findById(userId);
    
    if (!user) {
        throw createError(ErrorTypes.RESOURCE.NOT_FOUND, 'Utente non trovato');
    }
    
    // Aggiorna le risorse assegnate
    if (resources.schoolId) {
        user.assignedSchoolId = resources.schoolId;
    }
    
    if (resources.classIds && resources.classIds.length > 0) {
        user.assignedClassIds = resources.classIds;
    }
    
    if (resources.studentIds && resources.studentIds.length > 0) {
        user.assignedStudentIds = resources.studentIds;
    }
    
    await user.save();
    return user;
}
```

#### Aggiornamento Permessi

```javascript
/**
 * Aggiorna i permessi di un utente
 * @param {string} userId - ID utente
 * @param {Array} permissions - Nuovi permessi
 * @returns {Object} Utente aggiornato
 */
async updateUserPermissions(userId, permissions) {
    const user = await User.findById(userId);
    
    if (!user) {
        throw createError(ErrorTypes.RESOURCE.NOT_FOUND, 'Utente non trovato');
    }
    
    // Valida i permessi
    if (!this._validatePermissions(permissions)) {
        throw createError(ErrorTypes.VALIDATION.INVALID_DATA, 'Permessi non validi');
    }
    
    // Aggiorna i permessi
    user.permissions = permissions;
    
    await user.save();
    return user;
}
```

#### Verifica Permessi

```javascript
/**
 * Verifica se un utente ha un determinato permesso
 * @param {Object} user - Utente
 * @param {string} resource - Risorsa
 * @param {string} action - Azione
 * @param {Object} context - Contesto della richiesta
 * @returns {boolean} True se l'utente ha il permesso
 */
hasPermission(user, resource, action, context = {}) {
    // Admin e developer hanno sempre accesso completo
    if (['admin', 'developer'].includes(user.role)) {
        return true;
    }
    
    // Controlla permessi espliciti
    const explicitPermission = this._checkExplicitPermission(user, resource, action, context);
    if (explicitPermission !== null) {
        return explicitPermission;
    }
    
    // Controlla permessi basati sul ruolo
    return this._checkRolePermission(user, resource, action, context);
}
```

## Controller

Il `UserController` in `src/controllers/userController.js` gestisce le richieste HTTP e delega la logica di business al servizio.

### Profilo Utente

- `getProfile(req, res)`: Ottiene il profilo dell'utente autenticato
- `updateProfile(req, res)`: Aggiorna il profilo dell'utente autenticato

```javascript
async getProfile(req, res) {
    try {
        const userId = req.user.id;
        const user = await this.userService.getUserById(userId);

        return this.sendResponse(res, {
            status: 'success',
            data: { user }
        });
    } catch (error) {
        logger.error('Get profile failed', { error });
        return this.handleError(res, error);
    }
}
```

### Amministrazione Utenti

- `getAll(req, res)`: Ottiene una lista paginata di utenti
- `getById(req, res)`: Ottiene un utente specifico per ID
- `create(req, res)`: Crea un nuovo utente
- `update(req, res)`: Aggiorna un utente esistente
- `delete(req, res)`: Elimina un utente
- `changeStatus(req, res)`: Modifica lo stato di un utente
- `assignResources(req, res)`: Assegna risorse a un utente
- `updatePermissions(req, res)`: Aggiorna i permessi di un utente
- `getAvailableManagers(req, res)`: Ottiene gli utenti disponibili per il ruolo di manager
- `getSchoolTeachers(req, res)`: Ottiene gli insegnanti di una specifica scuola

```javascript
async create(req, res) {
    try {
        const userData = req.body;
        console.log('Creating new user with data:', {
            ...userData,
            password: '[REDACTED]'
        });

        // Aggiunta controlli preliminari
        if (!userData.email || !userData.password || !userData.firstName || !userData.lastName || !userData.role) {
            return this.sendError(res, createError(
                ErrorTypes.VALIDATION.MISSING_FIELDS,
                'Campi obbligatori mancanti'
            ));
        }

        const user = await this.userService.createUser(userData);
        
        console.log('User created successfully:', {
            id: user._id,
            email: user.email,
            role: user.role
        });

        return this.sendResponse(res, {
            status: 'success',
            data: { user }
        }, 201);
    } catch (error) {
        console.error('User creation failed:', error);
        
        // Gestione specifica degli errori
        if (error.code === ErrorTypes.VALIDATION.INVALID_DATA) {
            return this.sendError(res, error, 400);
        }
        if (error.code === 11000) { // MongoDB duplicate key error
            return this.sendError(res, createError(
                ErrorTypes.RESOURCE.ALREADY_EXISTS,
                'Email già registrata'
            ));
        }
        
        return this.sendError(res, error);
    }
}
```

### Gestione Risposte

Il controller estende un `BaseController` che fornisce metodi standard per rispondere alle richieste:

- `sendResponse(res, data, statusCode)`: Invia una risposta di successo
- `sendError(res, error, statusCode)`: Invia una risposta di errore
- `handleError(res, error)`: Gestisce gli errori in modo centralizzato

## Repository

Il `UserRepository` in `src/repositories/UserRepository.js` gestisce l'accesso ai dati e le operazioni di persistenza.

### Operazioni CRUD

- `findById(id)`: Trova un utente per ID
- `findByEmail(email, includePassword)`: Trova un utente per email
- `create(userData)`: Crea un nuovo utente
- `update(userId, updateData)`: Aggiorna un utente esistente
- `deleteUser(userId)`: Elimina un utente (soft delete)

```javascript
async findById(id) {
    try {
        console.log('UserRepository: Finding user by ID:', id);
        
        const user = await this.model.findById(id)
            .select('-password -passwordHistory -passwordResetToken -passwordResetExpires');
        
        if (!user) {
            throw createError(
                ErrorTypes.RESOURCE.NOT_FOUND,
                'Utente non trovato'
            );
        }

        return user;
    } catch (error) {
        console.error('UserRepository: Error finding user by ID:', error);
        if (error.name === 'CastError') {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_ID,
                'ID utente non valido'
            );
        }
        throw error;
    }
}
```

### Ricerca e Filtri

- `findWithFilters(filters, options)`: Cerca utenti con filtri specifici e paginazione

```javascript
async findWithFilters(filters = {}, options = {}) {
    try {
        let query = {};
        
        console.log('Repository findWithFilters received:', { filters, options });

        // Filtri base
        if (filters.search) {
            query.$or = [
                { firstName: { $regex: filters.search, $options: 'i' } },
                { lastName: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } }
            ];
        }

        if (filters.role) {
            query.role = filters.role;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        // Gestione filtro schoolId
        if (filters.schoolId) {
            console.log('Applying schoolId filter:', filters.schoolId);
            try {
                const objectId = new mongoose.Types.ObjectId(filters.schoolId);
                query.schoolId = objectId;
            } catch (err) {
                console.error('Invalid schoolId format:', err);
            }
        }

        console.log('Final query:', query);

        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.model
                .find(query)
                .select('firstName lastName email role status schoolId createdAt')
                .sort(options.sort || { createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(query)
        ]);

        console.log('Query results:', {
            totalFound: total,
            usersReturned: users.length,
            query
        });

        return {
            users,
            total,
            page,
            limit
        };
    } catch (error) {
        console.error('Repository Error:', error);
        throw error;
    }
}
```

### Gestione Relazioni

Un aspetto chiave del repository è la gestione delle relazioni tra entità durante l'eliminazione degli utenti:

```javascript
async deleteUser(userId) {
    // Usiamo una sessione di transazione per garantire integrità
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log(`UserRepository: Starting deletion for user ${userId}`);

        // 1. Trova l'utente completo
        const user = await this.model.findById(userId).session(session);
        if (!user) {
            throw new Error('Utente non trovato');
        }

        // 2. Aggiorna le scuole in cui l'utente è manager
        const School = mongoose.model('School');
        const schoolsAsManager = await School.find({ manager: userId }).session(session);
        
        for (const school of schoolsAsManager) {
            // Imposta un messaggio di avviso sulla scuola
            school.notes = `${school.notes || ''}\n[AVVISO] Il manager precedente (${user.firstName} ${user.lastName}) è stato rimosso il ${new Date().toLocaleString()}. Assegnare un nuovo manager.`;
            // Rimuovi l'utente come manager
            school.manager = null;
            await school.save({ session });
        }

        // 3. Rimuovi l'utente dagli utenti della scuola
        await School.updateMany(
            { 'users.user': userId },
            { $pull: { users: { user: userId } } },
            { session }
        );

        // 4. Aggiorna le classi in cui l'utente è mainTeacher
        const Class = mongoose.model('Class');
        const classesAsMainTeacher = await Class.find({ mainTeacher: userId }).session(session);
        
        for (const cls of classesAsMainTeacher) {
            // Marca il docente come temporaneamente rimosso
            cls.mainTeacherIsTemporary = true;
            cls.previousMainTeacher = userId;
            cls.mainTeacher = null;
            await cls.save({ session });
        }

        // 5-7. Gestione altre relazioni...

        // 8. Soft delete dell'utente
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.status = 'inactive';
        user.email = `deleted_${Date.now()}_${user.email}`; // Modifica email per evitare conflitti futuri
        
        // Clear session tokens
        if (user.sessionTokens && Array.isArray(user.sessionTokens)) {
            user.sessionTokens = [];
        }
        
        await user.save({ session });

        // Commit della transazione
        await session.commitTransaction();
        return true;
    } catch (error) {
        // Rollback in caso di errore
        await session.abortTransaction();
        throw error;
    } finally {
        // Fine della sessione
        session.endSession();
    }
}
```

## Route API

Le route API per la gestione degli utenti sono definite in `src/routes/userRoutes.js`.

### Route Pubbliche

Non ci sono route pubbliche per la gestione degli utenti. Tutte le route richiedono autenticazione.

### Route Protette

Route accessibili a tutti gli utenti autenticati:

```
GET    /users/me              - Profilo utente corrente
PUT    /users/me              - Aggiorna profilo utente corrente
```

```javascript
// Rotte profilo utente (accessibili a tutti gli utenti autenticati)
router.get('/me', 
    asyncHandler(userController.getProfile.bind(userController))
);

router.put('/me', 
    asyncHandler(userController.updateProfile.bind(userController))
);
```

### Route Amministrative

Route accessibili solo agli utenti con ruoli specifici:

```
// Accessibili a Admin/Developer
GET    /users                 - Lista utenti (paginata, con ricerca)
POST   /users                 - Crea nuovo utente
GET    /users/:id             - Dettaglio utente
PUT    /users/:id             - Aggiorna utente
DELETE /users/:id             - Elimina utente
POST   /users/:id/permissions - Aggiorna permessi utente
POST   /users/:id/resources   - Assegna risorse a utente
PUT    /users/:id/status      - Cambia stato utente

// Accessibili a Manager (limitate alla propria scuola)
GET    /users                 - Lista utenti (filtrata per propria scuola)
GET    /users/:id             - Dettaglio utente (solo propria scuola)
```

```javascript
// Verifica che l'utente abbia accesso admin, altrimenti non procede
router.use((req, res, next) => {
    if (['admin', 'developer'].includes(req.user?.role)) {
        return next();
    }
    // Per i manager controlliamo solo alcune route
    if (req.user?.role === 'manager') {
        const allowedManagerPaths = ['/users', '/users/school'];
        if (allowedManagerPaths.some(path => req.originalUrl.includes(path))) {
            return next();
        }
    }
    // Altrimenti, errore di permessi
    next(createError(
        ErrorTypes.AUTH.FORBIDDEN,
        'Accesso al pannello amministrativo non consentito'
    ));
});

// Route CRUD per gestione utenti
router.route('/:id')
    .get(asyncHandler(userController.getById.bind(userController)))
    .put(asyncHandler(userController.update.bind(userController)))
    .delete(
        restrictTo('admin', 'developer'),
        asyncHandler(userController.delete.bind(userController))
    );

// Rotta per creazione nuovo utente
router.post('/', 
    restrictTo('admin', 'developer'),
    asyncHandler(userController.create.bind(userController))
);
```

## Integrazione Frontend

L'integrazione frontend è gestita attraverso il `UserContext` in `src/adminInterface/src/context/UserContext.js`.

### Context degli Utenti

Un contesto React che fornisce funzionalità di gestione utenti a tutti i componenti:

```javascript
export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const { showNotification } = useNotification();

    // Metodi per operazioni sugli utenti
    const getUsers = useCallback(async (filters = {}) => {
        // Implementazione
    }, []);

    const getUserById = async (userId) => {
        // Implementazione
    };

    // Altri metodi...

    const value = {
        users,
        loading,
        error,
        totalUsers,
        getUsers,
        getUserById,
        getSchoolTeachers,
        getUserHistory,
        createUser,
        updateUser,
        deleteUser,
        validateUserData,
        terminateSession,
        changeUserStatus
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
```

### Validazione Dati

Il contesto include una robusta validazione dei dati utente:
```javascript
const validateUserData = (userData, isNewUser = false, isPartialUpdate = false) => {
    console.log("Validating user data:", userData, "isNewUser:", isNewUser, "isPartialUpdate:", isPartialUpdate);
    
    // Se i dati sono vuoti o nulli, fallisce immediatamente
    if (!userData) {
        console.error("userData è null o undefined");
        return { general: "Dati utente mancanti" };
    }
    
    const errors = {};
    
    if (isPartialUpdate) {
        // Per aggiornamenti parziali, valida solo i campi presenti
        console.log("Performing partial validation");
        
        if ('email' in userData) {
            if (!userData.email?.trim() || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(userData.email)) {
                errors.email = 'Email non valida';
            }
        }
        
        if ('firstName' in userData && !userData.firstName?.trim()) {
            errors.firstName = 'Nome richiesto';
        }
        
        if ('lastName' in userData && !userData.lastName?.trim()) {
            errors.lastName = 'Cognome richiesto';
        }
        
        if ('role' in userData) {
            const validRoles = ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health', 'student'];
            if (!validRoles.includes(userData.role)) {
                errors.role = 'Ruolo non valido';
            }
        }
    } else {
        // Validazione completa per creazione o aggiornamento completo
        console.log("Performing full validation");
        
        if (!userData.firstName?.trim()) {
            errors.firstName = 'Nome richiesto';
        }
        
        if (!userData.lastName?.trim()) {
            errors.lastName = 'Cognome richiesto';
        }
        
        if (!userData.email?.trim() || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(userData.email)) {
            errors.email = 'Email non valida';
        }
        
        if (isNewUser && (!userData.password || userData.password.length < 8)) {
            errors.password = 'La password deve essere di almeno 8 caratteri';
        }
        
        const validRoles = ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health', 'student'];
        if (!userData.role || !validRoles.includes(userData.role)) {
            errors.role = 'Ruolo non valido';
        }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
};
```

### Operazioni sugli Utenti

Il contesto fornisce metodi per le operazioni CRUD sugli utenti:

#### Ottenere Utenti
```javascript
const getUsers = useCallback(async (filters = {}) => {
    try {
        setLoading(true);
        
        const queryParams = new URLSearchParams({
            page: filters.page || 1,
            limit: filters.limit || 10,
            search: filters.search || '',
            sort: filters.sort || '-createdAt'
        });

        if (filters.schoolId) {
            queryParams.append('schoolId', filters.schoolId);
        }

        if (filters.role) {
            queryParams.append('role', filters.role);
        }

        const response = await axiosInstance.get(`/users?${queryParams.toString()}`);
        
        if (response.data.status === 'success') {
            const { users, total, page: currentPage } = response.data.data.data;
            
            setUsers(users || []);
            setTotalUsers(total || 0);
            setError(null);
            
            return {
                users,
                total,
                page: currentPage,
                limit: filters.limit
            };
        }
        
        throw new Error('Struttura dati non valida');
    } catch (error) {
        console.error('UserContext: Error in getUsers:', error);
        setError(error.message);
        showNotification(error.message, 'error');
        
        return {
            users: [],
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 10
        };
    } finally {
        setLoading(false);
    }
}, []);
```

#### Creare un Utente
```javascript
const createUser = async (userData) => {
    try {
        console.log('UserContext: Creating user with data:', userData);
        
        const validationErrors = validateUserData(userData, true);
        if (validationErrors) {
            console.error('Validation errors:', validationErrors);
            throw new Error('Validation Error', { cause: validationErrors });
        }

        const response = await axiosInstance.post('/users', userData);

        if (response.data.status === 'success') {
            const newUser = response.data.data.user;
            setUsers(prev => [...prev, newUser]);
            showNotification('Utente creato con successo', 'success');
            return newUser;
        } else {
            throw new Error('Formato risposta non valido');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.message === 'Validation Error') {
            showNotification('Dati utente non validi', 'error');
            throw error.cause;
        }
        
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nella creazione dell\'utente';
        showNotification(errorMessage, 'error');
        throw error;
    }
};
```

#### Aggiornare un Utente
```javascript
const updateUser = async (userId, userData) => {
    try {
        // Assicuriamoci che userId sia valido
        if (!userId) {
            throw new Error('ID utente mancante');
        }
        
        // Se include testAccessLevel, assicuriamoci che sia un numero
        if (userData && 'testAccessLevel' in userData) {
            userData.testAccessLevel = Number(userData.testAccessLevel);
        }
        
        // Determina se è un aggiornamento parziale
        const isPartialUpdate = 
            (userData && userData.permissions !== undefined) || 
            (userData && userData.testAccessLevel !== undefined) ||
            (userData && userData.hasAdminAccess !== undefined);
        
        // Validazione con supporto per aggiornamenti parziali
        const validationErrors = validateUserData(userData, false, isPartialUpdate);
        if (validationErrors) {
            throw new Error('Validation Error');
        }
        
        // Chiamata API
        const response = await axiosInstance.put(`/users/${userId}`, userData);
        
        // Verifica che la risposta abbia il formato corretto
        if (response.data && response.data.status === 'success') {
            let updatedUser;
            
            // Opzione 1: user è direttamente nell'oggetto data
            if (response.data.data && response.data.data.user) {
                updatedUser = response.data.data.user;
            } 
            // Opzione 2: l'intero oggetto data è l'utente
            else if (response.data.data) {
                updatedUser = response.data.data;
            }
            // Opzione 3: non c'è un utente nella risposta, ricarica l'utente
            else {
                try {
                    // Ricarica i dati dell'utente
                    updatedUser = await getUserById(userId);
                } catch (err) {
                    // Prosegui comunque, al peggio non aggiorniamo la UI ma è già stato aggiornato sul DB
                }
            }
            
            // Aggiorna lo stato con l'utente recuperato
            if (updatedUser) {
                setUsers(prev => prev.map(user => 
                    user._id === userId ? updatedUser : user
                ));
                
                showNotification('Utente aggiornato con successo', 'success');
                return updatedUser;
            }
        }
        
        throw new Error('Risposta del server non valida');
    } catch (error) {
        // Gestione errori
        if (error.message === 'Validation Error') {
            showNotification('Dati utente non validi. Verifica i campi inseriti.', 'error');
        } else {
            showNotification(error.message || 'Errore nell\'aggiornamento dell\'utente', 'error');
        }
        throw error;
    }
};
```

#### Eliminare un Utente
```javascript
const deleteUser = async (userId) => {
    try {
        const response = await axiosInstance.delete(`/users/${userId}`);
        
        if (response.data.status === 'success') {
            setUsers(prev => prev.filter(user => user._id !== userId));
            showNotification('Utente eliminato con successo', 'success');
        }
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || 'Errore nell\'eliminazione dell\'utente';
        showNotification(errorMessage, 'error');
        throw error;
    }
};
```

## Misure di Sicurezza

Il sistema implementa diverse misure di sicurezza:

### Protezione delle Password
- Le password sono hashate utilizzando bcrypt con 10 round di salting
- Viene mantenuta una cronologia delle password per prevenire il riutilizzo
- Le password vengono eliminate dai dati utente restituiti dalle API

### Controllo degli Accessi
- Middleware di protezione per tutte le route
- Middleware di restrizione per ruoli specifici
- Verifica dei permessi basata su ruoli e risorse assegnate
- Controllo dell'accesso al pannello di amministrazione

### Protezione dei Dati
- Validazione dei dati in entrata
- Sanitizzazione dei dati in uscita
- Transazioni MongoDB per garantire l'integrità durante le operazioni complesse
- Soft delete per preservare le relazioni

### Audit e Logging
- Registrazione automatica delle modifiche
- Tracciamento di chi ha eseguito le modifiche
- Logging completo delle operazioni su utenti

## Gestione Errori

Il sistema implementa una gestione centralizzata degli errori:

### Nei Controller
```javascript
router.use((err, req, res, next) => {
    logger.error('User Route Error:', {
        error: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        targetUserId: req.params.id
    });

    // Gestione errori di validazione
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            error: {
                message: 'Errore di validazione',
                code: 'USER_VALIDATION_ERROR',
                details: err.errors
            }
        });
    }

    // Gestione errori di autorizzazione
    if (err.code === 'AUTH_004' || err.statusCode === 401) {
        return res.status(401).json({
            status: 'error',
            error: {
                message: 'Non autorizzato',
                code: 'USER_AUTH_ERROR'
            }
        });
    }

    // Gestione errori di permessi
    if (err.code === 'AUTH_003' || err.statusCode === 403) {
        return res.status(403).json({
            status: 'error',
            error: {
                message: 'Permessi insufficienti',
                code: 'USER_PERMISSION_ERROR'
            }
        });
    }

    // Altri errori
    const standardError = createError(
        err.code || ErrorTypes.SYSTEM.INTERNAL_ERROR,
        err.message || 'Errore interno del server',
        { originalError: err }
    );

    res.status(standardError.status).json({
        status: 'error',
        error: {
            code: standardError.code,
            message: standardError.message,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                details: err.metadata 
            })
        }
    });
});
```

### Nel Frontend
```javascript
const handleError = (error) => {
    console.error('Error:', error);
    
    if (error.response?.data?.error) {
        const serverError = error.response.data.error;
        showNotification(serverError.message || 'Errore dal server', 'error');
    } else {
        showNotification(error.message || 'Si è verificato un errore', 'error');
    }
};
```

## Best Practices

Il sistema di gestione utenti implementa diverse best practice:

### Separazione delle Preoccupazioni
- Chiara separazione tra route, controller, servizi e repository
- Gestione centralizzata degli errori
- Middleware specifici per autenticazione e autorizzazione

### Sicurezza
- Hashing delle password
- Validazione e sanitizzazione dei dati
- Controllo accesso basato su ruoli e permessi
- Audit trail completo

### Gestione Transazionale
- Utilizzo di sessioni MongoDB per operazioni complesse
- Pattern di rollback in caso di errore

### Manutenibilità
- Codice modulare e riutilizzabile
- Pattern di factory per creazione router e middleware
- Logging completo per debugging

### Prestazioni
- Indici strategici per ottimizzare le query
- Paginazione per liste utenti
- Selezione dei campi per ridurre il trasferimento dati

### UX
- Feedback immediato con notifiche
- Gestione degli stati di caricamento
- Messaggi di errore chiari e specifici

## Conclusione

Il sistema di gestione utenti fornisce un'infrastruttura completa e robusta per gestire utenti, permessi e risorse. È particolarmente adatto a contesti educativi con diversi ruoli e livelli di accesso, garantendo al contempo sicurezza, manutenibilità e usabilità. Il sistema è progettato per essere estensibile e può essere facilmente adattato a requisiti futuri.

La documentazione fornita in questo file dovrebbe servire come riferimento completo per comprendere, mantenere ed estendere il sistema di gestione utenti.