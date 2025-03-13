import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../utils/authService';

// Creazione del contesto di autenticazione
const AuthContext = createContext(null);

/**
 * Provider per il contesto di autenticazione
 */
export const AuthProvider = ({ children }) => {
  // Stati
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  // Verifica dello stato di autenticazione all'avvio
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log('Verifico stato autenticazione...');
        if (authService.isAuthenticated()) {
          const studentData = authService.getStudent();
          console.log('Dati studente recuperati:', studentData);
          setStudent(studentData);
        } else {
          console.log('Nessuna sessione attiva trovata');
          setStudent(null);
        }
      } catch (err) {
        console.error('Errore durante la verifica dell\'autenticazione:', err);
        setError(err.message || 'Errore durante la verifica dell\'autenticazione');
      } finally {
        setLoading(false);
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
      
      // Gestisci il caso di login riuscito
      if (response.success && response.data?.student) {
        setStudent(response.data.student);
        return { success: true };
      }
      
      // Gestisci errori
      setError(response.error || 'Errore durante il login');
      return { 
        success: false, 
        error: response.error || 'Errore durante il login' 
      };
    } catch (err) {
      console.error('Errore durante il login in useAuth:', err);
      const errorMessage = typeof err === 'string' ? err : 
                          (err.error || err.message || 'Errore durante il login');
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
      const response = await authService.handleFirstAccess(studentId, tempPassword, newPassword);
      
      // Se il primo accesso è riuscito e abbiamo i dati dello studente
      if (response.success && response.data?.student) {
        setStudent(response.data.student);
      }
      
      return response;
    } catch (err) {
      console.error('Errore durante il cambio password:', err);
      const errorMessage = typeof err === 'string' ? err : 
                          (err.error || err.message || 'Errore durante il cambio password');
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

  // Valore del contesto
  const value = {
    student,
    loading,
    error,
    isAuthenticated: !!student,
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