// src/adminInterface/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';
import authService from '../services/authService';

const AuthContext = createContext(null);

// Aggiungiamo l'hook useAuth
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [userStatus, setUserStatus] = useState(null);
    //const [sessionData, setSessionData] = useState(null);
    const { showNotification } = useNotification();


    const handleAuthError = () => {
        authService.logout();
        setUser(null);
        setError('Sessione scaduta');
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = authService.getCurrentUser();
                
                if (!currentUser) {
                    setLoading(false);
                    return;
                }
    
                try {
                    const response = await axiosInstance.get('/auth/verify');
                    
                    if (response.data.status === 'success') {
                        setUser(currentUser);
                        setUserStatus(currentUser.status);
                        setPermissions(currentUser.permissions || []);
                    } else {
                        handleAuthError();
                    }
                } catch (err) {
                    if (err.response?.status !== 401) {
                        handleAuthError();
                    }
                }
            } finally {
                setLoading(false);
            }
        };
    
        initAuth();
    }, []); // Esegui solo all'mount

    // Modifica la funzione login
    const login = async ({email, password}) => {
        try {
            console.log('📡 Inviando richiesta di login al server...');
            const response = await authService.login(email, password);
            
            if (response.status === 'success') {
                const { user } = response.data;
                
                setUser(user);
                setUserStatus(user.status);
                setPermissions(user.permissions || []);
                
                console.log('✨ Login completato con successo');
                return true;
            }
            return false;
        } catch (error) {
            console.error('💥 Errore durante il login:', error);
            showNotification(error.response?.data?.error?.message || 'Errore durante il login', 'error');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setPermissions([]);
            setUserStatus(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
            showNotification('Errore durante il logout', 'error');
        }
    };

    
    const updateUser = (userData) => {
        try {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            authService.updateUserInStorage(updatedUser);
        } catch (err) {
            console.error('Error updating user:', err);
            showNotification('Errore nell\'aggiornamento dei dati utente', 'error');
        }
    };


    const checkPermission = (permission) => {
        return permissions?.includes(permission) || user?.role === 'admin' || false;
    };

    const isAccountActive = () => {
        return userStatus === 'active';
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        permissions,
        login,
        logout,
        updateUser,
        checkPermission,
        isAccountActive,
        userStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};