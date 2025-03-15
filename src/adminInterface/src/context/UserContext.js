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
// Modifica alla funzione getUsers nel UserContext.js
const getUsers = useCallback(async (filters = {}) => {
    try {
        setLoading(true);
        console.log('UserContext: Getting users with filters:', filters);
        
        const queryParams = new URLSearchParams({
            page: filters.page || 1,
            limit: filters.limit || 50, // Aumentato a 50 per ottenere più utenti
            search: filters.search || '',
            sort: filters.sort || '-createdAt',
            includeSchoolIds: 'true' // Aggiungi questo parametro per richiedere assignedSchoolIds
        });
  
        if (filters.schoolId) {
            queryParams.append('schoolId', filters.schoolId);
        }
  
        if (filters.role) {
            queryParams.append('role', filters.role);
        }
  
        if (filters.status) {
            queryParams.append('status', filters.status);
        }
  
        console.log('UserContext: Fetching users with params:', queryParams.toString());
        const response = await axiosInstance.get(`/users?${queryParams.toString()}`);
        
        if (response.data.status === 'success') {
            let users = [];
            let total = 0;
            let currentPage = 1;
            
            // Gestisci diverse strutture di risposta possibili
            if (response.data.data?.data?.users) {
                users = response.data.data.data.users;
                total = response.data.data.data.total || users.length;
                currentPage = response.data.data.data.page || 1;
            } else if (response.data.data?.users) {
                users = response.data.data.users;
                total = response.data.data.total || users.length;
                currentPage = response.data.data.page || 1;
            } else if (Array.isArray(response.data.data)) {
                users = response.data.data;
                total = users.length;
            }
            
            // Log per debug: verifica se gli utenti hanno assignedSchoolIds
            console.log('UserContext: Users received from API:', {
                count: users.length,
                withSchoolIds: users.filter(u => u.assignedSchoolIds?.length > 0).length,
                sample: users.slice(0, 3).map(u => ({
                    id: u._id,
                    name: `${u.firstName} ${u.lastName}`,
                    role: u.role,
                    hasSchoolIds: !!u.assignedSchoolIds,
                    schoolIdsCount: u.assignedSchoolIds?.length || 0
                }))
            });
            
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
}, [showNotification]); // dipende solo da showNotification che è stabile

    const getUserById = async (userId) => {
        try {
            console.log('UserContext: Fetching user details for ID:', userId);
            const response = await axiosInstance.get(`/users/${userId}`);
            
            console.log('UserContext: Raw response:', response.data);
    
            // Handle different possible response structures
            let userData = null;
            
            if (response.data.status === 'success') {
                // Case 1: response.data.data.data.user (original expected structure)
                if (response.data.data?.data?.user) {
                    userData = response.data.data.data.user;
                    console.log('UserContext: Found user in data.data.data.user');
                }
                // Case 2: response.data.data.user (structure seen in the error)
                else if (response.data.data?.user) {
                    userData = response.data.data.user;
                    console.log('UserContext: Found user in data.data.user');
                }
                // Case 3: response.data.data is the user object directly
                else if (response.data.data && response.data.data._id) {
                    userData = response.data.data;
                    console.log('UserContext: Found user in data.data');
                }
                
                if (userData) {
                    console.log('UserContext: Processed user data:', userData);
                    return userData;
                }
            }
            
            console.error('UserContext: Invalid response structure:', response.data);
            throw new Error('Dati utente non trovati nella risposta');
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

        // Ottieni prima i dettagli dell'utente per verificare se è un'operazione di riattivazione
        const currentUser = await getUserById(userId);
        const isReactivation = currentUser.status === 'inactive' && newStatus === 'active';

        // Dati da inviare al server
        const dataToSend = { status: newStatus };

        // Se stiamo riattivando un utente che è stato soft-deleted
        if (isReactivation) {
            console.log("Riattivando utente che era stato disattivato");
            
            // Controlla se l'email è stata modificata durante la disattivazione
            if (currentUser.email && currentUser.email.startsWith('deleted_')) {
                console.log("Ripristino email originale");
                
                // Prova a estrarre l'email originale dal formato "deleted_timestamp_email"
                const emailParts = currentUser.email.split('_');
                if (emailParts.length >= 3) {
                    // Ricostruisci l'email originale eliminando "deleted_timestamp_"
                    const originalEmail = emailParts.slice(2).join('_');
                    dataToSend.email = originalEmail;
                    console.log("Email originale estratta:", originalEmail);
                }
            }

            // Ripristina anche altri campi che potrebbero essere stati cancellati
            dataToSend.isDeleted = false;
            dataToSend.deletedAt = null;
            
            console.log("Dati completi per la riattivazione:", dataToSend);
        }
        
        const response = await axiosInstance.put(`/users/${userId}/status`, dataToSend);
        
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
        console.log(`Recuperando lo storico per l'utente ${userId}`);
        const response = await axiosInstance.get(`/users/${userId}/history`);
        
        console.log('Risposta completa dal server per lo storico:', response);
        console.log('Struttura risposta:', response.data);
        
        // Funzione ausiliaria per trovare in modo ricorsivo l'array dello storico
        const findHistoryArray = (obj) => {
            // Se è null o undefined, ritorna null
            if (!obj) return null;
            
            // Se è già un array, verificare che sembri uno storico (ha userId, action, ecc.)
            if (Array.isArray(obj)) {
                // Verifica che contenga almeno un elemento con campi tipici dello storico
                if (obj.length > 0 && (obj[0].action || obj[0].userId)) {
                    console.log('Trovato array storico:', obj.length, 'elementi');
                    return obj;
                }
                return null;
            }
            
            // Se è un oggetto, cerca nelle proprietà
            if (typeof obj === 'object') {
                // Cerca prima nelle proprietà che più probabilmente contengono lo storico
                if (obj.history && Array.isArray(obj.history)) {
                    console.log('Trovato history array:', obj.history.length, 'elementi');
                    return obj.history;
                }
                
                // Altrimenti, cerca ricorsivamente nelle proprietà
                for (const key in obj) {
                    const result = findHistoryArray(obj[key]);
                    if (result) return result;
                }
            }
            
            return null;
        };
        
        // Cerca l'array dello storico nella risposta
        const historyArray = findHistoryArray(response.data);
        
        if (historyArray) {
            return historyArray;
        }
        
        // Se non troviamo l'array, logga un errore dettagliato
        console.error('Impossibile trovare un array di dati storico nella risposta:', response.data);
        
        // In caso di fallimento, ritorna un array vuoto
        return [];
    } catch (error) {
        console.error('Errore completo nel recupero dello storico:', error);
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