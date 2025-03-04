# Sistema di Assegnazione Test

## Panoramica
Questo documento descrive l'implementazione del nuovo sistema di assegnazione test agli studenti. Il sistema permette ai docenti di assegnare test direttamente agli studenti tramite il loro account, eliminando la necessità di generare e condividere token/link.

## Componenti sviluppati

1. **AssignedTestsList**  
   Visualizza l'elenco dei test assegnati a uno studente ma non ancora completati.

2. **AssignTestDialog**  
   Dialog per assegnare un nuovo test allo studente.

3. **AssignedTestDetails**  
   Visualizza i dettagli di un test assegnato, inclusa la configurazione e lo stato.

4. **useAssignedTests**  
   Hook personalizzato per gestire la logica dei test assegnati (caricamento, assegnazione, revoca).

5. **TestsTab (aggiornato)**  
   Componente principale modificato per gestire sia i test assegnati che quelli completati attraverso un sistema di tab.

## Implementazione backend necessaria

Per supportare queste funzionalità frontend, è necessario implementare le seguenti API backend:

### 1. Assegnazione di un test
```
POST /tests/assign
{
  "testType": "CSI",
  "studentId": "id-dello-studente",
  "config": {
    "tempoLimite": 30,
    "tentativiMax": 1,
    "randomizzaDomande": true,
    "mostraRisultatiImmediati": false
  }
}
```

### 2. Ottenere i test assegnati a uno studente
```
GET /tests/assigned/student/:studentId
```

### 3. Revocare un test assegnato
```
POST /tests/:testId/revoke
```

## Integrazione con il modello esistente

Il modello `Test` dovrebbe già avere i campi necessari per supportare questo sistema:
- `studentId`: ID dello studente a cui è assegnato il test
- `status`: Stato del test ('pending', 'in_progress', 'completed')
- `assignedAt`: Data di assegnazione
- `assignedBy`: Riferimento all'utente che ha assegnato il test
- `configurazione`: Configurazione del test

## Modifiche al modello Result (future)

In futuro, si consiglia di separare i campi specifici del test CSI in un modello dedicato, utilizzando il pattern discriminatore di Mongoose che è già implementato.

## Flusso di lavoro

1. Il docente entra nella pagina dello studente
2. Seleziona la tab "Test assegnati"
3. Clicca su "Assegna nuovo test"
4. Seleziona il tipo di test e conferma
5. Il test viene assegnato e mostrato nella lista dei test assegnati
6. Lo studente accede alla piattaforma e vede il test assegnato
7. Quando lo studente completa il test, questo appare nella tab "Test completati"

## Prossimi passi

1. Implementare le API backend necessarie
2. Testare l'integrazione tra frontend e backend
3. Sviluppare l'interfaccia utente per gli studenti per accedere e completare i test
4. Implementare la logica di calcolo e salvataggio dei risultati

## Note per l'installazione

Per integrare questi componenti nel progetto esistente:

1. Creare i nuovi file nei percorsi appropriati
2. Importare e utilizzare il componente `TestsTab` aggiornato nel posto della versione precedente
3. Verificare che tutti i percorsi di importazione siano corretti
4. Implementare le API backend necessarie