


Documentazione Database Brain-Scanner
1. Overview
Il sistema è strutturato attorno a cinque entità principali interconnesse:

Schools (Scuole)
Users (Utenti/Docenti)
Classes (Classi)
Students (Studenti)
Tests/Results (Test e Risultati)

2. Relazioni Principali
CopySchool N:M Users   (una scuola ha più utenti, un utente può appartenere a più scuole)
School 1:N Classes (una scuola ha più classi)
Class  N:M Users   (una classe ha più docenti)
Class  1:N Students (una classe ha più studenti)
Student N:1 School  (uno studente appartiene a una scuola)
Student N:1 Class   (uno studente appartiene a una classe)
3. Collections Dettagliate
3.1 Schools
javascriptCopy{
  _id: ObjectId,
  name: String,                    // Nome della scuola
  schoolType: String,              // ['middle_school', 'high_school']
  institutionType: String,         // ['scientific', 'classical', 'artistic', 'none']
  sections: [String],              // Array di sezioni disponibili (es: ['A', 'B', 'C'])
  numberOfYears: Number,           // 3 per middle_school, 5 per high_school
  region: String,                  // Regione
  province: String,                // Provincia
  address: String,                 // Indirizzo
  users: [{                        // Array di utenti associati
    user: ObjectId,               // Riferimento all'utente
    role: String                  // ['teacher', 'admin']
  }],
  manager: ObjectId,               // Riferimento al responsabile
  isActive: Boolean,               // Stato attivo/inattivo
  createdAt: Date,
  updatedAt: Date
}
3.2 Users
javascriptCopy{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,                   // Unique
  password: String,                // Hashed
  role: String,                    // ['teacher', 'admin']
  isActive: Boolean,
  lastLogin: Date,
  passwordResetToken: String,      // Per recupero password
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
3.3 Classes
javascriptCopy{
  _id: ObjectId,
  year: Number,                    // Anno di corso (1-5)
  section: String,                 // Sezione (A, B, etc)
  academicYear: String,            // Format: "2024/2025"
  schoolId: ObjectId,              // Riferimento alla scuola
  mainTeacher: ObjectId,           // Docente principale
  teachers: [ObjectId],            // Array docenti (include mainTeacher)
  students: [ObjectId],            // Array studenti
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
3.4 Students
javascriptCopy{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  gender: String,                  // ['M', 'F']
  email: String,
  classId: ObjectId,              // Riferimento alla classe
  schoolId: ObjectId,             // Riferimento alla scuola
  section: String,                // Sezione corrente
  mainTeacher: ObjectId,          // Docente principale
  teachers: [ObjectId],           // Array docenti
  notes: String,                  // Note/Commenti
  needsClassAssignment: Boolean,  // Flag per studenti senza classe
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
3.5 Tests & Results
javascriptCopy// Tests
{
  _id: ObjectId,
  nome: String,                    // Nome del test
  descrizione: String,             // Descrizione
  domande: [{
    testo: String,                // Testo domanda
    opzioni: [String],            // Opzioni di risposta
    rispostaCorretta: String      // Opzionale
  }]
}

// Results
{
  _id: ObjectId,
  utente: ObjectId,               // Riferimento all'utente
  test: ObjectId,                 // Riferimento al test
  risposte: [{
    domanda: Number,              // Numero domanda
    risposta: String              // Risposta data
  }],
  punteggio: Number,              // Punteggio totale
  data: Date                      // Data completamento
}
4. Vincoli e Regole di Business
4.1 Schools

Deve sempre avere almeno un admin
Il tipo di istituto è obbligatorio solo per high_school
Le sezioni devono essere lettere maiuscole singole
numberOfYears è automaticamente 3 o 5 in base al tipo

4.2 Users

Email deve essere unica
Deve essere associato ad almeno una scuola per accedere
Password deve seguire policy di sicurezza
Solo admin possono creare altri admin

4.3 Classes

Combinazione year+section+academicYear deve essere unica per scuola
mainTeacher deve essere sempre presente nell'array teachers
Non può esistere senza una scuola associata

4.4 Students

Può appartenere a una sola classe per volta
Deve avere una scuola associata
La section deve corrispondere a una sezione valida della scuola
mainTeacher deve essere presente nell'array teachers

5. Indici
javascriptCopy// Schools
{ 'users.user': 1 }
{ 'users.role': 1 }
{ manager: 1 }

// Users
{ email: 1 } // unique
{ role: 1 }

// Classes
{ schoolId: 1, year: 1, section: 1, academicYear: 1 } // unique compound
{ mainTeacher: 1 }
{ teachers: 1 }

// Students
{ classId: 1 }
{ schoolId: 1 }
{ mainTeacher: 1 }
{ teachers: 1 }
6. Note per lo Sviluppo

Utilizzare sempre transazioni per operazioni multi-documento
Implementare soft delete dove possibile (isActive flag)
Validare dati prima dell'inserimento
Mantenere consistenza nelle relazioni
Usare popolamento selettivo nei query
Gestire correttamente le date (timezone)

7. Setup Test Engine

I test sono implementati come microservizi Python separati
Ogni test ha il suo engine di calcolo
I risultati vengono salvati nel DB principale
La comunicazione avviene via API REST

8. Performance Considerations

Utilizzare indici appropriati per query comuni
Implementare paginazione per liste lunghe
Limitare il numero di documenti nelle array
Utilizzare proiezioni per limitare i dati restituiti
Monitorare la dimensione delle collezioni



Riepilogo dei modelli creati:

Schema School:


Validazioni complete per tutti i campi
Indici ottimizzati per le query comuni
Middleware pre-save per validazione admin
Gestione relazioni con altri modelli


Schema User:


Validazione email con regex
Gestione password sicura
Supporto per reset password
Indici per ottimizzazione query

Class:


Validazione anno scolastico e sezione
Relazioni con School, User (teachers) e Students
Indice composto per unicità classe
Middleware per assicurare mainTeacher in teachers


Student:


Validazioni complete per dati personali
Relazioni con Class, School e Teachers
Sistema flessibile per assegnazione classe
Indici ottimizzati per le query più comuni


Test e Result:


Schema separato per test e risultati
Struttura flessibile per domande e risposte
Sistema di punteggio
Indici per ottimizzazione ricerche


index.js:


Export centralizzato di tutti i modelli
Facilita l'importazione in altri moduli

Caratteristiche comuni a tutti i modelli:

Validazioni robuste
Indici ottimizzati
Relazioni ben definite
Supporto per soft delete (isActive)
Timestamps automatici

Configurazione Database (database.js):


Setup connessione MongoDB con opzioni ottimizzate
Gestione eventi di connessione/disconnessione
Gestione errori e logging
Funzioni helper per verificare lo stato e chiudere la connessione


Schema School:


Validazioni complete per tutti i campi
Indici ottimizzati per le query comuni
Middleware pre-save per validazione admin
Gestione relazioni con altri modelli


Schema User:


Validazione email con regex
Gestione password sicura
Supporto per reset password
Indici per ottimizzazione query


Riepilogo del file index.js:

Scopo:


Centralizza l'esportazione di tutti i modelli
Semplifica l'importazione dei modelli in altri file
Verifica l'integrità dei modelli al caricamento


Funzionalità:


Importa tutti i modelli dai rispettivi file
Esporta i modelli come singolo oggetto
Aggiunge verifiche di debug per i modelli
Log dei modelli disponibili


Vantaggi:


Riduce la duplicazione del codice
Rende più pulite le importazioni
Facilita la manutenzione
Aiuta a identificare problemi di caricamento


Uso:

javascriptCopy// Prima
const School = require('../models/School');
const User = require('../models/User');

// Dopo
const { School, User } = require('../models');




Database
MongoDB Atlas
Connection String: mongodb+srv://RaikaSama:<password>@cluster0.4nf56.mongodb.net/
Database: brainScannerDB


Documentazione Database - Brain Scanner Backend
Data ultimo aggiornamento: 2025-01-05

1. Configurazione Database
1.1 Connessione
Tipo: MongoDB Atlas
Database Nome: brainScannerDB
Ambiente: Development
Configurazione: .env.development
1.2 Struttura Collections
JavaScript
// Collections create durante la migrazione iniziale
├── users
│   └── Indici: { email: 1 } (unique)
├── schools
│   └── Indici: { name: 1 } (unique)
└── classes
1.3 File di Configurazione
plaintext
src/
├── .env.development (file di configurazione principale)
├── .env.example (template per configurazione)
└── config/
    └── config.js (gestione configurazione)
1.4 Variabili Ambiente Necessarie
Dotenv
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/brainScannerDB
DB_NAME=brainScannerDB

# Authentication
JWT_SECRET=<your_secret>
JWT_EXPIRES_IN=24h

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app-dev.log

# Rate Limiting
RATE_LIMIT_MAX=100
2. Migrazione Iniziale
2.1 Script di Migrazione
Location: src/database/migrations/initial-setup.js

2.2 Operazioni Eseguite
Connessione al database
Creazione collections:
users
schools
classes
Creazione indici:
Indice unique su users.email
Indice unique su schools.name
2.3 Logging
Sistema di logging configurato per tracciare:
Connessioni database
Creazione collections
Creazione indici
Errori e warning
3. Best Practices per il Team
3.1 Gestione Configurazioni
Mai committare .env o .env.development con credenziali reali
Utilizzare .env.example come template
Mantenere aggiornato .gitignore
3.2 Sicurezza
Ruotare regolarmente le credenziali MongoDB Atlas
Limitare gli accessi IP su MongoDB Atlas
Utilizzare variabili ambiente per dati sensibili
3.3 Sviluppo
Eseguire npm run migrate dopo il clone del repository
Verificare la connessione al database prima di sviluppare
Testare le queries su un dataset di test
4. Prossimi Passi
4.1 Testing
Implementare test unitari per i modelli
Creare test di integrazione per le API
Configurare un database di test separato
4.2 Monitoraggio
Implementare logging avanzato
Configurare monitoring su MongoDB Atlas
Implementare health checks
