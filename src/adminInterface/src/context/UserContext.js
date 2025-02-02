// src/context/UserContext.js
import React, { createContext, useContext, useState } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0); // Aggiunto per la paginazione
    const { showNotification } = useNotification();

    const getUsers = async (filters = {}) => {
        const { page = 1, limit = 10, search = '', sort = '-createdAt' } = filters;
        
        setLoading(true);
        try {
            const response = await axiosInstance.get('/users', {
                params: { page, limit, search, sort }
            });
    
            console.log('Raw response from server:', response);
            console.log('Response data:', response.data);
    
            if (response.data.status === 'success') {
                // Correggiamo l'accesso ai dati - c'è un data nested
                const responseData = response.data.data.data;  // Nota il doppio .data
                
                console.log('Processed data:', responseData);
    
                setUsers(responseData.users || []);  // Aggiungiamo fallback array vuoto
                setTotalUsers(responseData.total || 0);  // Aggiungiamo fallback a 0
                setError(null);
                
                return {
                    users: responseData.users || [],
                    total: responseData.total || 0,
                    page: responseData.page || 1,
                    limit: responseData.limit || 10
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error in getUsers:', error);
            const errorMessage = error.response?.data?.error?.message || 'Errore nel caricamento degli utenti';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };


    const createUser = async (userData) => {
        try {
            const validationErrors = validateUserData(userData, true);
            if (validationErrors) {
                throw new Error('Validation Error', { cause: validationErrors });
            }

            const response = await axiosInstance.post('/users', userData);
            
            if (response.data.status === 'success') {
                setUsers(prev => [...prev, response.data.data.user]);
                showNotification('Utente creato con successo', 'success');
                return response.data.data.user;
            }
        } catch (error) {
            if (error.message === 'Validation Error') {
                showNotification('Dati utente non validi', 'error');
                throw error.cause;
            }
            const errorMessage = error.response?.data?.error?.message || 'Errore nella creazione dell\'utente';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    const updateUser = async (userId, userData) => {
        try {
            const validationErrors = validateUserData(userData);
            if (validationErrors) {
                throw new Error('Validation Error', { cause: validationErrors });
            }

            const response = await axiosInstance.put(`/users/${userId}`, userData);
            
            if (response.data.status === 'success') {
                setUsers(prev => prev.map(user => 
                    user._id === userId ? response.data.data.user : user
                ));
                showNotification('Utente aggiornato con successo', 'success');
                return response.data.data.user;
            }
        } catch (error) {
            if (error.message === 'Validation Error') {
                showNotification('Dati utente non validi', 'error');
                throw error.cause;
            }
            const errorMessage = error.response?.data?.error?.message || 'Errore nell\'aggiornamento dell\'utente';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };


    const deleteUser = async (userId) => {
        try {
            const response = await axiosInstance.delete(`/users/${userId}`);
            
            if (response.data.status === 'success') {
                setUsers(prev => prev.filter(user => user._id !== userId));
                showNotification('Utente eliminato con successo', 'success');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nell\'eliminazione dell\'utente';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    const validateUserData = (userData, isNewUser = false) => {
        const errors = {};
        
        // Validazione secondo lo schema mongoose
        if (!userData.firstName?.trim()) {
            errors.firstName = 'Nome richiesto';
        }
        if (!userData.lastName?.trim()) {
            errors.lastName = 'Cognome richiesto';
        }
        if (!userData.email?.trim() || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(userData.email)) {
            errors.email = 'Email non valida';
        }
        if (isNewUser && (!userData.password || userData.password.length < 8)) {
            errors.password = 'La password deve essere di almeno 8 caratteri';
        }
        if (!userData.role || !['teacher', 'admin'].includes(userData.role)) {
            errors.role = 'Ruolo non valido';
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const getUserById = async (userId) => {
        try {
            const response = await axiosInstance.get(`/users/${userId}`);
            if (response.data.status === 'success') {
                return response.data.data.user;
            }
            throw new Error('Utente non trovato');
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nel recupero dell\'utente';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };
    
    const getUserHistory = async (userId) => {
        try {
            const response = await axiosInstance.get(`/users/${userId}/history`);
            if (response.data.status === 'success') {
                return response.data.data.history;
            }
            return [];
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nel recupero dello storico';
            showNotification(errorMessage, 'error');
            return [];
        }
    };
    
    const terminateSession = async (userId, sessionId) => {
        try {
            const response = await axiosInstance.delete(`/users/${userId}/sessions/${sessionId}`);
            if (response.data.status === 'success') {
                showNotification('Sessione terminata con successo', 'success');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nella terminazione della sessione';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };


    const value = {
        users,
        loading,
        error,
        totalUsers,
        getUsers,
        getUserById,
        getUserHistory,
        createUser,
        updateUser,
        deleteUser,
        validateUserData,
        terminateSession
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;