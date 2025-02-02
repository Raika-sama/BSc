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
        const { page = 1, limit = 10, search = '', sort = '-createdAt', schoolId, role } = filters;
        
        setLoading(true);
        try {
            console.log('UserContext: Getting users with filters:', filters);

            const response = await axiosInstance.get('/users', {
                params: { 
                    page, 
                    limit, 
                    search, 
                    sort,
                    schoolId, // Assicurati che questo venga passato
                    role 
                }
            });
    
            console.log('UserContext: Response received:', response.data);

            if (response.data.status === 'success') {
                const { users, total, page: currentPage } = response.data.data.data;
                
                setUsers(users || []);
                setTotalUsers(total || 0);
                setError(null);
                
                return {
                    users,
                    total,
                    page: currentPage,
                    limit
                };
            }
            
            throw new Error('Struttura dati non valida');
        } catch (error) {
            console.error('Error in getUsers:', error);
            setError(error.message);
            showNotification(error.message, 'error');
            
            return {
                users: [],
                total: 0,
                page,
                limit
            };
        } finally {
            setLoading(false);
        }
    };

    const getUserById = async (userId) => {
        try {
            console.log('UserContext: Fetching user details for ID:', userId);
            const response = await axiosInstance.get(`/users/${userId}`);
            
            console.log('UserContext: Raw response:', response.data);
    
            if (response.data.status === 'success' && response.data.data?.data?.user) {
                // Estraiamo l'oggetto user corretto dalla struttura nidificata
                const userData = response.data.data.data.user;
                console.log('UserContext: Processed user data:', userData);
                return userData;
            } else {
                console.error('UserContext: Invalid response structure:', response.data);
                throw new Error('Dati utente non trovati nella risposta');
            }
        } catch (error) {
            console.error('UserContext: Error fetching user details:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               error.message || 
                               'Errore nel recupero dei dettagli utente';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };


    const createUser = async (userData) => {
        try {
            console.log('UserContext: Creating user with data:', userData);
            
            const validationErrors = validateUserData(userData, true);
            if (validationErrors) {
                console.error('Validation errors:', validationErrors);
                throw new Error('Validation Error', { cause: validationErrors });
            }
    
            const response = await axiosInstance.post('/users', userData);
            console.log('Server response:', response);
    
            if (response.data.status === 'success') {
                const newUser = response.data.data.user;
                console.log('New user created:', newUser);
                
                setUsers(prev => [...prev, newUser]);
                showNotification('Utente creato con successo', 'success');
                return newUser;
            } else {
                console.error('Invalid response format:', response.data);
                throw new Error('Formato risposta non valido');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            
            if (error.message === 'Validation Error') {
                showNotification('Dati utente non validi', 'error');
                throw error.cause;
            }
            
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nella creazione dell\'utente';
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
        if (!userData.role || !['teacher', 'manager', 'admin'].includes(userData.role)) {
            errors.role = 'Ruolo non valido';
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
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