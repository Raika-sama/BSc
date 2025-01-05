/**
 * @file errorTypes.js
 * @description Definizione dei tipi di errore standard dell'applicazione.
 * Ogni errore ha un codice univoco, un messaggio di default e un codice HTTP.
 */

const ErrorTypes = {
    // Errori di Autenticazione (AUTH_) - 401, 403
    AUTH: {
        INVALID_CREDENTIALS: {
            code: 'AUTH_001',
            message: 'Credenziali non valide',
            status: 401
        },
        TOKEN_EXPIRED: {
            code: 'AUTH_002',
            message: 'Token scaduto',
            status: 401
        },
        TOKEN_INVALID: {
            code: 'AUTH_003',
            message: 'Token non valido',
            status: 401
        },
        UNAUTHORIZED: {
            code: 'AUTH_004',
            message: 'Non autorizzato',
            status: 401
        },
        FORBIDDEN: {
            code: 'AUTH_005',
            message: 'Accesso negato',
            status: 403
        }
    },

    // Errori di Validazione (VAL_) - 400
    VALIDATION: {
        INVALID_INPUT: {
            code: 'VAL_001',
            message: 'Dati di input non validi',
            status: 400
        },
        MISSING_FIELD: {
            code: 'VAL_002',
            message: 'Campo obbligatorio mancante',
            status: 400
        },
        INVALID_FORMAT: {
            code: 'VAL_003',
            message: 'Formato non valido',
            status: 400
        }
    },

    // Errori di Risorsa (RES_) - 404, 409
    RESOURCE: {
        NOT_FOUND: {
            code: 'RES_001',
            message: 'Risorsa non trovata',
            status: 404
        },
        ALREADY_EXISTS: {
            code: 'RES_002',
            message: 'Risorsa già esistente',
            status: 409
        },
        CONFLICT: {
            code: 'RES_003',
            message: 'Conflitto con risorsa esistente',
            status: 409
        }
    },

    // Errori di Business Logic (BUS_) - 422
    BUSINESS: {
        INVALID_OPERATION: {
            code: 'BUS_001',
            message: 'Operazione non valida',
            status: 422
        },
        PRECONDITION_FAILED: {
            code: 'BUS_002',
            message: 'Prerequisiti non soddisfatti',
            status: 422
        },
        SCHOOL_REQUIRED: {
            code: 'BUS_003',
            message: 'Scuola non associata',
            status: 422
        },
        CLASS_FULL: {
            code: 'BUS_004',
            message: 'Classe al completo',
            status: 422
        }
    },

    // Errori di Database (DB_) - 500
    DATABASE: {
        QUERY_FAILED: {
            code: 'DB_001',
            message: 'Errore di query database',
            status: 500
        },
        CONNECTION_ERROR: {
            code: 'DB_002',
            message: 'Errore di connessione al database',
            status: 500
        },
        TRANSACTION_FAILED: {
            code: 'DB_003',
            message: 'Transazione fallita',
            status: 500
        }
    },

    // Errori di Sistema (SYS_) - 500
    SYSTEM: {
        INTERNAL_ERROR: {
            code: 'SYS_001',
            message: 'Errore interno del server',
            status: 500
        },
        SERVICE_UNAVAILABLE: {
            code: 'SYS_002',
            message: 'Servizio non disponibile',
            status: 503
        },
        EXTERNAL_SERVICE_ERROR: {
            code: 'SYS_003',
            message: 'Errore servizio esterno',
            status: 502
        }
    }
};

/**
 * Funzione helper per creare un errore con metadati aggiuntivi
 * @param {Object} errorType - Tipo di errore da ErrorTypes
 * @param {string} [customMessage] - Messaggio personalizzato opzionale
 * @param {Object} [metadata] - Metadati aggiuntivi
 * @returns {Object} Oggetto errore configurato
 */
const createError = (errorType, customMessage = null, metadata = {}) => ({
    ...errorType,
    message: customMessage || errorType.message,
    metadata
});

module.exports = {
    ErrorTypes,
    createError
};