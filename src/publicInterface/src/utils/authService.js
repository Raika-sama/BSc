import axios from 'axios';

// Aggiornato con il prefisso /api/v1 per corrispondere alla configurazione del backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

/**
 * Servizio per gestire l'autenticazione degli studenti
 */
const authService = {
  /**
   * Effettua il login dello studente
   * @param {string} username - Email dello studente
   * @param {string} password - Password dello studente
   * @returns {Promise} Promise con i dati dell'utente
   */
  login: async (username, password) => {
    try {
      console.log(`Tentativo di login su: ${API_URL}/student-auth/login`);
      const response = await axios.post(`${API_URL}/student-auth/login`, {
        username,
        password
      }, {
        withCredentials: true // Importante per gestire i cookie
      });
      
      if (response.data.data?.isFirstAccess) {
        // Caso speciale: primo accesso, necessario cambio password
        return {
          isFirstAccess: true,
          message: 'Devi cambiare la password al primo accesso'
        };
      }
      
      // Salva info studente in localStorage
      if (response.data.data?.student) {
        localStorage.setItem('student', JSON.stringify(response.data.data.student));
      }
      
      return response.data;
    } catch (error) {
      console.error('Errore durante il login:', error);
      console.error('Dettagli risposta:', error.response?.data);
      throw error.response?.data || { error: 'Errore di connessione al server' };
    }
  },
  
  /**
   * Gestisce il primo accesso e cambio password
   * @param {string} studentId - ID dello studente
   * @param {string} temporaryPassword - Password temporanea
   * @param {string} newPassword - Nuova password
   * @returns {Promise}
   */
  handleFirstAccess: async (studentId, temporaryPassword, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/student-auth/student/first-access/${studentId}`, {
        temporaryPassword,
        newPassword
      }, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Errore durante il primo accesso:', error);
      throw error.response?.data || { error: 'Errore di connessione al server' };
    }
  },
  
  /**
   * Effettua il logout dello studente
   * @returns {Promise}
   */
  logout: async () => {
    try {
      const response = await axios.post(`${API_URL}/student-auth/student/logout`, {}, {
        withCredentials: true
      });
      
      // Rimuovi dati studente dal localStorage
      localStorage.removeItem('student');
      
      return response.data;
    } catch (error) {
      console.error('Errore durante il logout:', error);
      // Rimuovi comunque i dati locali anche in caso di errore
      localStorage.removeItem('student');
      throw error.response?.data || { error: 'Errore di connessione al server' };
    }
  },
  
  /**
   * Verifica se lo studente è attualmente autenticato
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('student');
  },
  
  /**
   * Recupera i dati dello studente dal localStorage
   * @returns {Object|null}
   */
  getStudent: () => {
    const studentData = localStorage.getItem('student');
    return studentData ? JSON.parse(studentData) : null;
  }
};

export default authService;