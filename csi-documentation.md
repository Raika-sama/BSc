# CSI Engine Documentation

## 1. Panoramica
Il CSI (Cognitive Style Inventory) Engine è un microservizio specializzato per la gestione dei test cognitivi. L'architettura è progettata seguendo i principi di Clean Architecture e Separation of Concerns.

## 2. Struttura del Progetto

### 2.1 Core Components
- `CSIEngine.js`: Motore principale che orchestrata l'esecuzione del test
- `CSIScorer.js`: Gestisce la logica di scoring e valutazione
- `CSIConfig.js`: Configurazione centralizzata del sistema

### 2.2 Data Layer
#### Models
- `CSIQuestion.js`: Schema domande del test
  - Gestisce metadata, versioning e validazione
  - Supporta la categorizzazione delle domande
  - Integra la gestione dei pesi e della polarità

- `Result.js`: Schema risultati test
  - Schema base comune per tutti i test
  - Schema specifico per CSI con dimensioni cognitive
  - Gestione del lifecycle del test

#### Repositories
- `CSIRepository.js`: 
  - Gestione CRUD per i risultati CSI
  - Calcolo punteggi
  - Analisi pattern di risposta

- `CSIQuestionRepository.js`:
  - Gestione domande e versioning
  - Query ottimizzate per recupero domande
  - Gestione metadata e tag

### 2.3 Service Layer
- `CSIQuestionService.js`:
  - Logica business per la gestione domande
  - Validazione input
  - Formattazione dati

### 2.4 Controller Layer
- `CSIController.js`:
  - Gestione richieste HTTP
  - Orchestrazione flusso test
  - Gestione errori e risposte

- `CSIQuestionController.js`:
  - Gestione CRUD domande
  - Validazione input
  - Gestione versioning

### 2.5 Routes
- `csi.routes.js`:
  - Route pubbliche (token-based)
  - Route protette (auth-based)
  - Middleware di validazione

- `csi.question.routes.js`:
  - Route amministrative per domande
  - Protezione accessi
  - Validazione input

## 3. Flussi Principali

### 3.1 Esecuzione Test
```
Flusso Dettagliato di Esecuzione Test
3.1 Inizializzazione
mermaidCopygraph TD
    A[Richiesta Test] --> B{Verifica Token}
    B -->|Valido| C[Load Configurazione]
    B -->|Non Valido| Z[Errore]
    C --> D[Prepara Domande]
    D --> E[Inizializza Sessione]
    E --> F[Return Setup]
3.2 Gestione Risposte

Validazione Risposta

Verifica range valori (1-5)
Analisi tempo risposta
Check sequenza domande


Processing Risposta
javascriptCopy{
  questionId: number,    // ID domanda
  value: number,         // Valore risposta (1-5)
  timeSpent: number,     // Tempo impiegato (ms)
  metadata: {           // Metadata risposta
    browser: string,
    device: string,
    timestamp: Date
  }
}

Analisi Pattern

Tempo medio risposta
Consistenza pattern
Flag risposte sospette



3.3 Completamento Test

Validazione Finale

Completezza risposte
Validità pattern
Check tempi totali


Calcolo Score
javascriptCopy{
  elaborazione: {
    score: number,
    level: string,
    interpretation: string
  },
  creativita: {/*...*/},
  preferenzaVisiva: {/*...*/},
  decisione: {/*...*/},
  autonomia: {/*...*/}
}

Generazione Report

Punteggi dimensioni
Pattern analisi
Raccomandazioni
Metadata sessione



3.4 Post-Processing

Salvataggio Risultati

Database persistente
Backup sicuro
Audit trail


Notifiche

Studente
Docente
Sistema


Analytics Update

Aggiornamento statistiche
Pattern detection
Performance metrics
```

## 4. Features Chiave

### 4.1 Scoring System
- Calcolo punteggi multidimensionali
- Analisi pattern di risposta
- Validazione consistenza
- Interpretazione risultati

### 4.2 Validation System
- Validazione input strutturata
- Controllo consistenza dati
- Validazione token
- Gestione errori granulare

