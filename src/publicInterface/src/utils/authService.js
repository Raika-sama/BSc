import axios from 'axios';

// Configurazione base dell'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

/**
 * Servizio per gestire l'autenticazione degli studenti
 */
const authService = {
  /**
   * Salva i dati dello studente nel localStorage
   * @param {Object} studentData - I dati dello studente da salvare
   */
  saveStudentData: (studentData) => {
    if (!studentData) return;
    
    try {
      // Salva l'oggetto studente completo
      localStorage.setItem('student', JSON.stringify(studentData));
      
      // Salva l'ID separatamente per un accesso più veloce
      // Usa _id come standard
      const studentId = studentData._id || studentData.id;
      if (studentId) {
        localStorage.setItem('studentId', studentId);
        console.log('ID studente salvato:', studentId);
      } else {
        console.warn('ID studente non trovato nei dati:', studentData);
      }
    } catch (error) {
      console.error('Errore nel salvataggio dei dati studente:', error);
    }
  },
  
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
      console.log('Dati risposta:', response.data);
      
      // Verifica se la risposta è nel formato standardizzato
      if (!response.data || response.data.status !== 'success') {
        console.error('Risposta non valida o con errori dal server:', response.data);
        return { 
          success: false, 
          error: response.data?.error?.message || 'Risposta non valida dal server' 
        };
      }
      
      // Estrai il token JWT dalla risposta
      const token = response.data.data?.token || getCookieValue('student-token');
      if (token) {
        localStorage.setItem('student-token', token);
        console.log('Token JWT salvato nel localStorage');
      }
      
      // Controlla se è una risposta di primo accesso
      if (response.data.data?.isFirstAccess) {
        return {
          isFirstAccess: true,
          studentId: response.data.data.studentId,
          message: response.data.data.message || 'È richiesto il cambio password'
        };
      }
      
      // Estrai i dati dello studente
      const studentData = response.data.data?.student;
      
      // Se non ci sono dati studente, gestisci l'errore
      if (!studentData) {
        console.warn('Risposta di successo ma senza dati studente:', response.data);
        
        // Se non abbiamo i dati dello studente, proviamo a recuperarli dal localStorage
        const existingStudentData = localStorage.getItem('student');
        if (existingStudentData) {
          return {
            success: true,
            data: {
              student: JSON.parse(existingStudentData)
            }
          };
        }
        
        return { 
          success: false, 
          error: 'Login riuscito ma dati studente mancanti' 
        };
      }
      
      // Standardizza l'ID studente
      if (!studentData._id && studentData.id) {
        studentData._id = studentData.id;
      }
      
      // Salva i dati nel localStorage
      authService.saveStudentData(studentData);
      
      return {
        success: true,
        data: {
          student: studentData
        }
      };
    } catch (error) {
      console.error('Errore durante il login:', error);
      
      // Gestione errori migliorata
      if (error.response) {
        // Errore con risposta dal server (4xx o 5xx)
        console.error('Errore dal server:', {
          status: error.response.status,
          data: error.response.data
        });
        
        // Se il server restituisce un messaggio di errore, usalo
        const serverErrorMessage = error.response.data?.error?.message;
        if (serverErrorMessage) {
          return { success: false, error: serverErrorMessage };
        }
        
        // Altrimenti usa un messaggio basato sul codice HTTP
        const errorMessage = getErrorMessage(error.response.status);
        return { success: false, error: errorMessage };
      } else if (error.request) {
        // Errore senza risposta dal server (problemi di connessione)
        return { success: false, error: 'Il server non risponde, verifica la tua connessione' };
      } else {
        // Errore nella configurazione della richiesta
        return { success: false, error: 'Errore durante la configurazione della richiesta' };
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
      console.log(`Gestione primo accesso per lo studente: ${studentId}`);
      
      // FIX: URL corretto che corrisponde alla nuova definizione della rotta
      const response = await axios.post(`${API_URL}/student-auth/first-access/${studentId}`, {
        temporaryPassword,
        newPassword
      }, {
        withCredentials: true
      });
      
      console.log('Risposta primo accesso:', response.data);
      
      // Verifica se la risposta è nel formato standardizzato
      if (!response.data || response.data.status !== 'success') {
        console.error('Risposta non valida o con errori dal server:', response.data);
        return { 
          success: false, 
          error: response.data?.error?.message || 'Risposta non valida dal server' 
        };
      }
      
      // Estrai il token JWT dalla risposta
      const token = response.data.data?.token || getCookieValue('student-token');
      if (token) {
        localStorage.setItem('student-token', token);
        console.log('Token JWT salvato nel localStorage');
      }
      
      // Estrai i dati dello studente
      const studentData = response.data.data?.student;
      
      // Salva i dati nel localStorage se disponibili
      if (studentData) {
        // Standardizza l'ID studente
        if (!studentData._id && studentData.id) {
          studentData._id = studentData.id;
        }
        
        // Salva i dati nel localStorage
        authService.saveStudentData(studentData);
        
        return {
          success: true,
          data: {
            student: studentData
          }
        };
      }
      
      // Anche se non abbiamo i dati dello studente, consideriamo il cambio password riuscito
      return { 
        success: true,
        message: response.data.message || 'Password aggiornata con successo'
      };
    } catch (error) {
      console.error('Errore durante il primo accesso:', error);
      
      if (error.response) {
        // Se il server restituisce un messaggio di errore, usalo
        const serverErrorMessage = error.response.data?.error?.message;
        if (serverErrorMessage) {
          return { success: false, error: serverErrorMessage };
        }
        
        // Altrimenti usa un messaggio basato sul codice HTTP
        const errorMessage = error.response.status === 401
          ? 'Password temporanea non valida'
          : getErrorMessage(error.response.status);
        
        return { success: false, error: errorMessage };
      } else if (error.request) {
        return { success: false, error: 'Il server non risponde, verifica la tua connessione' };
      } else {
        return { success: false, error: 'Errore durante la configurazione della richiesta' };
      }
    }
  },
  
  /**
   * Effettua il logout dello studente
   * @returns {Promise}
   */
  logout: async () => {
    try {
      console.log('Esecuzione logout...');
      
      // Prima rimuovi i dati locali
      clearStudentData();
      
      // Poi chiama l'API di logout
      await axios.post(`${API_URL}/student-auth/logout`, {}, {
        withCredentials: true
      });
      
      console.log('Logout completato con successo');
      
      return {
        success: true,
        message: 'Logout effettuato con successo'
      };
    } catch (error) {
      console.error('Errore durante il logout:', error);
      
      // Anche in caso di errore, consideriamo il logout come riuscito localmente
      clearStudentData();
      
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
    const hasToken = !!localStorage.getItem('student-token') || 
                     !!getCookieValue('student-token');
    const hasStudentData = !!localStorage.getItem('student');
    
    return hasToken && hasStudentData;
  },
  
  /**
   * Recupera i dati dello studente dal localStorage
   * @returns {Object|null}
   */
  getStudent: () => {
    try {
      const studentData = localStorage.getItem('student');
      return studentData ? JSON.parse(studentData) : null;
    } catch (error) {
      console.error('Errore nel parsing dei dati studente:', error);
      return null;
    }
  },
  
  /**
   * Recupera l'ID dello studente dal localStorage
   * @returns {string|null}
   */
  getStudentId: () => {
    // Prima prova a recuperare direttamente l'ID salvato
    const directId = localStorage.getItem('studentId');
    if (directId) return directId;

    // Se non c'è un ID diretto, prova a recuperarlo dai dati studente
    try {
      const studentData = localStorage.getItem('student');
      if (studentData) {
        const student = JSON.parse(studentData);
        return student._id || student.id || null;
      }
    } catch (error) {
      console.error('Errore nel recupero ID studente:', error);
    }
    return null;
  },
  
  /**
   * Recupera il token di autenticazione
   * @returns {string|null}
   */
  getToken: () => {
    // Prima cerca nel localStorage
    const tokenFromStorage = localStorage.getItem('student-token');
    if (tokenFromStorage) return tokenFromStorage;
    
    // Se non c'è nel localStorage, cerca nei cookie
    const tokenFromCookie = getCookieValue('student-token');
    if (tokenFromCookie) {
      // Se lo troviamo nel cookie, salviamolo anche nel localStorage per coerenza
      localStorage.setItem('student-token', tokenFromCookie);
      return tokenFromCookie;
    }
    
    return null;
  }
};

/**
 * Recupera il valore di un cookie per nome
 * @param {string} name - Nome del cookie
 * @returns {string|null} - Valore del cookie o null
 */
const getCookieValue = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Rimuove tutti i dati dello studente dal localStorage e dai cookie
 */
const clearStudentData = () => {
  localStorage.removeItem('student');
  localStorage.removeItem('studentId');
  localStorage.removeItem('student-token');
  document.cookie = 'student-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

/**
 * Genera un messaggio di errore basato sul codice HTTP
 * @param {number} statusCode - Codice di stato HTTP
 * @returns {string} - Messaggio di errore
 */
const getErrorMessage = (statusCode) => {
  switch (statusCode) {
    case 400: return 'Richiesta non valida';
    case 401: return 'Credenziali non valide';
    case 403: return 'Accesso non autorizzato';
    case 404: return 'Risorsa non trovata';
    case 500: return 'Errore interno del server';
    default: return 'Errore durante la richiesta';
  }
};

export default authService;