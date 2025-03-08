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
    const tokenFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('student-token='))
      ?.split('=')[1];
    
    const tokenFromStorage = localStorage.getItem('student-token');
    const token = tokenFromCookie || tokenFromStorage;
    
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
      console.log('========== PROFILE DEBUG ==========');
      
      // ===== HARD-CODED ID PER TESTING =====
      const TEMPORARY_TEST_ID = '67b20991d8fdac4600a0def6'; // ID dello studente Ciccio Pasticcio
      console.log('Using hard-coded student ID for testing:', TEMPORARY_TEST_ID);
      
      // Usa l'ID di test per chiamare l'endpoint
      const response = await axiosInstance.get(`/students/${TEMPORARY_TEST_ID}`);
      
      console.log('API response from /students/:id:', response.data);
      
      if (response.data && response.data.data && response.data.data.student) {
        // Normalizza i dati per la visualizzazione
        return {
          status: 'success',
          data: {
            student: response.data.data.student,
            school: response.data.data.student.schoolId,
            class: response.data.data.student.classId
          }
        };
      }
      
      throw new Error('Formato risposta non valido');
    } catch (error) {
      console.error('Error fetching student profile:', error);
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
      
      // Ottieni lo studentId salvato durante il login
      const studentId = authService.getStudentId();
      
      if (!studentId) {
        throw new Error('ID studente non disponibile');
      }
      
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
      
      // Se non è disponibile nel profilo, tenta di recuperarla direttamente
      const response = await axiosInstance.get(`/students/${studentId}/class`);
      
      console.log('Dati classe ricevuti:', response.data);
      return response.data;
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
      
      // Ottieni lo studentId salvato durante il login
      const studentId = authService.getStudentId();
      
      if (!studentId) {
        throw new Error('ID studente non disponibile');
      }
      
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
      
      // Se non è disponibile nel profilo, tenta di recuperarla direttamente
      const response = await axiosInstance.get(`/students/${studentId}/school`);
      
      console.log('Dati scuola ricevuti:', response.data);
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero della scuola:', error);
      throw { 
        error: error.response?.status === 404 ? 'Scuola non trovata' : 'Errore nel recupero della scuola',
        details: error.response?.data || error.message
      };
    }
  }
};

export default studentService;