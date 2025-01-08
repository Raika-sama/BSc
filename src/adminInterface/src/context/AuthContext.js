// src/adminInterface/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const storedUser = localStorage.getItem('user');
            
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                // Verifica il token con il backend
                const response = await axiosInstance.get('/auth/verify');
                
                if (response.data.status === 'success') {
                    setUser(userData);
                } else {
                    handleAuthError();
                }
            }
        } catch (err) {
            handleAuthError();
        } finally {
            setLoading(false);
        }
    };

    const handleAuthError = () => {
        localStorage.removeItem('user');
        setUser(null);
        setError('Sessione scaduta');
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await axiosInstance.post('/auth/login', {
                email,
                password
            });

            if (response.data.status === 'success') {
                const userData = {
                    ...response.data.data.user,
                    token: response.data.token
                };
                
                console.log('Login successful, user data:', userData);
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                
                // Configura l'header Authorization per le richieste successive
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
                
                return userData;
            }
            
            throw new Error('Login fallito');
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.error?.message || 
                               err.response?.data?.message || 
                               'Errore durante il login';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Rimuovi l'header Authorization
            delete axiosInstance.defaults.headers.common['Authorization'];
            localStorage.removeItem('user');
            setUser(null);
            setError(null);
        }
    };

    const updateUser = (userData) => {
        try {
            const currentUser = { ...user, ...userData };
            localStorage.setItem('user', JSON.stringify(currentUser));
            setUser(currentUser);
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        updateUser,
        clearError,
        isAuthenticated: !!user,
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                Caricamento...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Hook personalizzato per la protezione delle rotte
export const useRequireAuth = (redirectUrl = '/login') => {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.loading && !auth.isAuthenticated) {
            navigate(redirectUrl);
        }
    }, [auth.loading, auth.isAuthenticated, navigate, redirectUrl]);

    return auth;
};