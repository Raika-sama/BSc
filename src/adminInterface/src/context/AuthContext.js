// src/adminInterface/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [userStatus, setUserStatus] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const currentUser = authService.getCurrentUser();
            
            if (currentUser?.token) {
                // Verifica il token con il backend
                const response = await axiosInstance.get('/auth/verify');
                
                if (response.data.status === 'success') {
                    setUser(response.data.data.user);
                    setUserStatus(response.data.data.user.status);
                    setPermissions(response.data.data.user.permissions || []);
                    setSessionData(response.data.data.session);
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
        authService.logout();
        setUser(null);
        setSessionData(null);
        setError('Sessione scaduta');
    };

    const login = async ({email, password}) => {
        try {
            const response = await authService.login(email, password);
            
            if (response.status === 'success') {
                const { user, token, refreshToken } = response.data;
                
                setUser(user);
                setUserStatus(user.status);
                setPermissions(user.permissions || []);
                setSessionData({
                    token,
                    refreshToken,
                    expiresAt: user.tokenExpiresAt
                });
                
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
            await authService.logout();
            setUser(null);
            setSessionData(null);
            setPermissions([]);
            setUserStatus(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
            showNotification('Errore durante il logout', 'error');
        }
    };

    const refreshSession = async () => {
        try {
            if (!sessionData?.refreshToken) return false;
            
            const response = await axiosInstance.post('/auth/refresh-token', {
                refreshToken: sessionData.refreshToken
            });

            if (response.data.status === 'success') {
                const { token, refreshToken } = response.data.data;
                setSessionData(prev => ({
                    ...prev,
                    token,
                    refreshToken
                }));
                return true;
            }
            return false;
        } catch (error) {
            handleAuthError();
            return false;
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
        isAuthenticated: !!sessionData?.token,
        permissions,
        sessionData,
        login,
        logout,
        refreshSession,
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