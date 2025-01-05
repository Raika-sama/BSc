📚 Documentazione Tecnica - Controllers e Routes
Progetto: Brain-Scanner (BSc)
Versione: 1.0.0
Data: 2025-01-05
Autore: Raika-sama

🏗️ Architettura
Code
src/
├── controllers/
│   ├── baseController.js
│   ├── schoolController.js
│   ├── userController.js
│   ├── classController.js
│   ├── studentController.js
│   ├── testController.js
│   └── index.js
└── routes/
    ├── index.js
    ├── healthRoutes.js
    ├── schoolRoutes.js
    ├── userRoutes.js
    ├── classRoutes.js
    ├── studentRoutes.js
    └── testRoutes.js
🎯 Pattern Implementati
1. Base Controller Pattern
JavaScript
class BaseController {
    constructor(repository, modelName) {
        this.repository = repository;
        this.modelName = modelName;
    }
}
Fornisce operazioni CRUD standard
Gestione errori centralizzata
Response formatting consistente
Integrazione con repository pattern
2. Route Middleware Pattern
JavaScript
router.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});
Logging centralizzato
Error handling per route
Preparazione per autenticazione
📡 API Endpoints
Health Check
GET /api/v1/health
Monitora stato applicazione
Verifica connessione database
Metriche sistema
Schools
HTTP
GET    /schools          # Lista scuole
GET    /schools/:id      # Dettagli scuola
POST   /schools         # Crea scuola
PUT    /schools/:id     # Aggiorna scuola
DELETE /schools/:id     # Elimina scuola
GET    /schools/region/:region  # Scuole per regione
GET    /schools/type/:type      # Scuole per tipo
Users
HTTP
POST   /users/login           # Login
POST   /users/register        # Registrazione
POST   /users/forgot-password # Reset password
GET    /users/me             # Profilo utente
PUT    /users/me             # Aggiorna profilo
Classes
HTTP
GET    /classes              # Lista classi
GET    /classes/:id          # Dettagli classe
POST   /classes             # Crea classe
PUT    /classes/:id         # Aggiorna classe
DELETE /classes/:id         # Elimina classe
GET    /classes/school/:schoolId  # Classi per scuola
POST   /classes/:classId/students # Aggiungi studenti
Students
HTTP
GET    /students            # Lista studenti
GET    /students/:id        # Dettagli studente
POST   /students           # Crea studente
PUT    /students/:id       # Aggiorna studente
DELETE /students/:id       # Elimina studente
GET    /students/:studentId/tests   # Test studente
GET    /students/:studentId/results # Risultati test
Tests
HTTP
GET    /tests              # Lista test
GET    /tests/:id          # Dettagli test
POST   /tests             # Crea test
GET    /tests/:id/stats   # Statistiche test
POST   /tests/:id/submit  # Sottometti test
🔧 Configurazione Routes
1. Binding dei Controller
router.get('/', controller.method.bind(controller));
Mantiene il contesto del controller
Permette l'accesso ai metodi del repository
2. Error Handling
JavaScript
router.use((err, req, res, next) => {
    logger.error(`${routeName} Error:`, err);
    res.status(err.statusCode || 500).json({
        status: 'error',
        error: {
            message: err.message,
            code: err.code
        }
    });
});
📊 Response Format
Success Response
JSON
{
    "status": "success",
    "data": {
        "modelName": {}
    }
}
Error Response
JSON
{
    "status": "error",
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
🔒 Sicurezza (TO-DO)
Implementare middleware autenticazione
Proteggere route sensibili
Validazione input
Rate limiting
🚀 Best Practices
Naming Conventions

Controllers: <Model>Controller
Routes: <model>Routes
Methods: camelCase
Error Handling

Errori specifici per dominio
Logging consistente
Status code appropriati
Logging

Request logging
Error logging
Performance metrics
Route Organization

Raggruppamento logico
Middleware specifici
Versioning API
📝 Note per gli Sviluppatori
Estendere i Controller
JavaScript
class CustomController extends BaseController {
    async customMethod() {
        // Implementazione
    }
}
Aggiungere Nuove Route
JavaScript
// 1. Creare nuovo controller
// 2. Aggiungere al controllers/index.js
// 3. Creare file route
// 4. Registrare in routes/index.js
Testing Routes
Utilizzare Postman/Thunder Client
Verificare response format
Testare error handling
Manutenzione
Aggiornare documentazione
Mantenere consistenza nei response
Monitorare performance
🔄 Workflow di Sviluppo
Implementare nuovo controller
Creare routes associate
Aggiungere documentazione
Testing
Code review
Deploy