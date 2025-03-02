import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../utils/authService';

const AuthContext = createContext(null);

/**
 * Provider per il contesto di autenticazione
 */
export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  // Verifica dello stato di autenticazione all'avvio
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const studentData = authService.getStudent();
          setStudent(studentData);
        }
      } catch (err) {
        console.error('Errore durante il controllo dell\'autenticazione:', err);
        setError(err);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  /**
   * Effettua il login dell'utente
   */
  const login = async (username, password) => {
    setError(null);
    setLogoutSuccess(false);
    setLoading(true);
    
    try {
      const response = await authService.login(username, password);
      console.log("Risposta login in useAuth:", response);
      
      // Gestisci il caso di primo accesso
      if (response.isFirstAccess) {
        setLoading(false);
        return { 
          isFirstAccess: true,
          studentId: response.studentId || '',
          success: false 
        };
      }
      
      // Gestisci il caso di login normale
      if (response.data?.student) {
        setStudent(response.data.student);
        return { success: true };
      } else if (response.status === 'success' && response.data?.student) {
        // Formati alternativi di risposta
        setStudent(response.data.student);
        return { success: true };
      } else {
        console.error('Formato risposta login non valido:', response);
        setError('Formato risposta non valido');
        return { success: false, error: 'Formato risposta non valido' };
      }
    } catch (err) {
      console.error('Errore durante il login in useAuth:', err);
      const errorMessage = err.error || 'Errore durante il login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestisce il cambio password al primo accesso
   */
  const handleFirstAccess = async (studentId, tempPassword, newPassword) => {
    setError(null);
    setLoading(true);
    
    try {
      await authService.handleFirstAccess(studentId, tempPassword, newPassword);
      return { success: true };
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
   */
  const logout = async () => {
    try {
      setLoading(true);
      
      // Prima rimuovi lo studente dal contesto 
      setStudent(null);
      setLogoutSuccess(true);
      
      // Poi esegui la chiamata di logout
      await authService.logout();
      
      return { success: true };
    } catch (err) {
      console.error('Errore durante il logout in useAuth:', err);
      
      // In ogni caso, consideriamo l'utente come disconnesso
      setStudent(null);
      setLogoutSuccess(true);
      
      return { 
        success: true,
        warning: 'Il server non ha confermato il logout, ma la sessione è stata terminata localmente'
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    student,
    loading,
    error,
    isAuthenticated: !!student,
    authChecked,
    logoutSuccess,
    setLogoutSuccess,
    login,
    logout,
    handleFirstAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizzato per utilizzare il contesto di autenticazione
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};

export default useAuth;