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

    const getUsers = async (page = 1, limit = 10, search = '') => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/users', {
                params: { page, limit, search }
            });
            
            if (response.data.status === 'success') {
                setUsers(response.data.data.users);
                setTotalUsers(response.data.data.total);
                setError(null);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nel caricamento degli utenti';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (userData) => {
        try {
            // Validazione dati utente secondo lo schema mongoose
            if (!userData.firstName?.trim() || !userData.lastName?.trim() || 
                !userData.email?.trim() || !userData.password || !userData.role) {
                throw new Error('Dati utente incompleti');
            }

            const response = await axiosInstance.post('/users', userData);
            
            if (response.data.status === 'success') {
                setUsers(prev => [...prev, response.data.data.user]);
                showNotification('Utente creato con successo', 'success');
                return response.data.data.user;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nella creazione dell\'utente';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    const updateUser = async (userId, userData) => {
        try {
            const response = await axiosInstance.put(`/users/${userId}`, userData);
            
            if (response.data.status === 'success') {
                setUsers(prev => prev.map(user => 
                    user._id === userId ? response.data.data.user : user
                ));
                showNotification('Utente aggiornato con successo', 'success');
                return response.data.data.user;
            }
        } catch (error) {
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

    const value = {
        users,
        loading,
        error,
        totalUsers,
        getUsers,
        createUser,
        updateUser,
        deleteUser,
        validateUserData
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