# Guida alla Gestione Utenze

## Panoramica del Sistema

Il sistema di gestione utenze implementa un modello di controllo degli accessi basato su:

- **Ruoli**: Determinano il livello generale di accesso e responsabilità di un utente
- **Permessi**: Controllano l'accesso a risorse specifiche (utenti, scuole, classi, studenti, test, ecc.)
- **Livelli di accesso ai test**: Determinano quali test un utente può visualizzare o modificare
- **Flag di accesso amministrativo**: Controlla l'accesso al frontend amministrativo

Questo sistema multi-livello garantisce sicurezza e flessibilità, consentendo personalizzazioni precise delle autorizzazioni.

## Ruoli Utente

Il sistema prevede i seguenti ruoli:

| Ruolo | Descrizione | Livello Accesso Test | Accesso Admin |
|-------|-------------|---------------------|---------------|
| `admin` | Accesso completo a tutte le funzionalità | 0 | ✅ |
| `developer` | Accesso completo a tutto tranne finanza | 1 | ✅ |
| `manager` | Gestisce una scuola assegnata | 2 | Configurabile |
| `pcto` | Responsabile PCTO con accesso in lettura a classi/studenti | 3 | Configurabile |
| `teacher` | Insegnante con accesso alle proprie classi | 4 | Configurabile |
| `tutor` | Tutoraggio di studenti assegnati | 5 | Configurabile |
| `researcher` | Accesso in sola lettura alle analytics | 6 | Configurabile |
| `health` | Professionisti sanitari con accesso a test specifici | 7 | Configurabile |
| `student` | Accesso solo ai test assegnati | 8 | ❌ |

## Sistema di Permessi

### Permessi Predefiniti

Ogni ruolo ha un set predefinito di permessi assegnati automaticamente. Ad esempio:

- **Admin**: Accesso completo a tutte le risorse e azioni
- **Teacher**: Lettura classi/studenti assegnati, lettura/scrittura dei relativi test
- **Student**: Lettura della propria scuola e dei test assegnati

I permessi predefiniti vengono assegnati automaticamente quando:
- Si crea un nuovo utente
- Si modifica il ruolo di un utente esistente

### Permessi Granulari

I permessi granulari sono definiti tramite la combinazione di:

1. **Resource (Risorsa)**: Le entità del sistema accessibili
   - `users`, `schools`, `classes`, `students`, `tests`, `api`, `finance`, `services`, `analytics`, `materials`

2. **Actions (Azioni)**: Operazioni permesse sulla risorsa
   - `read`: Visualizzazione
   - `create`: Creazione
   - `update`: Modifica
   - `delete`: Eliminazione
   - `manage`: Gestione completa (include tutte le precedenti)

3. **Scope (Ambito)**: Limita l'accesso a sottoinsiemi specifici della risorsa
   - `all`: Tutte le risorse di quel tipo
   - `school`: Solo risorse della scuola assegnata
   - `class`: Solo risorse delle classi assegnate
   - `assigned`: Solo risorse specificamente assegnate all'utente
   - `own`: Solo risorse create/possedute dall'utente

Esempio di permesso granulare:
```
{
  "resource": "classes",
  "actions": ["read", "update"],
  "scope": "school"
}
```
Questo permette all'utente di leggere e aggiornare classi, ma solo all'interno della scuola a cui è assegnato.

### Ambiti Predefiniti per Ruolo

Il sistema assegna automaticamente ambiti (scope) predefiniti per ogni ruolo e risorsa:

| Ruolo | Ambito Predefinito | Note |
|-------|-------------------|------|
| `admin`, `developer` | `all` | Accesso completo a tutte le risorse |
| `manager`, `pcto` | `school` | Limitato alla scuola assegnata |
| `teacher` | `class` per classi/studenti<br>`school` per altre risorse | Accesso specifico alle classi assegnate |
| `tutor` | `assigned` per studenti<br>`school` per altre risorse | Accesso specifico agli studenti assegnati |
| `health` | `own` per test<br>`all` per altre risorse | Accesso solo ai propri test |
| `student` | `own` | Limitato alle risorse assegnate |

## Accesso ai Test

L'accesso ai test è regolato da un sistema di livelli numerici (0-8):

| Livello | Descrizione | Ruoli Predefiniti |
|---------|-------------|-------------------|
| 0 | Admin - Accesso a tutti i test | admin |
| 1 | Developer - Accesso a tutti i test | developer |
| 2 | Manager - Test della scuola assegnata | manager |
| 3 | PCTO - Test della scuola assegnata | pcto |
| 4 | Teacher - Test delle classi assegnate | teacher |
| 5 | Tutor - Test degli studenti assegnati | tutor |
| 6 | Researcher - Analytics | researcher |
| 7 | Health - Test specializzati | health |
| 8 | Student - Solo test assegnati | student |

Il livello di accesso viene assegnato automaticamente in base al ruolo, ma può essere personalizzato manualmente.

## Accesso al Frontend Amministrativo

Il flag `hasAdminAccess` determina se un utente può accedere al pannello amministrativo. Di default:

- Admin e Developer: Accesso automatico (true)
- Altri ruoli: Nessun accesso predefinito (false)

È possibile abilitare l'accesso al frontend amministrativo anche per altri ruoli, consentendo ad esempio a manager o insegnanti di accedere ad aree specifiche del pannello di controllo.

## Gestione delle Sessioni

Il sistema implementa una gestione avanzata delle sessioni utente:

- Ogni utente può avere fino a 5 sessioni attive contemporaneamente
- Le sessioni vengono tracciate con informazioni su dispositivo, IP, ultimo utilizzo
- Token di accesso (breve durata) e refresh (lunga durata)
- Pulizia automatica delle sessioni scadute

