// src/adminInterface/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [userStatus, setUserStatus] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const { showNotification } = useNotification();

    useEffect(() => {
        checkAuth();
    }, []);

    // Aggiungi queste funzioni
const checkPermission = (permission) => {
    return permissions?.includes(permission) || false;
};

const isAccountActive = () => {
    return userStatus === 'active';
};

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

    // In AuthContext.js
    const login = async ({email, password}) => {
        try {
            const response = await axiosInstance.post('/auth/login', {
                email,
                password
            });
            
            if (response.data.status === 'success') {
                const { token, data: { user } } = response.data;
                
                // Imposta il token
                setToken(token);
                localStorage.setItem('token', token);
                
                // Imposta l'utente
                const userData = { ...user };
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                
                // Imposta il token nell'header di axios
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                return true;
            }
            return false;
        } catch (error) {
            showNotification(error.response?.data?.error?.message || 'Errore durante il login', 'error');
            throw error;
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

    // Aggiungi al value object
    const value = {
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        permissions,
        checkPermission,
        isAccountActive,
        userStatus
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