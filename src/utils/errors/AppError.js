/**
 * @file AppError.js
 * @description Classe base per la gestione degli errori dell'applicazione.
 * Estende la classe Error nativa e aggiunge funzionalità per la gestione
 * degli errori HTTP e operativi.
 */

class AppError extends Error {
    /**
     * Crea una nuova istanza di AppError
     * @param {string} message - Messaggio di errore
     * @param {number} statusCode - Codice di stato HTTP
     * @param {string} errorCode - Codice errore interno dell'applicazione
     * @param {Object} [metadata] - Metadati aggiuntivi dell'errore
     */
    constructor(message, statusCode, errorCode, metadata = {}) {
      super(message);
  
      // Proprietà base
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.errorCode = errorCode;
      this.metadata = metadata;
  
      // Flag per errori operativi vs programmazione
      this.isOperational = true;
  
      // Aggiunge info stack trace
      Error.captureStackTrace(this, this.constructor);
  
      // Timestamp errore
      this.timestamp = new Date();
    }
  
    /**
     * Converte l'errore in un oggetto per la risposta API
     * @returns {Object} Oggetto formattato per la risposta
     */
    toJSON() {
      return {
        success: false,
        error: {
          message: this.message,
          code: this.errorCode,
          status: this.statusCode,
          ...(Object.keys(this.metadata).length > 0 && { metadata: this.metadata })
        }
      };
    }
  
    /**
     * Verifica se l'errore è operativo (gestibile)
     * @returns {boolean}
     */
    isOperationalError() {
      return this.isOperational;
    }
  }
  
  // Esporta la classe
  module.exports = AppError;