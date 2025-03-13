import axios from 'axios';
import authService from './authService';

// Using the same API URL as authService
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Crea un'istanza axios con impostazioni predefinite
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

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
   * Recupera i test assegnati allo studente
   * @returns {Promise} Promise con i dati dei test assegnati
   */
  getAssignedTests: async () => {
    try {
      console.log('Recupero test assegnati...');
      
      const response = await axiosInstance.get('/student/tests/assigned');
      
      console.log('Risposta test assegnati:', response.data);
      
      return {
        status: 'success',
        data: response.data.tests || response.data.data?.tests || []
      };
    } catch (error) {
      console.error('Errore durante il recupero dei test assegnati:', error);
      throw { 
        error: error.response?.status === 404 ? 'Nessun test trovato' : 'Errore nel recupero dei test',
        details: error.response?.data || error.message
      };
    }
  },
}

export default studentService;