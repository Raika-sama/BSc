# Documentazione Tecnica: Sistema di Gestione Anni Accademici

## Panoramica Architetturale

Il sistema di gestione degli anni accademici è progettato per consentire la pianificazione, attivazione e archiviazione degli anni scolastici all'interno della piattaforma, con una gestione flessibile delle sezioni e la creazione automatica delle classi associate.

### Componenti Principali

#### 1. Modello Dati
- **School**: Contiene gli anni accademici e le sezioni
- **AcademicYear**: Rappresenta un anno scolastico con stato (pianificato, attivo, archiviato)
- **Section**: Rappresenta una sezione (A, B, C, ecc.) che può essere attivata/disattivata per ogni anno
- **Class**: Rappresenta un'istanza di classe per un anno e sezione specifici (es. 1A 2024/2025)

#### 2. Backend
- **SchoolRepository**: Gestisce le operazioni sul database relative agli anni accademici
- **SchoolController**: Espone le API per la gestione degli anni accademici
- **Routes**: Definisce gli endpoint per interagire con gli anni accademici

#### 3. Frontend
- **SchoolContext**: Provider React che gestisce lo stato e le chiamate API
- **AcademicYearsTab**: Componente React che visualizza e permette la gestione degli anni accademici

## Flusso Dati

### Creazione Anno Accademico
1. L'utente compila il form con i dati dell'anno accademico
2. Se selezionata, vengono create sezioni temporanee nell'interfaccia
3. Al submit del form:
   - Le sezioni temporanee vengono create nel database
   - L'anno accademico viene creato con riferimento alle sezioni selezionate
   - Le classi vengono generate automaticamente per ogni sezione selezionata

### Attivazione Anno Accademico
1. L'utente clicca sul pulsante di attivazione
2. Il sistema disattiva l'anno correntemente attivo (se presente)
3. L'anno selezionato viene impostato come attivo

### Archiviazione Anno Accademico
1. L'utente clicca sul pulsante di archiviazione
2. L'anno viene archiviato
3. Se era l'anno attivo, viene automaticamente attivato l'anno pianificato più recente (se presente)

## Schema di Database

### Collezione School
```javascript
{
  // Altri campi della scuola...
  academicYears: [
    {
      _id: ObjectId,
      year: String, // formato "YYYY/YYYY"
      status: String, // "planned", "active", "archived"
      startDate: Date,
      endDate: Date,
      createdAt: Date,
      createdBy: ObjectId // riferimento a User
    }
  ],
  sections: [
    {
      _id: ObjectId,
      name: String, // Lettera maiuscola (A-Z)
      isActive: Boolean,
      maxStudents: Number,
      academicYears: [
        {
          year: String, // riferimento a academicYear.year
          status: String, // "active", "planned", "archived"
          maxStudents: Number,
          activatedAt: Date
        }
      ],
      createdAt: Date
    }
  ]
}
```

### Collezione Class
```javascript
{
  _id: ObjectId,
  schoolId: ObjectId,
  year: Number, // anno di corso (1, 2, 3, 4, 5)
  section: String, // riferimento a section.name
  academicYear: String, // riferimento a academicYear.year
  status: String, // "active", "planned", "archived"
  capacity: Number,
  students: [
    // elenco studenti...
  ],
  mainTeacher: ObjectId,
  // altri campi...
}
```

## API Endpoints

### 1. Gestione Anni Accademici
- `GET /schools/:id/academic-years` - Ottieni tutti gli anni accademici
- `POST /schools/:id/academic-years` - Crea un nuovo anno accademico
- `POST /schools/:id/academic-years/:yearId/activate` - Attiva un anno accademico
- `POST /schools/:id/academic-years/:yearId/archive` - Archivia un anno accademico

### 2. Gestione Classi per Anno Accademico
- `GET /schools/:id/classes?academicYear=YYYY/YYYY` - Ottieni le classi per un anno accademico

### 3. Gestione Sezioni
- `POST /schools/:id/sections` - Crea una nuova sezione

## Logica di Business Cruciale

### 1. Suggerimento Anno Accademico
```javascript
const suggestAcademicYear = (currentActiveYear) => {
  // Logica per determinare l'anno da suggerire
  // Se non c'è un anno attivo -> suggerire l'anno corrente
  // Se l'anno attivo è quello corrente -> suggerire l'anno successivo
  // Se l'anno attivo è precedente -> suggerire l'anno corrente
}
```

### 2. Creazione Classi per Sezioni Selezionate
```javascript
// Nel repository
async setupAcademicYear(schoolId, yearData, createClasses) {
  // Crea anno accademico...
  
  if (createClasses) {
    // Filtra sezioni selezionate
    // Per ogni sezione selezionata:
    //   Crea configurazione anno nella sezione
    //   Crea classi per ogni anno di corso (1-5 o 1-3)
  }
}
```

### 3. Attivazione Anno Accademico
```javascript
async activateAcademicYear(schoolId, yearId) {
  // Trova l'anno attivo corrente
  // Imposta il suo stato a "archived"
  // Imposta il nuovo anno a "active"
}
```

## Gestione Stato Frontend

Lo stato è gestito principalmente tramite:
- **useState** per lo stato locale del componente
- **useEffect** per caricare i dati iniziali
- **SchoolContext** per gestire le chiamate API e condividere i dati

## Sicurezza e Validazione

- Tutti gli endpoint richiedono autenticazione
- Le operazioni administrative (es. attivazione/disattivazione) richiedono permessi di admin
- Validazione dei formati (es. anno in formato "YYYY/YYYY")
- Validazione delle date (inizio precedente a fine)
- Controlli di coerenza (es. evitare duplicati di anni)

## Gestione Errori

- Errori di validazione → messaggi specifici all'utente
- Errori di database → log dettagliati e messaggi generici all'utente
- Transazioni Mongoose per garantire l'atomicità delle operazioni complesse

## Performance e Ottimizzazione

- Uso di sessioni Mongoose per operazioni correlate
- Query mirate con select/projection per limitare i dati trasferiti
- Loading states per migliorare l'esperienza utente durante operazioni lunghe