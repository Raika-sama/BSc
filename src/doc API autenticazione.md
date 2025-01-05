Documentazione API Autenticazione
Progetto: Brain-Scanner (BSc)
Versione: 1.0.0
Data: 2025-01-05
Autore: Raika-sama

🔐 Endpoints di Autenticazione
1. Registrazione Utente
POST /api/v1/auth/register
Request Body:

JSON
{
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "password": "string",
    "role": "teacher|admin" // Opzionale, default: "teacher"
}
Response Success (201):

JSON
{
    "status": "success",
    "data": {
        "user": {
            "id": "string",
            "firstName": "string",
            "lastName": "string",
            "email": "string",
            "role": "string",
            "isActive": true,
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
        },
        "token": "JWT_TOKEN"
    }
}
Possibili Errori:

400 MISSING_FIELDS: Campi obbligatori mancanti
400 EMAIL_EXISTS: Email già registrata
500 USER_CREATION_ERROR: Errore durante la creazione
2. Login
POST /api/v1/auth/login
Request Body:

JSON
{
    "email": "string",
    "password": "string"
}
Response Success (200):

JSON
{
    "status": "success",
    "data": {
        "user": {
            "id": "string",
            "firstName": "string",
            "lastName": "string",
            "email": "string",
            "role": "string",
            "isActive": true
        },
        "token": "JWT_TOKEN"
    }
}
Possibili Errori:

400 MISSING_CREDENTIALS: Credenziali mancanti
401 INVALID_CREDENTIALS: Credenziali non valide
401 ACCOUNT_INACTIVE: Account disattivato
3. Logout
POST /api/v1/auth/logout
Richiede: Token JWT valido

Response Success (200):

JSON
{
    "status": "success",
    "message": "Logout effettuato con successo"
}
4. Reset Password (Richiesta)
POST /api/v1/auth/forgot-password
Request Body:

JSON
{
    "email": "string"
}
Response Success (200):

JSON
{
    "status": "success",
    "message": "Token inviato via email"
}
Development Response (solo in ambiente di sviluppo):

JSON
{
    "status": "success",
    "message": "Token inviato via email",
    "data": {
        "token": "RESET_TOKEN"
    }
}
Possibili Errori:

400 MISSING_EMAIL: Email mancante
404 EMAIL_NOT_FOUND: Email non trovata
5. Reset Password (Conferma)
POST /api/v1/auth/reset-password
Request Body:

JSON
{
    "token": "string",
    "password": "string"
}
Response Success (200):

JSON
{
    "status": "success",
    "message": "Password aggiornata con successo",
    "data": {
        "token": "JWT_TOKEN"
    }
}
Possibili Errori:

400 MISSING_FIELDS: Token o password mancanti
400 INVALID_TOKEN: Token non valido o scaduto
🔒 Sicurezza
JWT Token
Validità: 24 ore
Storage: HttpOnly Cookie
Format: Bearer Token
Cookie Configuration
JavaScript
{
    httpOnly: true,
    secure: true, // in production
    maxAge: 24 * 60 * 60 * 1000 // 24 ore
}
Password Requirements
Minimo 8 caratteri
Validazione tramite regex pattern
Hashing con bcrypt (salt rounds: 10)
🛡️ Protezione Route
Middleware di Autenticazione
JavaScript
// Esempio di route protetta
router.use(protect);
Middleware Ruoli
JavaScript
// Esempio di route ristretta per ruolo
router.use(protect, restrictTo('admin'));
📝 Headers
Request Headers
HTTP
Authorization: Bearer <token>
Content-Type: application/json
Response Headers
HTTP
Set-Cookie: jwt=<token>; HttpOnly; Secure
Content-Type: application/json
🚫 Rate Limiting
JavaScript
{
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // richieste per windowMs
    message: "Troppe richieste, riprova più tardi"
}
🔍 Logging
Login attempts
Password reset requests
Registration events
Authentication failures
🧪 Testing
Per procedere con i test, dovremo creare:

Unit test per AuthController
Integration test per le routes
Test di sicurezza
Test di performance