import { axiosInstance } from './axiosConfig';

/**
 * Servizio per la gestione delle API relative agli studenti
 */
const studentService = {
    /**
     * Recupera i test assegnati a uno studente
     * @param {string} studentId - ID dello studente
     * @returns {Promise} - Promise con la risposta
     */
    getAssignedTests: async (studentId) => {
        try {
            const response = await axiosInstance.get(`/tests/assigned/student/${studentId}`);
            console.log('Risposta test assegnati:', response.data);
            return response.data;
        } catch (error) {
            console.error('Errore nel recupero dei test assegnati:', error);
            throw error;
        }
    },

    /**
     * Revoca un test assegnato
     * @param {string} testId - ID del test da revocare
     * @returns {Promise} - Promise con la risposta
     */
    revokeTest: async (testId) => {
        try {
            const response = await axiosInstance.post(`/tests/${testId}/revoke`);
            return response.data;
        } catch (error) {
            console.error('Errore nella revoca del test:', error);
            throw error;
        }
    },

    /**
     * Recupera i test completati di uno studente
     * @param {string} studentId - ID dello studente
     * @returns {Promise} - Promise con la risposta
     */
    getCompletedTests: async (studentId) => {
        try {
            const response = await axiosInstance.get(`/tests/student/${studentId}/completed`);
            return response.data;
        } catch (error) {
            console.error('Errore nel recupero dei test completati:', error);
            throw error;
        }
    },

    /**
     * Assegna un nuovo test a uno studente
     * @param {Object} data - Dati del test
     * @returns {Promise} - Promise con la risposta
     */
    assignTest: async (data) => {
        try {
            const response = await axiosInstance.post('/tests/assign', data);
            return response.data;
        } catch (error) {
            console.error('Errore nell\'assegnazione del test:', error);
            throw error;
        }
    }
};

export default studentService;
