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
      
      // Estrai il token JWT dalla risposta o dai cookie
      const token = extractToken(response);
      if (token) {
        localStorage.setItem('student-token', token);
        console.log('Token JWT salvato nel localStorage');
      } else {
        console.warn('Nessun token trovato nella risposta');
      }
      
      // Caso 1: Risposta di primo accesso
      if (response.data?.data?.isFirstAccess) {
        // Salviamo l'ID dello studente per uso futuro
        if (response.data.data?.studentId) {
          localStorage.setItem('studentId', response.data.data.studentId);
          console.log('Student ID salvato:', localStorage.getItem('studentId'));
        }
        
        return {
          isFirstAccess: true,
          studentId: response.data.data?.studentId || '',
          message: 'Devi cambiare la password al primo accesso'
        };
      }
      
      // Caso 2: Risposta con student nella data.data
      if (response.data?.data?.student) {
        const studentData = response.data.data.student;
        
        // Salviamo l'ID dello studente separatamente
        if (studentData._id || studentData.id) {
          localStorage.setItem('studentId', studentData._id || studentData.id);
          console.log('Student ID salvato:', localStorage.getItem('studentId'));
        }
        
        localStorage.setItem('student', JSON.stringify(studentData));
        return {
          success: true,
          data: {
            student: studentData
          }
        };
      }
      
      // Caso 3: Risposta con student nella data
      if (response.data?.student) {
        const studentData = response.data.student;
        
        // Salviamo l'ID dello studente separatamente
        if (studentData._id || studentData.id) {
          localStorage.setItem('studentId', studentData._id || studentData.id);
          console.log('Student ID salvato:', localStorage.getItem('studentId'));
        }
        
        localStorage.setItem('student', JSON.stringify(studentData));
        return {
          success: true,
          data: {
            student: studentData
          }
        };
      }
      
      // Caso 4: Risposta senza student ma con successo (supponiamo che lo student sia nel cookie)
      if (response.data?.success || response.data?.status === 'success') {
        // Controlliamo se nella risposta c'è un campo studentId
        if (response.data.data?.studentId || response.data?.studentId) {
          localStorage.setItem('studentId', response.data.data?.studentId || response.data?.studentId);
          console.log('Student ID salvato:', localStorage.getItem('studentId'));
        }
        
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
      
      // Estrai e salva il token JWT
      const token = extractToken(response);
      if (token) {
        localStorage.setItem('student-token', token);
        console.log('Token JWT salvato nel localStorage dopo il primo accesso');
      }
      
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
      localStorage.removeItem('studentId'); // Rimuovi anche l'ID salvato separatamente
      localStorage.removeItem('student-token'); // Aggiungi esplicitamente rimozione token
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
    // Controlliamo sia il token che i dati studente
    const hasToken = !!localStorage.getItem('student-token') || 
                     document.cookie.includes('student-token=');
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
   * Salva i dati dello studente nel localStorage
   * @param {Object} studentData - I dati dello studente da salvare
   */
  saveStudent: (studentData) => {
    if (!studentData) return;
    
    try {
      // Salva i dati completi dello studente
      localStorage.setItem('student', JSON.stringify(studentData));
      
      // Salva anche l'ID separatamente per un accesso più veloce
      if (studentData._id || studentData.id) {
        localStorage.setItem('studentId', studentData._id || studentData.id);
      }
    } catch (error) {
      console.error('Errore nel salvataggio dei dati studente:', error);
    }
  },

  /**
   * Recupera il token di autenticazione
   * @returns {string|null}
   */
  getToken: () => {
    const tokenFromStorage = localStorage.getItem('student-token');
    
    // Se non troviamo il token nel localStorage, proviamo a cercarlo nei cookie
    if (!tokenFromStorage) {
      const tokenFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('student-token='))
        ?.split('=')[1];
      
      if (tokenFromCookie) {
        // Se lo troviamo nel cookie, salviamolo anche nel localStorage per coerenza
        localStorage.setItem('student-token', tokenFromCookie);
        return tokenFromCookie;
      }
    }
    
    return tokenFromStorage;
  },

  /**
   * Salva il token di autenticazione
   * @param {string} token - Il token da salvare
   */
  saveToken: (token) => {
    if (token) {
      localStorage.setItem('student-token', token);
    }
  },
};

/**
 * Funzione di utilità per estrarre il token JWT dalla risposta o dai cookie
 * @param {Object} response - Risposta HTTP da axios
 * @returns {string|null} - Il token JWT o null
 */
const extractToken = (response) => {
  // 1. Controlla se il token è nella risposta
  if (response.data?.token) {
    return response.data.token;
  }
  
  // 2. Cerca nel formato di risposta annidato
  if (response.data?.data?.token) {
    return response.data.data.token;
  }
  
  // 3. Cerca nei cookie (dopo la risposta saranno già impostati)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'student-token') {
      return value;
    }
  }
  
  return null;
};

export default authService;