Le sessioni possono essere visualizzate e terminate dalla pagina di dettaglio utente.

## Flusso di Autenticazione

1. **Login**: 
   - Verifica credenziali
   - Genera token di sessione
   - Crea cookie HTTP-only per access e refresh token

2. **Verifica Token**:
   - Middleware `protect` verifica l'access token
   - Se scaduto, usa refresh token per generare nuovi token

3. **Verifica Permessi**:
   - Middleware verifica ruolo e permessi per ogni richiesta
   - Controllo basato su risorsa/azione/contesto

4. **Logout**:
   - Revoca i token
   - Termina la sessione
   - Cancella i cookie

## Interfaccia di Gestione Permessi

L'interfaccia di gestione permessi è organizzata in tre schede:

### 1. Permessi Dettagliati
Per ogni risorsa (users, schools, classes, ecc.):
- **Selezione dell'ambito**: Menu a tendina che permette di scegliere tra "Tutte le risorse", "Scuola assegnata", "Classi assegnate", "Risorse assegnate" e "Risorse proprie"
- **Selezione delle azioni**: Caselle di controllo per abilitare/disabilitare le singole azioni (read, create, update, delete, manage)

### 2. Accesso Test
- Selezione del livello di accesso ai test (0-8)
- Visualizzazione della descrizione del livello selezionato

### 3. Accesso Admin
- Attivazione/disattivazione dell'accesso al pannello amministrativo

## Guida Pratica per Amministratori

### Creazione di un Nuovo Utente

1. Navigare a "Gestione Utenti" -> "Nuovo Utente"
2. Compilare i dati richiesti:
   - Nome e Cognome
   - Email
   - Password (min. 8 caratteri)
   - Ruolo

Il sistema assegnerà automaticamente:
- Permessi predefiniti basati sul ruolo
- Livello di accesso ai test appropriato
- Flag di accesso amministrativo se necessario

### Modifica dei Permessi di un Utente

1. Navigare a "Gestione Utenti" -> Selezionare l'utente
2. Selezionare la scheda "Permessi"
3. È possibile:
   - Modificare i permessi dettagliati (risorse, azioni e ambiti)
   - Cambiare il livello di accesso ai test
   - Abilitare/disabilitare l'accesso al pannello amministrativo

#### Personalizzazione avanzata dei permessi:
1. Per ciascuna risorsa (es. "Gestione Studenti"), selezionare l'ambito desiderato dal menu a tendina
2. Spuntare le azioni che l'utente può eseguire su quella risorsa (es. read, create, update)
3. Ripetere per ogni risorsa che si desidera configurare
4. Cliccare "Salva Permessi" per applicare le modifiche

### Assegnazione Risorse a un Utente

1. Navigare a "Gestione Utenti" -> Selezionare l'utente
2. Selezionare la scheda "Risorse Assegnate"
3. È possibile assegnare:
   - Scuola (per manager, pcto, teacher, tutor, student)
   - Classi (per teacher)
   - Studenti (per tutor)

Nota: È necessario assegnare le risorse appropriate in base al ruolo dell'utente per garantire il corretto funzionamento.

### Reset dei Permessi

Se è necessario riportare i permessi di un utente ai valori predefiniti per il suo ruolo:
1. Navigare alla scheda "Permessi"
2. Cliccare sul pulsante "Reimposta"
3. Confermare l'operazione

Questo resetterà tutti i permessi, gli scope e i livelli di accesso ai valori predefiniti in base al ruolo attuale dell'utente.

### Gestione Sessioni Utente

1. Navigare a "Gestione Utenti" -> Selezionare l'utente
2. Selezionare la scheda "Sessioni"
3. Visualizzare le sessioni attive con:
   - Dispositivo/browser
   - Indirizzo IP
   - Ultimo accesso
4. Utilizzare il pulsante "Termina sessione" per revocare una sessione specifica

## Debugging Comune

### Problema: Utente non può accedere al pannello amministrativo

**Verificare**:
1. Ruolo dell'utente (Admin/Developer hanno accesso automatico)
2. Flag `hasAdminAccess` sia impostato a `true`
3. Stato utente sia `active`

### Problema: Utente non vede determinate risorse

**Verificare**:
1. Permessi granulari dell'utente (scheda Permessi)
2. Scope (ambito) impostato correttamente
3. Assegnazione corretta di scuola/classi/studenti (scheda Risorse Assegnate)
4. Livello di accesso ai test sia appropriato

### Problema: Sessione terminata inaspettatamente

**Verificare**:
1. Che non sia stata fatta una modifica alla password (invalida tutte le sessioni)
2. Che l'utente non abbia superato il limite di 5 sessioni attive
3. Lo stato dell'utente (se cambiato in "inactive" o "suspended")

## Best Practices

1. **Principio del minimo privilegio**: Assegnare sempre i permessi minimi necessari per svolgere le funzioni richieste
   - Limitare l'ambito all'area specifica (school, class, assigned) anziché assegnare "all"
   - Limitare le azioni alle operazioni realmente necessarie (evitare "manage" quando non necessario)

2. **Revisione periodica**: Controllare regolarmente gli accessi e i permessi degli utenti, soprattutto per ruoli privilegiati

3. **Separazione delle responsabilità**: Distribuire le responsabilità amministrative tra più utenti invece di creare un singolo "super admin"

4. **Registrazione e audit**: Consultare regolarmente lo storico delle modifiche per identificare anomalie

5. **Password sicure**: Richiedere password complesse e cambi regolari, specialmente per ruoli con elevati privilegi