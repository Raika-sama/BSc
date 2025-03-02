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

  // Verifica dello stato di autenticazione all'avvio
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          setStudent(authService.getStudent());
        }
      } catch (err) {
        console.error('Errore durante il controllo dell\'autenticazione:', err);
        setError(err);
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
    setLoading(true);
    
    try {
      const response = await authService.login(username, password);
      
      if (response.isFirstAccess) {
        // Caso speciale per primo accesso
        return { isFirstAccess: true };
      }
      
      if (response.data?.student) {
        setStudent(response.data.student);
      }
      
      return { success: true };
    } catch (err) {
      setError(err.error || 'Errore durante il login');
      return { success: false, error: err.error || 'Errore durante il login' };
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
      setError(err.error || 'Errore durante il cambio password');
      return { success: false, error: err.error || 'Errore durante il cambio password' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effettua il logout dell'utente
   */
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      setStudent(null);
    } catch (err) {
      console.error('Errore durante il logout:', err);
      // Anche in caso di errore, considerare l'utente come disconnesso localmente
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    student,
    loading,
    error,
    isAuthenticated: !!student,
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