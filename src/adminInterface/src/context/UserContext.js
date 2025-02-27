// src/context/UserContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0); // Aggiunto per la paginazione
    const { showNotification } = useNotification();

  // Wrappa getUsers in useCallback
  const getUsers = useCallback(async (filters = {}) => {
    try {
        setLoading(true);
        console.log('UserContext: Getting users with filters:', filters);
        
        const queryParams = new URLSearchParams({
            page: filters.page || 1,
            limit: filters.limit || 10,
            search: filters.search || '',
            sort: filters.sort || '-createdAt'
        });

        if (filters.schoolId) {
            queryParams.append('schoolId', filters.schoolId);
        }

        if (filters.role) {
            queryParams.append('role', filters.role);
        }

        const response = await axiosInstance.get(`/users?${queryParams.toString()}`);
        
        if (response.data.status === 'success') {
            const { users, total, page: currentPage } = response.data.data.data;
            
            setUsers(users || []);
            setTotalUsers(total || 0);
            setError(null);
            
            return {
                users,
                total,
                page: currentPage,
                limit: filters.limit
            };
        }
        
        throw new Error('Struttura dati non valida');
    } catch (error) {
        console.error('UserContext: Error in getUsers:', error);
        setError(error.message);
        showNotification(error.message, 'error');
        
        return {
            users: [],
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 10
        };
    } finally {
        setLoading(false);
    }
}, []); // dipende solo da showNotification che è stabile

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

    const getSchoolTeachers = async (schoolId) => {
        try {
            console.log('Fetching teachers for school:', schoolId);
            const response = await axiosInstance.get(`/users/school/${schoolId}/teachers`);
            
            console.log('Raw server response:', response.data);
    
            // Verifica la struttura corretta
            if (response.data.status === 'success' && 
                response.data.data?.data?.teachers && 
                Array.isArray(response.data.data.data.teachers)) {
                
                const teachers = response.data.data.data.teachers;
                console.log('Teachers extracted successfully:', teachers);
                return teachers;
            } else {
                // Proviamo a trovare i teachers nella struttura
                let teachers = null;
                
                if (response.data.data?.teachers) {
                    teachers = response.data.data.teachers;
                } else if (response.data.data?.data?.teachers) {
                    teachers = response.data.data.data.teachers;
                }
    
                if (Array.isArray(teachers)) {
                    console.log('Teachers found in alternative structure:', teachers);
                    return teachers;
                }
    
                console.error('Could not find teachers in response structure:', response.data);
                throw new Error('Struttura risposta non valida');
            }
        } catch (error) {
            console.error('Error fetching school teachers:', error);
            showNotification('Errore nel caricamento degli insegnanti', 'error');
            return [];
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


/**
 * Aggiorna un utente esistente
 * @param {string} userId - ID dell'utente
 * @param {Object} userData - Dati da aggiornare
 * @returns {Promise<Object>} - Utente aggiornato
 */
const updateUser = async (userId, userData) => {
    try {
        // Assicuriamoci che userId sia valido
        if (!userId) {
            console.error("ID utente mancante");
            throw new Error("ID utente mancante");
        }
        
        console.log(`Aggiornamento utente ${userId} con dati:`, userData);
        
        // Se includes testAccessLevel, assicuriamoci che sia un numero
        if (userData && 'testAccessLevel' in userData) {
            userData.testAccessLevel = Number(userData.testAccessLevel);
            console.log(`testAccessLevel convertito a numero:`, userData.testAccessLevel);
        }
        
        // Determina se è un aggiornamento parziale
        const isPartialUpdate = 
            (userData && userData.permissions !== undefined) || 
            (userData && userData.testAccessLevel !== undefined) ||
            (userData && userData.hasAdminAccess !== undefined);
            
        console.log("Tipo di aggiornamento:", isPartialUpdate ? "Parziale" : "Completo");
        
        // Validazione con supporto per aggiornamenti parziali
        const validationErrors = validateUserData(userData, false, isPartialUpdate);
        
        if (validationErrors) {
            console.error('Errori di validazione:', validationErrors);
            throw new Error('Validation Error');
        }
        
        // Chiamata API
        const response = await axiosInstance.put(`/users/${userId}`, userData);
        
        console.log(`Risposta completa dal server:`, response);
        console.log(`Dati della risposta:`, response.data);
        
        // Verifica che la risposta abbia il formato corretto
        if (response.data && response.data.status === 'success') {
            // CORREZIONE: Gestisci diversi possibili formati della risposta
            let updatedUser;
            
            // Opzione 1: user è direttamente nell'oggetto data
            if (response.data.data && response.data.data.user) {
                updatedUser = response.data.data.user;
                console.log("Utente trovato in response.data.data.user:", updatedUser);
            } 
            // Opzione 2: l'intero oggetto data è l'utente
            else if (response.data.data) {
                updatedUser = response.data.data;
                console.log("Utente trovato in response.data.data:", updatedUser);
            }
            // Opzione 3: non c'è un utente nella risposta, ricarica l'utente
            else {
                console.log("Utente non trovato nella risposta, ricarico i dati");
                try {
                    // Ricarica i dati dell'utente
                    updatedUser = await getUserById(userId);
                    console.log("Utente ricaricato:", updatedUser);
                } catch (err) {
                    console.error("Errore nel recupero dell'utente aggiornato:", err);
                    // Prosegui comunque, al peggio non aggiorniamo la UI ma è già stato aggiornato sul DB
                }
            }
            
            // Anche se non abbiamo l'utente, mostriamo un messaggio di successo
            // perché sappiamo che l'update nel DB è avvenuto
            if (!updatedUser) {
                console.warn("Non è stato possibile recuperare i dati dell'utente aggiornato");
                showNotification('Aggiornamento eseguito, ma è necessario ricaricare la pagina per vedere le modifiche', 'warning');
                return null;
            }
            
            // Aggiorna lo stato con l'utente recuperato
            setUsers(prev => prev.map(user => 
                user._id === userId ? updatedUser : user
            ));
            
            showNotification('Utente aggiornato con successo', 'success');
            return updatedUser;
        } else {
            console.error('Risposta del server non valida:', response.data);
            throw new Error('Risposta del server non valida');
        }
    } catch (error) {
        console.error('Errore completo:', error);
        
        // Gestisci diversi tipi di errori
        if (error.message === 'Validation Error') {
            showNotification('Dati utente non validi. Verifica i campi inseriti.', 'error');
            throw error;
        }
        
        if (error.response?.data?.error) {
            const serverError = error.response.data.error;
            console.error('Errore dal server:', serverError);
            showNotification(serverError.message || 'Errore dal server', 'error');
            throw new Error(serverError.message || 'Errore dal server');
        }
        
        // Errore generico
        const errorMessage = error.message || 'Errore nell\'aggiornamento dell\'utente';
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

/**
 * Cambia lo stato di un utente (attivo/inattivo/sospeso)
 * @param {string} userId - ID dell'utente
 * @param {string} newStatus - Nuovo stato (active, inactive, suspended)
 * @returns {Promise<Object>} - Utente aggiornato
 */
const changeUserStatus = async (userId, newStatus) => {
    try {
        setLoading(true);
        
        if (!userId) {
            throw new Error('ID utente mancante');
        }
        
        if (!['active', 'inactive', 'suspended'].includes(newStatus)) {
            throw new Error('Stato non valido');
        }
        
        console.log(`Cambio stato utente ${userId} a ${newStatus}`);
        
        const response = await axiosInstance.put(`/users/${userId}/status`, { 
            status: newStatus 
        });
        
        if (response.data.status === 'success') {
            let updatedUser;
            
            // Gestione delle diverse possibili strutture di risposta
            if (response.data.data?.user) {
                updatedUser = response.data.data.user;
            } else if (response.data.data) {
                updatedUser = response.data.data;
            } else {
                // Se non troviamo l'utente nella risposta, ricarichiamolo
                updatedUser = await getUserById(userId);
            }
            
            if (updatedUser) {
                // Aggiorna lo stato locale
                setUsers(prev => prev.map(user => 
                    user._id === userId ? updatedUser : user
                ));
                
                // Messaggio personalizzato in base all'operazione
                let message = '';
                if (newStatus === 'active') {
                    message = 'Utente riattivato con successo';
                } else if (newStatus === 'inactive') {
                    message = 'Utente disattivato con successo';
                } else {
                    message = 'Stato utente aggiornato con successo';
                }
                
                showNotification(message, 'success');
                return updatedUser;
            }
        }
        
        throw new Error('Risposta del server non valida');
    } catch (error) {
        console.error('Errore nel cambio stato utente:', error);
        const errorMessage = error.response?.data?.error?.message || 
                            error.message || 
                            'Errore durante il cambio stato dell\'utente';
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};

/**
 * Valida i dati utente, supportando sia la creazione che l'aggiornamento parziale
 * @param {Object} userData - Dati utente da validare
 * @param {boolean} isNewUser - Indica se è un nuovo utente (true) o un aggiornamento (false)
 * @param {boolean} isPartialUpdate - Indica se si tratta di un aggiornamento parziale (true) o completo (false)
 * @returns {Object|null} - Errori di validazione o null se tutto ok
 */
const validateUserData = (userData, isNewUser = false, isPartialUpdate = false) => {
    console.log("Validating user data:", userData, "isNewUser:", isNewUser, "isPartialUpdate:", isPartialUpdate);
    
    // Se i dati sono vuoti o nulli, fallisce immediatamente
    if (!userData) {
        console.error("userData è null o undefined");
        return { general: "Dati utente mancanti" };
    }
    
    const errors = {};
    
    if (isPartialUpdate) {
        // Per aggiornamenti parziali, valida solo i campi presenti
        console.log("Performing partial validation");
        
        if ('email' in userData) {
            if (!userData.email?.trim() || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(userData.email)) {
                errors.email = 'Email non valida';
            }
        }
        
        if ('firstName' in userData && !userData.firstName?.trim()) {
            errors.firstName = 'Nome richiesto';
        }
        
        if ('lastName' in userData && !userData.lastName?.trim()) {
            errors.lastName = 'Cognome richiesto';
        }
        
        if ('role' in userData) {
            const validRoles = ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health', 'student'];
            if (!validRoles.includes(userData.role)) {
                errors.role = 'Ruolo non valido';
            }
        }
        
        // Non validare i campi che non sono inclusi nei dati
        console.log("Partial validation completed with errors:", Object.keys(errors).length > 0 ? errors : "No errors");
    } else {
        // Validazione completa per creazione o aggiornamento completo
        console.log("Performing full validation");
        
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
        
        const validRoles = ['admin', 'developer', 'manager', 'pcto', 'teacher', 'tutor', 'researcher', 'health', 'student'];
        if (!userData.role || !validRoles.includes(userData.role)) {
            errors.role = 'Ruolo non valido';
        }
        
        console.log("Full validation completed with errors:", Object.keys(errors).length > 0 ? errors : "No errors");
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
        getSchoolTeachers,
        getUserHistory,
        createUser,
        updateUser,
        deleteUser,
        validateUserData,
        terminateSession,
        changeUserStatus
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