// src/utils/errors/repositoryErrorHandler.js
const logger = require('./logger/logger');
const { createError, ErrorTypes } = require('./errorTypes');

/**
 * Gestisce in modo standard gli errori generati nei repository
 * @param {Error} error - L'errore originale
 * @param {string} operation - Nome dell'operazione che ha generato l'errore
 * @param {Object} context - Dati di contesto (parametri, ID, etc.)
 * @param {string} repositoryName - Nome del repository
 * @returns {Error} Errore formattato
 */
function handleRepositoryError(error, operation, context, repositoryName) {
  // Se l'errore è già formattato (ha codice e status), lo restituiamo direttamente
  if (error.code && error.status) {
    return error;
  }
  
  // Log dettagliato dell'errore
  logger.error(`Errore in ${repositoryName}.${operation}:`, {
    errorMessage: error.message,
    errorName: error.name,
    errorCode: error.code,
    stack: error.stack,
    context
  });
  
  // Mappatura degli errori specifici MongoDB/Mongoose a ErrorTypes
  if (error.name === 'ValidationError') {
    // Errori di validazione Mongoose
    const errors = Object.values(error.errors || {}).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    return createError(
      ErrorTypes.VALIDATION.INVALID_INPUT,
      `Errore di validazione in ${operation}`,
      { errors, originalError: error.message }
    );
  } else if (error.name === 'CastError') {
    // Errori di cast (es. ObjectId non valido)
    return createError(
      ErrorTypes.VALIDATION.INVALID_FORMAT,
      `Formato non valido per ${error.path || 'un campo'} in ${operation}`,
      { field: error.path, value: error.value, originalError: error.message }
    );
  } else if (error.code === 11000) {
    // Errori di duplicazione (unique constraint)
    const field = Object.keys(error.keyPattern || {})[0] || 'un campo';
    const value = error.keyValue ? error.keyValue[field] : undefined;
    
    return createError(
      ErrorTypes.RESOURCE.ALREADY_EXISTS,
      `Valore duplicato per ${field} in ${operation}`,
      { field, value, originalError: error.message }
    );
  } else if (error.name === 'DocumentNotFoundError' || 
             (error.message && error.message.includes('not found'))) {
    // Documento non trovato
    return createError(
      ErrorTypes.RESOURCE.NOT_FOUND,
      `Risorsa non trovata in ${operation}`,
      { originalError: error.message }
    );
  } else if (error.name === 'MongoServerError') {
    // Altri errori MongoDB/Mongoose
    return createError(
      ErrorTypes.DATABASE.QUERY_FAILED,
      `Errore del database in ${operation}`,
      { dbError: error.code, originalError: error.message }
    );
  }
  
  // Errore generico non categorizzato
  return createError(
    ErrorTypes.DATABASE.QUERY_FAILED,
    `Errore in ${operation}: ${error.message}`,
    { originalError: error.message }
  );
}

module.exports = handleRepositoryError;