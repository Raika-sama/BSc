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




REPOSITORIES:
