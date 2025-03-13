import axios from 'axios';
import authService from './authService';

// Using the same API URL as authService
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Crea un'istanza axios con impostazioni predefinite
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Cache per le richieste
const requestCache = {
  assignedTests: {
    data: null,
    timestamp: null,
    isLoading: false,
    promise: null
  }
};

// Tempo di validità della cache in millisecondi (30 secondi)
const CACHE_TTL = 30000;

// Interceptor per aggiungere il token di autenticazione a ogni richiesta
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Servizio per gestire le operazioni relative agli studenti
 */
const studentService = {
  /**
   * Recupera i dettagli completi del profilo dello studente corrente
   * @returns {Promise} Promise con i dati completi dello studente, inclusi scuola e classe
   */
  getStudentProfile: async () => {
    try {
      console.log('Recupero profilo studente...');
      
      // Ottieni lo studentId dal servizio di autenticazione
      const studentId = authService.getStudentId();
      
      if (!studentId) {
        console.error('ID studente non disponibile');
        throw new Error('ID studente non disponibile. Effettua il login.');
      }
      
      console.log('Usando ID studente:', studentId);
      
      // Usa l'ID studente per chiamare l'endpoint
      const response = await axiosInstance.get(`/student-auth/student/profile`);
      
      console.log('Risposta profilo studente:', response.data);
      
      // Verifica e standardizza la risposta
      if (response.data) {
        // Normalizza la struttura della risposta
        let studentData = response.data.student || response.data.data?.student;
        let schoolData = response.data.school || response.data.data?.school;
        let classData = response.data.class || response.data.data?.class;
        
        // Se i dati della scuola sono contenuti nello studente
        if (!schoolData && studentData?.schoolId && typeof studentData.schoolId === 'object') {
          schoolData = studentData.schoolId;
        }
        
        // Se i dati della classe sono contenuti nello studente
        if (!classData && studentData?.classId && typeof studentData.classId === 'object') {
          classData = studentData.classId;
        }
        
        // Salva l'ID dello studente se non era già salvato
        if (studentData && (studentData._id || studentData.id)) {
          localStorage.setItem('studentId', studentData._id || studentData.id);
        }
        
        return {
          status: 'success',
          data: {
            student: studentData || {},
            school: schoolData || {},
            class: classData || {}
          }
        };
      }
      
      throw new Error('Formato risposta non valido');
    } catch (error) {
      console.error('Error fetching student profile:', error);
      
      // Per errori 401, reindirizza al login
      if (error.response && error.response.status === 401) {
        // Pulisci i dati di autenticazione
        authService.logout();
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
      }
      
      throw error;
    }
  },
  
  /**
   * Recupera i dettagli della classe dello studente
   * @returns {Promise} Promise con i dati della classe
   */
  getStudentClass: async () => {
    try {
      console.log('Recupero informazioni della classe...');
      
      // Prima, tenta di recuperare dal profilo completo
      try {
        const profileData = await studentService.getStudentProfile();
        if (profileData?.data?.class) {
          return {
            status: 'success',
            data: profileData.data.class
          };
        }
      } catch (profileError) {
        console.error('Impossibile recuperare la classe dal profilo:', profileError);
      }
      
      throw new Error('Informazioni sulla classe non disponibili');
    } catch (error) {
      console.error('Errore durante il recupero della classe:', error);
      throw { 
        error: error.response?.status === 404 ? 'Classe non trovata' : 'Errore nel recupero della classe',
        details: error.response?.data || error.message
      };
    }
  },
  
  /**
   * Recupera i dettagli della scuola dello studente
   * @returns {Promise} Promise con i dati della scuola
   */
  getStudentSchool: async () => {
    try {
      console.log('Recupero informazioni della scuola...');
      
      // Prima, tenta di recuperare dal profilo completo
      try {
        const profileData = await studentService.getStudentProfile();
        if (profileData?.data?.school) {
          return {
            status: 'success',
            data: profileData.data.school
          };
        }
      } catch (profileError) {
        console.error('Impossibile recuperare la scuola dal profilo:', profileError);
      }
      
      throw new Error('Informazioni sulla scuola non disponibili');
    } catch (error) {
      console.error('Errore durante il recupero della scuola:', error);
      throw { 
        error: error.response?.status === 404 ? 'Scuola non trovata' : 'Errore nel recupero della scuola',
        details: error.response?.data || error.message
      };
    }
  },
  
  /**
   * Recupera i test assegnati allo studente con sistema di cache 
   * per evitare chiamate ripetute in breve tempo
   * @param {boolean} force - Se true, forza il refresh della cache
   * @returns {Promise} Promise con i dati dei test assegnati
   */
  getAssignedTests: async (force = false) => {
    const cache = requestCache.assignedTests;
    const now = Date.now();
    
    // Verifica se abbiamo dati in cache validi e non è richiesto un refresh forzato
    if (!force && cache.data && cache.timestamp && (now - cache.timestamp < CACHE_TTL)) {
      console.log('Usando dati in cache per i test assegnati');
      return cache.data;
    }
    
    // Se c'è già una richiesta in corso, restituisce la stessa Promise
    if (cache.isLoading && cache.promise) {
      console.log('Richiesta già in corso, attendere...');
      return cache.promise;
    }
    
    // Imposta lo stato di caricamento
    cache.isLoading = true;
    
    // Crea e salva la Promise
    cache.promise = new Promise(async (resolve, reject) => {
      try {
        console.log('Recupero test assegnati...');
        
        // Utilizziamo la rotta /tests/my-tests che è già protetta dal middleware protectStudent
        const response = await axiosInstance.get('/tests/my-tests');
        
        console.log('Risposta test assegnati:', response.data);
        
        const result = {
          status: 'success',
          data: response.data.tests || response.data.data?.tests || []
        };
        
        // Aggiorna la cache
        cache.data = result;
        cache.timestamp = Date.now();
        cache.isLoading = false;
        
        resolve(result);
      } catch (error) {
        console.error('Errore durante il recupero dei test assegnati:', error);
        
        // Resetta lo stato di caricamento in caso di errore
        cache.isLoading = false;
        
        const errorObj = { 
          error: error.response?.status === 404 ? 'Nessun test trovato' : 'Errore nel recupero dei test',
          details: error.response?.data || error.message
        };
        
        reject(errorObj);
      }
    });
    
    return cache.promise;
  },
  
  /**
   * Avvia un test assegnato allo studente
   * @param {string} testId - ID del test da avviare
   * @returns {Promise} Promise con i dati del test avviato
   */
startAssignedTest: async (testId) => {
  try {
    console.log('Avvio test assegnato:', testId);
    
    const response = await axiosInstance.post(`/tests/start-assigned/${testId}`);
    
    console.log('Risposta avvio test:', response.data);
    
    // Invalida la cache dopo aver avviato un test
    studentService.clearCache();
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error('Errore durante l\'avvio del test:', error);
    
    // Miglioriamo la gestione degli errori per catturare tutti i dettagli possibili
    const errorObj = { 
      error: 'Errore nell\'avvio del test',
      details: {}
    };
    
    // Estrai informazioni dettagliate dall'oggetto error
    if (error.response && error.response.data) {
      if (error.response.data.error) {
        errorObj.error = error.response.data.error.message || error.response.data.error;
        errorObj.details = error.response.data.error.details || {};
        errorObj.code = error.response.data.error.code;
      } else {
        errorObj.error = error.response.data.message || error.message;
      }
    }
    
    // Log dell'oggetto errore prima di lanciarlo
    console.log('Dettagli errore formattati:', errorObj);
    
    throw errorObj;
  }
},
  

  /**
   * Verifica un token di test
   * @param {string} token - Token del test da verificare
   * @param {string} testType - Tipo di test
   * @returns {Promise} Promise con i dati di verifica del token
   */
  verifyTestToken: async (testId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tests/csi/verify/${testId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Dettagli errore verifica token:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw {
        error: error.response?.data?.error || 'Errore nella verifica del token',
        details: error.response?.data?.details || {},
        status: error.response?.statusdun
      };
    }
  },
  
  /**
   * Inizia un test con un token valido
   * @param {string} token - Token del test da iniziare
   * @param {string} testType - Tipo di test
   * @returns {Promise} Promise con i dati di inizio del test
   */
  startTest: async (token, testType) => {
    try {
      console.log(`Inizio test ${testType} con token:`, token);
      
      const response = await axiosInstance.post(`/tests/${testType.toLowerCase()}/${token}/start`);
      
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error) {
      console.error('Errore durante l\'inizio del test:', error);
      throw { 
        error: error.response?.data?.error?.message || 'Errore nell\'avvio del test',
        details: error.response?.data || error.message
      };
    }
  },
  
  /**
   * Invia una risposta per un test
   * @param {string} token - Token del test
   * @param {string} testType - Tipo di test
   * @param {Object} answerData - Dati della risposta
   * @returns {Promise} Promise con i dati di risposta
   */
  submitTestAnswer: async (token, testType, answerData) => {
    try {
      console.log(`Invio risposta per test ${testType}:`, answerData);
      
      const response = await axiosInstance.post(
        `/tests/${testType.toLowerCase()}/${token}/answer`,
        answerData
      );
      
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error) {
      console.error('Errore durante l\'invio della risposta:', error);
      throw { 
        error: error.response?.data?.error?.message || 'Errore nell\'invio della risposta',
        details: error.response?.data || error.message
      };
    }
  },
  
  /**
   * Completa un test
   * @param {string} token - Token del test
   * @param {string} testType - Tipo di test
   * @returns {Promise} Promise con i dati di completamento del test
   */
  completeTest: async (token, testType) => {
    try {
      console.log(`Completamento test ${testType} con token:`, token);
      
      const response = await axiosInstance.post(`/tests/${testType.toLowerCase()}/${token}/complete`);
      
      // Invalida la cache dopo aver completato un test
      studentService.clearCache();
      
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error) {
      console.error('Errore durante il completamento del test:', error);
      throw { 
        error: error.response?.data?.error?.message || 'Errore nel completamento del test',
        details: error.response?.data || error.message
      };
    }
  },
  
  /**
   * Forza un refresh dei dati in cache
   */
  clearCache: () => {
    requestCache.assignedTests.data = null;
    requestCache.assignedTests.timestamp = null;
    requestCache.assignedTests.isLoading = false;
    requestCache.assignedTests.promise = null;
    console.log('Cache dei test assegnati cancellata');
  }
}

export default studentService;