/**
 * Utility per la formattazione di dati
 */

/**
 * Formatta una data in formato leggibile italiano
 * @param {string|Date} date - La data da formattare (stringa ISO o oggetto Date)
 * @param {boolean} includeTime - Se includere anche l'orario
 * @returns {string} Data formattata
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Data non valida';
    }
    
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('it-IT', options);
  } catch (error) {
    console.error('Errore nella formattazione della data:', error);
    return 'Errore data';
  }
};

/**
 * Formatta un numero come valuta (Euro)
 * @param {number} value - Il valore da formattare
 * @returns {string} La stringa formattata come valuta
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

/**
 * Formatta un numero con separatore delle migliaia
 * @param {number} value - Il numero da formattare
 * @param {number} decimals - Numero di decimali da mostrare
 * @returns {string} Il numero formattato
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('it-IT', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
};

/**
 * Tronca un testo se supera la lunghezza massima
 * @param {string} text - Il testo da troncare
 * @param {number} maxLength - La lunghezza massima
 * @returns {string} Il testo troncato con '...' se necessario
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Converte il primo carattere di una stringa in maiuscolo
 * @param {string} str - La stringa da trasformare
 * @returns {string} La stringa con il primo carattere maiuscolo
 */
export const capitalizeFirst = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default {
  formatDate,
  formatCurrency,
  formatNumber,
  truncateText,
  capitalizeFirst
};