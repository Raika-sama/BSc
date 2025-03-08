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
      console.log('Recupero dettagli profilo studente...');
      
      // Ottieni il token da varie fonti
      const tokenFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('student-token='))
        ?.split('=')[1];
      
      const tokenFromStorage = localStorage.getItem('student-token');
      const token = tokenFromCookie || tokenFromStorage;
      
      // Verifica se esiste uno studente nel localStorage anche se non c'è token
      const studentData = localStorage.getItem('student');
      
      if (!token && !studentData) {
        throw new Error('Token non trovato - Effettua nuovamente il login');
      }
      
      // Se abbiamo un token, proviamo a fare la richiesta API
      if (token) {
        console.log('Token disponibile, procedo con la richiesta API');
        
        try {
          // Prima richiesta: profilo completo
          const profileResponse = await axiosInstance.get(`/student-auth/student/profile`);
          console.log('Risposta profilo ricevuta:', profileResponse.data);
          
          // Se il profilo è stato recuperato con successo, utilizziamo questi dati
          if (profileResponse.data.status === 'success' && profileResponse.data.data) {
            const studentId = profileResponse.data.data.student?._id || 
                            profileResponse.data.data.student?.id;
            
            // Verifica se abbiamo tutti i dati necessari
            const hasCompleteData = profileResponse.data.data.student && 
                                  (profileResponse.data.data.school || profileResponse.data.data.class);
            
            // Se mancano dati e abbiamo l'ID studente, facciamo richieste aggiuntive
            if (!hasCompleteData && studentId) {
              console.log('Dati incompleti, recupero informazioni aggiuntive...');
              
              // Struttura base della risposta
              const completeData = {
                status: 'success',
                data: {
                  student: profileResponse.data.data.student,
                  school: profileResponse.data.data.school || null,
                  class: profileResponse.data.data.class || null
                }
              };
              
              // Se non abbiamo dati della scuola, tentiamo di recuperarli
              if (!completeData.data.school) {
                try {
                  const schoolResponse = await axiosInstance.get(`/students/${studentId}/school`);
                  if (schoolResponse.data.status === 'success') {
                    completeData.data.school = schoolResponse.data.data;
                    console.log('Dati scuola recuperati:', completeData.data.school);
                  }
                } catch (schoolError) {
                  console.error('Errore nel recupero dati scuola:', schoolError);
                }
              }
              
              // Se non abbiamo dati della classe, tentiamo di recuperarli
              if (!completeData.data.class) {
                try {
                  const classResponse = await axiosInstance.get(`/students/${studentId}/class`);
                  if (classResponse.data.status === 'success') {
                    completeData.data.class = classResponse.data.data;
                    console.log('Dati classe recuperati:', completeData.data.class);
                  }
                } catch (classError) {
                  console.error('Errore nel recupero dati classe:', classError);
                }
              }
              
              // Aggiorniamo anche il localStorage con i dati più recenti
              localStorage.setItem('student', JSON.stringify(completeData.data.student));
              
              return completeData;
            }
            
            return profileResponse.data;
          }
          
          throw new Error('Formato risposta profilo non valido');
        } catch (apiError) {
          console.error('Errore API nel recupero del profilo:', apiError);
          
          // Se l'errore è 401, proviamo a usare i dati locali come fallback
          if (apiError.response?.status === 401 && studentData) {
            console.log('Usando dati locali come fallback...');
          } else {
            throw apiError; // Rilancia l'errore se non possiamo recuperare dati locali
          }
        }
      }
      
      // Se non abbiamo dati dall'API ma abbiamo i dati localmente, usiamo quelli
      if (studentData) {
        console.log('Usando dati studente dal localStorage');
        const student = JSON.parse(studentData);
        
        // Creiamo una risposta strutturata simile a quella dell'API
        const localData = {
          status: 'success',
          data: {
            student: student,
            // Se lo studente ha riferimenti a scuola e classe, includiamoli
            school: student.schoolId && typeof student.schoolId === 'object' ? student.schoolId : null,
            class: student.classId && typeof student.classId === 'object' ? student.classId : null
          }
        };
        
        // Se abbiamo un ID studente ma mancano dati di scuola/classe, proviamo a recuperarli
        const studentId = student._id || student.id;
        
        if (studentId && token) {
          if (!localData.data.school) {
            try {
              const schoolResponse = await axiosInstance.get(`/students/${studentId}/school`);
              if (schoolResponse.data.status === 'success') {
                localData.data.school = schoolResponse.data.data;
                console.log('Dati scuola aggiunti ai dati locali:', localData.data.school);
              }
            } catch (err) {
              console.error('Impossibile recuperare dati scuola:', err);
            }
          }
          
          if (!localData.data.class) {
            try {
              const classResponse = await axiosInstance.get(`/students/${studentId}/class`);
              if (classResponse.data.status === 'success') {
                localData.data.class = classResponse.data.data;
                console.log('Dati classe aggiunti ai dati locali:', localData.data.class);
              }
            } catch (err) {
              console.error('Impossibile recuperare dati classe:', err);
            }
          }
        }
        
        return localData;
      }
      
      throw new Error('Dati profilo non disponibili');
    } catch (error) {
      console.error('Errore durante il recupero del profilo studente:', error);
      
      // Se l'errore è 401, significa che il token non è più valido
      if (error.response?.status === 401) {
        throw new Error('Sessione scaduta - Effettua nuovamente il login');
      }
      
      throw error.response?.data?.error || error;
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