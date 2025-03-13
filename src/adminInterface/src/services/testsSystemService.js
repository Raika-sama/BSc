import { axiosInstance } from './axiosConfig';

const BASE_URL = '/system-tests';

/**
 * Servizio per interagire con l'API dei test di sistema
 */
const testSystemService = {
  /**
   * Ottiene la lista dei test unitari disponibili
   * @param {string} repository - Nome del repository da filtrare (opzionale)
   * @returns {Promise} Promise che risolve con la lista dei test unitari
   */
  getUnitTests: (repository) => {
    return axiosInstance.get(`${BASE_URL}/unit`, {
      params: repository ? { repository } : {}
    });
  },

  /**
   * Esegue un test unitario specifico
   * @param {string} testFile - Percorso del file di test da eseguire
   * @param {string} methodName - Nome del metodo specifico da testare (opzionale)
   * @returns {Promise} Promise che risolve con i risultati del test
   */
  runUnitTest: (testFile, methodName) => {
    const requestBody = { 
      testFile,
      // Standardizziamo i parametri per garantire compatibilità
      methodName: methodName, // Usiamo methodName come parametro primario
      testNamePattern: methodName, // Mandiamo anche come testNamePattern per retrocompatibilità
    };
    
    return axiosInstance.post(`${BASE_URL}/unit/run`, requestBody);
  },

  /**
   * Esegue tutti i test unitari per un repository specifico
   * @param {string} repository - Nome del repository da testare (opzionale)
   * @returns {Promise} Promise che risolve con i risultati dei test
   */
  runAllUnitTests: (repository) => {
    const requestBody = repository ? { repository } : {};
    return axiosInstance.post(`${BASE_URL}/unit/run`, requestBody);
  },

  /**
   * Ottiene la lista dei test di integrazione disponibili
   * @param {string} repository - Nome del repository da filtrare (opzionale)
   * @returns {Promise} Promise che risolve con la lista dei test di integrazione
   */
  getIntegrationTests: (repository) => {
    return axiosInstance.get(`${BASE_URL}/integration`, {
      params: repository ? { repository } : {}
    });
  },

  /**
   * Esegue un test di integrazione specifico
   * @param {string} testFile - Percorso del file di test da eseguire
   * @param {string} methodName - Nome del metodo specifico da testare (opzionale)
   * @returns {Promise} Promise che risolve con i risultati del test
   */
  runIntegrationTest: (testFile, methodName) => {
    const requestBody = { 
      testFile,
      methodName: methodName,
      testNamePattern: methodName // Manteniamo la doppia rappresentazione per compatibilità
    };
    
    return axiosInstance.post(`${BASE_URL}/integration/run`, requestBody);
  },

  /**
   * Esegue tutti i test di integrazione
   * @param {string} repository - Nome del repository per cui eseguire i test (opzionale)
   * @returns {Promise} Promise che risolve con i risultati dei test
   */
  runAllIntegrationTests: (repository) => {
    return axiosInstance.post(`${BASE_URL}/integration/run`, repository ? { repository } : {});
  },

  /**
   * Esegue tutti i test (unitari e di integrazione)
   * @param {string} repository - Nome del repository per cui eseguire i test (opzionale)
   * @returns {Promise} Promise che risolve con i risultati dei test
   */
  runAllTests: (repository) => {
    return axiosInstance.post(`${BASE_URL}/run-all`, repository ? { repository } : {});
  },

  /**
   * Ottiene lo storico dei risultati dei test
   * @param {string} testType - Tipo di test (unit, integration, all)
   * @param {number} limit - Numero massimo di risultati da restituire
   * @returns {Promise} Promise che risolve con lo storico dei test
   */
  getTestHistory: (testType, limit = 20) => {
    return axiosInstance.get(`${BASE_URL}/history`, {
      params: { testType, limit }
    });
  },
};

export default testSystemService;