### 4.3 Metadata Management
Metadata Management System
4.3.1 Struttura Metadata
javascriptCopy{
  // Metadata domanda
  metadata: {
    polarity: '+' | '-',      // Influenza scoring
    weight: number,           // Peso nella valutazione (0-5)
    difficultyLevel: string,  // facile|medio|difficile
    tags: string[],          // Tag per categorizzazione
    notes: string,           // Note amministrative
    lastReviewDate: Date     // Ultima revisione
  },

  // Metadata risultati
  metadataCSI: {
    versioneAlgoritmo: string,
    calcolatoIl: Date,
    pattern: {
      isValid: boolean,
      consistency: boolean,
      timePattern: {
        averageTime: number,
        suspicious: boolean,
        tooFastResponses: number
      }
    },
    profiloCognitivo: {
      stiliDominanti: string[],
      raccomandazioni: string[]
    }
  }
}
4.3.2 Gestione Versioning

Ogni modifica ai metadata incrementa la versione
Track delle modifiche per audit
Possibilità di rollback

4.3.3 Validazione Metadata
javascriptCopy// Esempio validazione
static validateMetadata(metadata) {
    if (!metadata.polarity || !this.POLARITY_VALUES.includes(metadata.polarity)) {
        throw new Error('Polarità deve essere + o -');
    }
    if (metadata.weight && (metadata.weight < 0 || metadata.weight > 5)) {
        throw new Error('Peso deve essere tra 0 e 5');
    }
}

## 5. Sicurezza e Performance

### 5.1 Sicurezza
- Autenticazione token-based
- RBAC (Role-Based Access Control)
- Validazione input
- Sanitizzazione dati

### 5.2 Performance
- Caching risultati
- Query ottimizzate
- Aggregazioni efficienti
- Gestione concorrenza

## 6. Best Practices Implementate

### 6.1 Coding Standards
- Separation of Concerns
- Dependency Injection
- Error Handling centralizzato
- Logging strutturato

### 6.2 Data Management
- Schema validation
- Versioning
- Soft delete
- Audit trail

## 7. Testing e Debugging
- Test unitari per ogni layer
- Log dettagliati
- Error tracking
- Monitoring metriche

## 8. Future Improvements
1. Implementazione cache distribuita
2. Sistema di recovery sessioni
3. Analytics avanzate
4. A/B testing domande
5. Machine Learning per pattern detection

## 9. API Documentation
API Documentation
9.1 Public Routes (Token-based)
CopyGET /api/v1/tests/csi/verify/:token
- Verifica validità token test
- Richiede: token nel path
- Risposta: { valid: boolean, expiresAt: Date, test: TestData }

POST /api/v1/tests/csi/:token/start
- Inizia una nuova sessione di test
- Richiede: token nel path
- Risposta: { questions: Question[], config: ConfigData }

POST /api/v1/tests/csi/:token/answer
- Sottomette una risposta
- Richiede: 
  {
    questionId: number,
    value: number (1-5),
    timeSpent: number (ms)
  }
- Risposta: { answered: number, remaining: number }

POST /api/v1/tests/csi/:token/complete
- Completa il test
- Richiede: token nel path
- Risposta: { testCompleted: boolean, resultId: string }
9.2 Protected Routes (Auth-based)
CopyPOST /api/v1/tests/csi/generate-link
- Genera nuovo link test
- Richiede: { studentId: string }
- Risposta: { token: string, url: string, expiresAt: Date }

GET /api/v1/tests/csi/questions
- Lista tutte le domande attive
- Query params: { page, limit, category, difficulty }
- Risposta: { questions: Question[], pagination: PaginationData }

PUT /api/v1/tests/csi/questions/:id
- Aggiorna una domanda
- Richiede: {
    testo: string,
    categoria: string,
    metadata: {
      polarity: '+' | '-',
      weight: number,
      difficultyLevel: string,
      tags: string[]
    }
  }
- Risposta: { question: Question }

GET /api/v1/tests/csi/questions/metadata/tags
- Recupera tutti i tag disponibili
- Risposta: { tags: string[] }