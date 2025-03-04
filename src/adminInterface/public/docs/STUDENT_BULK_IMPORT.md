# Documentazione Tecnica: Import Massivo Studenti

## Panoramica

Questo documento descrive l'implementazione della funzionalità di import massivo studenti con assegnazione diretta alle classi nella piattaforma di test psicoattitudinali.

## Architettura

La funzionalità è implementata con un'architettura client-server:

- **Frontend**: React con Material-UI
- **Backend**: Express.js con MongoDB (Mongoose)
- **Gestione File**: XLSX.js (client), xlsx (server)

## Componenti Frontend

### 1. Loading.js

```
src/components/common/Loading.js
```

Componente di utility per mostrare stati di caricamento con le seguenti proprietà:
- `message`: Testo da mostrare
- `fullscreen`: Se true, occupa tutto lo schermo
- `size`: Dimensione del CircularProgress
- `color`: Colore del CircularProgress

### 2. ExcelPreview.js

```
src/components/students/ExcelPreview.js
```

Componente per visualizzare, validare e modificare i dati Excel prima dell'importazione.

**Props**:
- `data`: Array di oggetti studente da visualizzare
- `onConfirm`: Callback per confermare l'importazione
- `onCancel`: Callback per annullare
- `availableClasses`: Array di classi disponibili

**Funzionalità**:
- Validazione client-side
- Editor inline per i dati studente
- Assegnazione batch alle classi
- Visualizzazione stato validazione

### 3. StudentBulkImportForm.js

```
src/components/students/StudentBulkImportForm.js
```

Dialog principale per l'importazione studenti con un processo a step.

**Props**:
- `open`: Controlla la visualizzazione del dialog
- `onClose`: Callback per la chiusura

**Step**:
1. Selezione scuola e file
2. Revisione e modifica dati
3. Visualizzazione risultati

**Flusso dati**:
1. Caricamento file → parsing Excel → visualizzazione dati
2. Modifica e validazione → preparazione per API
3. Invio a backend → visualizzazione risultati

## Backend

### 1. StudentBulkImportRepository.js

```
src/repositories/StudentBulkImportRepository.js
```

Gestisce l'interazione con il database.

**Metodi principali**:
- `bulkImport`: Import standard senza assegnazione classe
- `bulkImportWithClass`: Import con assegnazione classe tramite anno e sezione

**Validazioni**:
- Unicità email
- Verifica esistenza classi
- Validazione campi obbligatori

### 2. StudentBulkImportController.js

```
src/controllers/studentBulkImportController.js
```

Controller che gestisce le richieste HTTP.

**Endpoint**:
- `bulkImport`: Importazione da file Excel
- `bulkImportWithClass`: Importazione con assegnazione classi
- `generateTemplate`: Generazione template Excel

### 3. studentRoutes.js

```
src/routes/studentRoutes.js
```

Definisce le route API.

**Route principali**:
- `POST /students/bulk-import`: Import da file
- `POST /students/bulk-import-with-class`: Import con assegnazione classi
- `GET /students/template`: Download template

## Schema Dati

### Studente

```javascript
{
  firstName: String,        // Obbligatorio
  lastName: String,         // Obbligatorio
  email: String,            // Obbligatorio, unico
  gender: String,           // Obbligatorio ('M' o 'F')
  dateOfBirth: Date,        // Obbligatorio
  fiscalCode: String,       // Opzionale
  parentEmail: String,      // Opzionale
  schoolId: ObjectId,       // Obbligatorio, riferimento a School
  classId: ObjectId,        // Opzionale, riferimento a Class
  section: String,          // Opzionale
  year: Number,             // Opzionale
  specialNeeds: Boolean,    // Opzionale
  status: String,           // Default: 'pending' o 'active' se assegnato a classe
  needsClassAssignment: Boolean, // Default: true o false se assegnato
  isActive: Boolean         // Default: true
}
```

## Flusso di Processo

1. **Frontend**:
   - Parsing file Excel lato client (XLSX.js)
   - Validazione e normalizzazione dati
   - Assegnazione classi tramite UI
   - Invio dati formato JSON al backend

2. **Backend**:
   - Validazione dati in arrivo
   - Controllo esistenza classi e disponibilità
   - Inserimento transazionale nel database
   - Aggiornamento classi con nuovi studenti
   - Risposta con dati di risultato

## API

### Import con Assegnazione Classi

**Endpoint**: `POST /api/students/bulk-import-with-class`

**Payload**:
```json
{
  "students": [
    {
      "firstName": "Mario",
      "lastName": "Rossi",
      "gender": "M",
      "dateOfBirth": "01/01/1990",
      "email": "mario.rossi@email.com",
      "fiscalCode": "RSSMRA90A01H501A",
      "parentEmail": "genitore@email.com",
      "specialNeeds": false,
      "classId": "60d21b4667d0d8992e610c85" // ID della classe (opzionale)
    }
  ],
  "schoolId": "60d21b4667d0d8992e610c84"
}
```

**Risposta**:
```json
{
  "status": "success",
  "data": {
    "imported": 1,
    "failed": 0,
    "errors": []
  }
}
```

## Gestione Errori

### Frontend
- Validazione client-side con feedback immediato
- Visualizzazione errori dal backend
- Gestione errori di rete

### Backend
- Errori di validazione con dettagli specifici
- Errori di database con rollback transazionale
- Logging dettagliato per il debug

## Sicurezza

- Controllo accessi basato su ruoli (solo admin)
- Validazione input per prevenire injection
- Sanitizzazione dati in input/output
- Protezione contro attacchi CSRF

## Testing

### Unit Test
- Validazione dati
- Parsing Excel
- Normalizzazione dati

### Integration Test
- Importazione studenti
- Assegnazione classi
- Gestione duplicati

## Performance

- Parsing Excel lato client per ridurre carico server
- Elaborazione batch lato server
- Uso di transazioni MongoDB
- Indici ottimizzati per query veloci

## Configurazione

Per abilitare questa funzionalità, assicurarsi che:

1. Tutte le dipendenze siano installate:
   ```
   npm install xlsx
   ```

2. I modelli MongoDB siano aggiornati con i campi richiesti

3. Gli middleware di validazione siano configurati correttamente

## Note per lo Sviluppo Futuro

1. Implementare l'importazione di file CSV oltre a Excel
2. Aggiungere supporto per l'importazione di foto studenti
3. Implementare un sistema di notifica email post-importazione
4. Aggiungere funzionalità di esportazione dati studenti