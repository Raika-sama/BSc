import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../utils/authService';

// Create the auth context
const AuthContext = createContext();

/**
 * Provider component for authentication context
 * Manages student authentication state and provides auth-related functions
 */
export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if there's a student in localStorage or valid token
        const storedStudent = localStorage.getItem('student');
        const hasToken = authService.getToken();

        if (storedStudent) {
          const studentData = JSON.parse(storedStudent);
          setStudent(studentData);
          setIsAuthenticated(Boolean(hasToken));
        } else {
          setIsAuthenticated(false);
          setStudent(null);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError(err.message || 'Errore durante la verifica dell\'autenticazione');
        setIsAuthenticated(false);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(username, password);
      
      if (response.isFirstAccess) {
        // Return special response for first access flow
        return {
          isFirstAccess: true,
          studentId: response.studentId,
          message: response.message
        };
      }
      
      setStudent(response.student);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Errore durante il login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete first login (password change)
  const completeFirstLogin = async (studentId, temporaryPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.completeFirstLogin(
        studentId, 
        temporaryPassword, 
        newPassword
      );
      
      setStudent(response.student);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      console.error('First login completion error:', err);
      setError(err.message || 'Errore durante il completamento del primo accesso');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message || 'Errore durante il logout');
    } finally {
      setStudent(null);
      setIsAuthenticated(false);
      setLoading(false);
      // Clear any stored auth data
      localStorage.removeItem('student');
    }
  };

  // Update student data
  const updateStudentData = (updatedData) => {
    if (!student) return;
    
    const updatedStudent = {
      ...student,
      ...updatedData
    };
    
    setStudent(updatedStudent);
    
    // Update localStorage
    try {
      localStorage.setItem('student', JSON.stringify(updatedStudent));
    } catch (err) {
      console.error('Error updating student data in localStorage:', err);
    }
  };

  // Context value
  const contextValue = {
    student,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    completeFirstLogin,
    updateStudentData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;