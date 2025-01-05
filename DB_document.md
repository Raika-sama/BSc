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