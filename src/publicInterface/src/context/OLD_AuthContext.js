import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../utils/authService';

// Creazione del contesto di autenticazione
const AuthContext = createContext(null);

/**
 * Provider per il contesto di autenticazione
 * Gestisce lo stato di autenticazione e fornisce metodi di autenticazione
 */
export const AuthProvider = ({ children }) => {
  // Stato locale
  const [student, setStudent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Verifica dello stato di autenticazione all'avvio
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Verifico stato autenticazione...');
        if (authService.isAuthenticated()) {
          const studentData = authService.getStudent();
          setStudent(studentData);
          setIsAuthenticated(true);
          
          console.log('Autenticazione verificata:', { 
            studentId: studentData?._id || 'ID non disponibile',
            isAuthenticated: true
          });
        } else {
          console.log('Nessuna sessione attiva trovata');
          setIsAuthenticated(false);
          setStudent(null);
        }
      } catch (err) {
        console.error('Errore durante il controllo dell\'autenticazione:', err);
        setError('Errore durante la verifica dell\'autenticazione');
        setIsAuthenticated(false);
        setStudent(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Effettua il login dell'utente
   * @param {string} username - Username/email dello studente
   * @param {string} password - Password dello studente
   * @returns {Promise} - Risultato dell'operazione
   */
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    setLogoutSuccess(false);
    
    try {
      console.log('Tentativo di login per:', username);
      const response = await authService.login(username, password);
      
      // Gestisci il caso di primo accesso
      if (response.isFirstAccess) {
        console.log('Rilevato primo accesso, richiesto cambio password');
        setLoading(false);
        return { 
          isFirstAccess: true,
          studentId: response.studentId,
          message: response.message
        };
      }
      
      // Gestisci il caso di login normale
      if (response.success && response.data?.student) {
        console.log('Login completato con successo');
        setStudent(response.data.student);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        console.error('Formato risposta login non valido:', response);
        setError('Risposta non valida dal server');
        return { success: false, error: 'Risposta non valida dal server' };
      }
    } catch (err) {
      console.error('Errore durante il login:', err);
      const errorMessage = err.error || 'Errore durante il login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestisce il primo accesso e cambio password
   * @param {string} studentId - ID dello studente
   * @param {string} temporaryPassword - Password temporanea
   * @param {string} newPassword - Nuova password
   * @returns {Promise} - Risultato dell'operazione
   */
  const handleFirstAccess = async (studentId, temporaryPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Gestione primo accesso per studente:', studentId);
      const response = await authService.handleFirstAccess(
        studentId, 
        temporaryPassword, 
        newPassword
      );
      
      if (response.success) {
        if (response.data?.student) {
          setStudent(response.data.student);
          setIsAuthenticated(true);
        } else {
          // Se non abbiamo i dati dello studente, dovremo fare una chiamata aggiuntiva
          console.log('Login dopo cambio password richiesto');
        }
        return { success: true };
      } else {
        setError('Errore durante il cambio password');
        return { success: false, error: 'Errore durante il cambio password' };
      }
    } catch (err) {
      console.error('Errore durante il cambio password:', err);
      const errorMessage = err.error || 'Errore durante il cambio password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effettua il logout dell'utente
   * @returns {Promise} - Risultato dell'operazione
   */
  const logout = async () => {
    try {
      setLoading(true);
      console.log('Esecuzione logout...');
      
      // Prima aggiorna lo stato locale
      setStudent(null);
      setIsAuthenticated(false);
      setLogoutSuccess(true);
      
      // Poi esegui la chiamata di logout
      await authService.logout();
      
      console.log('Logout completato con successo');
      return { success: true };
    } catch (err) {
      console.error('Errore durante il logout:', err);
      
      // In ogni caso, consideriamo l'utente come disconnesso
      setStudent(null);
      setIsAuthenticated(false);
      
      return { 
        success: true,
        warning: 'Il server non ha confermato il logout, ma la sessione è stata terminata localmente'
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiorna i dati dello studente
   * @param {Object} updatedData - Nuovi dati dello studente
   */
  const updateStudentData = (updatedData) => {
    if (!student) return;
    
    const updatedStudent = {
      ...student,
      ...updatedData
    };
    
    setStudent(updatedStudent);
    authService.saveStudentData(updatedStudent);
  };

  // Valore del contesto da fornire
  const value = {
    student,
    isAuthenticated,
    loading,
    error,
    authChecked,
    logoutSuccess,
    setLogoutSuccess,
    login,
    logout,
    handleFirstAccess,
    updateStudentData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizzato per utilizzare il contesto di autenticazione
 * @returns {Object} - Valore del contesto
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};

export default useAuth;