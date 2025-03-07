import { axiosInstance } from './axiosConfig';

const BASE_URL = '/system-tests';

/**
 * Servizio per interagire con l'API dei test di sistema
 */
const testSystemService = {
  /**
   * Ottiene la lista dei test unitari disponibili
   * @returns {Promise} Promise che risolve con la lista dei test unitari
   */
  getUnitTests: () => {
    return axiosInstance.get(`${BASE_URL}/unit`);
  },

  /**
   * Esegue un test unitario specifico
   * @param {string} testFile - Percorso del file di test da eseguire
   * @returns {Promise} Promise che risolve con i risultati del test
   */
  runUnitTest: (testFile) => {
    // Modifica: Passa testFile nel corpo della richiesta anziché come parametro di query
    return axiosInstance.post(`${BASE_URL}/unit/run`, { testFile });
  },

  /**
   * Esegue tutti i test unitari
   * @returns {Promise} Promise che risolve con i risultati dei test
   */
  runAllUnitTests: () => {
    return axiosInstance.post(`${BASE_URL}/unit/run`);
  },

  /**
   * Ottiene la lista dei test di integrazione disponibili
   * @returns {Promise} Promise che risolve con la lista dei test di integrazione
   */
  getIntegrationTests: () => {
    return axiosInstance.get(`${BASE_URL}/integration`);
  },

  /**
   * Esegue un test di integrazione specifico
   * @param {string} testFile - Percorso del file di test da eseguire
   * @returns {Promise} Promise che risolve con i risultati del test
   */
  runIntegrationTest: (testFile) => {
    // Modifica: Passa testFile nel corpo della richiesta anziché come parametro di query
    return axiosInstance.post(`${BASE_URL}/integration/run`, { testFile });
  },

  /**
   * Esegue tutti i test di integrazione
   * @returns {Promise} Promise che risolve con i risultati dei test
   */
  runAllIntegrationTests: () => {
    return axiosInstance.post(`${BASE_URL}/integration/run`);
  },

  /**
   * Esegue tutti i test (unitari e di integrazione)
   * @returns {Promise} Promise che risolve con i risultati dei test
   */
  runAllTests: () => {
    return axiosInstance.post(`${BASE_URL}/run-all`);
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