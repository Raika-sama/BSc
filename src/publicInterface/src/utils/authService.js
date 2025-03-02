import axios from 'axios';

// Manteniamo il prefisso /api/v1 come richiesto dal backend
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
      console.log(`Dati inviati:`, { username, password: '******' });
      
      const response = await axios.post(`${API_URL}/student-auth/login`, {
        username,
        password
      }, {
        withCredentials: true // Importante per gestire i cookie
      });
      
      console.log('Risposta completa:', response);
      console.log('Risposta ricevuta:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataStructure: Object.keys(response.data || {}),
        isFirstAccess: response.data?.data?.isFirstAccess,
        hasStudent: !!response.data?.data?.student
      });
      
      // Caso 1: Risposta di primo accesso
      if (response.data?.data?.isFirstAccess) {
        return {
          isFirstAccess: true,
          studentId: response.data.data?.studentId || '',
          message: 'Devi cambiare la password al primo accesso'
        };
      }
      
      // Caso 2: Risposta con student nella data.data
      if (response.data?.data?.student) {
        localStorage.setItem('student', JSON.stringify(response.data.data.student));
        return {
          success: true,
          data: {
            student: response.data.data.student
          }
        };
      }
      
      // Caso 3: Risposta con student nella data
      if (response.data?.student) {
        localStorage.setItem('student', JSON.stringify(response.data.student));
        return {
          success: true,
          data: {
            student: response.data.student
          }
        };
      }
      
      // Caso 4: Risposta senza student ma con successo (supponiamo che lo student sia nel cookie)
      if (response.data?.success || response.data?.status === 'success') {
        // Proviamo a recuperare lo studente dal localStorage esistente o impostiamo un valore provvisorio
        const existingStudent = localStorage.getItem('student');
        if (!existingStudent) {
          // Crea uno studente provvisorio con l'email fornita
          const provisionalStudent = {
            email: username,
            firstName: 'Utente',
            lastName: 'Temporaneo'
          };
          localStorage.setItem('student', JSON.stringify(provisionalStudent));
        }
        
        return {
          success: true,
          data: {
            student: JSON.parse(localStorage.getItem('student'))
          }
        };
      }
      
      // Fallback: restituisci la risposta così com'è
      return response.data;
    } catch (error) {
      console.error('Errore durante il login:', error);
      
      // Migliore gestione degli errori
      if (error.response) {
        // Errore con risposta dal server (4xx o 5xx)
        console.error('Dettagli risposta:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Formatta un messaggio di errore più chiaro in base allo status code
        const errorMessage = 
          error.response.status === 401 ? 'Credenziali non valide' :
          error.response.status === 403 ? 'Accesso non autorizzato' :
          error.response.status === 404 ? 'Servizio di autenticazione non disponibile' :
          error.response.status === 500 ? 'Errore interno del server' :
          'Errore durante il login';
        
        throw { error: errorMessage, details: error.response.data };
      } else if (error.request) {
        // Errore senza risposta dal server (problemi di connessione)
        console.error('Nessuna risposta ricevuta:', error.request);
        throw { error: 'Il server non risponde, verifica la tua connessione' };
      } else {
        // Errore nella configurazione della richiesta
        console.error('Errore di configurazione:', error.message);
        throw { error: 'Errore durante la configurazione della richiesta' };
      }
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
      console.log(`Tentativo di primo accesso per lo studente: ${studentId}`);
      
      const response = await axios.post(`${API_URL}/student-auth/student/first-access/${studentId}`, {
        temporaryPassword,
        newPassword
      }, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Errore durante il primo accesso:', error);
      
      if (error.response) {
        console.error('Dettagli risposta:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Formatta un messaggio di errore più chiaro
        const errorMessage = 
          error.response.status === 401 ? 'Password temporanea non valida' :
          error.response.status === 403 ? 'Accesso non autorizzato' :
          error.response.status === 404 ? 'Studente non trovato' :
          error.response.status === 500 ? 'Errore interno del server' :
          'Errore durante il cambio password';
        
        throw { error: errorMessage, details: error.response.data };
      } else if (error.request) {
        throw { error: 'Il server non risponde, verifica la tua connessione' };
      } else {
        throw { error: 'Errore durante la configurazione della richiesta' };
      }
    }
  },
  
  /**
   * Effettua il logout dello studente
   * @returns {Promise}
   */
  logout: async () => {
    try {
      console.log('Tentativo di logout...');
      
      // Prima ottieni i dati dello studente dal localStorage per poterli mostrare nei log
      const studentData = localStorage.getItem('student');
      const studentInfo = studentData ? JSON.parse(studentData) : null;
      console.log('Logout per studente:', studentInfo?.email || 'Nessuno studente autenticato');
      
      // Prima rimuovi i dati locali
      localStorage.removeItem('student');
      localStorage.removeItem('lastTestAttempt');
      localStorage.removeItem('menuPosition');
      
      // Rimuovi i cookie di sessione
      document.cookie = 'student-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Poi chiama l'API di logout
      const response = await axios.post(`${API_URL}/student-auth/logout`, {}, {
        withCredentials: true
      });
      
      console.log('Risposta logout dal server:', response.data);
      console.log('Logout completato con successo');
      
      return {
        success: true,
        message: 'Logout effettuato con successo'
      };
    } catch (error) {
      console.error('Errore durante il logout:', error);
      
      // Anche in caso di errore, consideriamo il logout come riuscito localmente
      console.log('Dati di sessione rimossi localmente nonostante l\'errore');
      
      return {
        success: true,
        message: 'Logout effettuato localmente'
      };
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