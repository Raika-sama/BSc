// src/context/SchoolContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';
import { useNavigate } from 'react-router-dom';

const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalSchools, setTotalSchools] = useState(0);
    const { showNotification } = useNotification();
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [currentSchool, setCurrentSchool] = useState(null);
    const navigate = useNavigate();

    const validateSchoolData = (schoolData, isPartialUpdate = true) => {
        const errors = {};
    
        // Se è un aggiornamento parziale, validare solo i campi presenti
        if (isPartialUpdate) {
            // Nome
            if ('name' in schoolData && !schoolData.name?.trim()) {
                errors.name = 'Nome scuola richiesto';
            }
    
            // Tipo scuola
            if ('schoolType' in schoolData && !['middle_school', 'high_school'].includes(schoolData.schoolType)) {
                errors.schoolType = 'Tipo scuola non valido';
            }
    
            // Tipo istituto in base al tipo di scuola
            if ('schoolType' in schoolData && 'institutionType' in schoolData) {
                if (schoolData.schoolType === 'middle_school') {
                    if (schoolData.institutionType !== 'none') {
                        errors.institutionType = 'Le scuole medie devono avere tipo istituto impostato come "nessuno"';
                    }
                } else if (schoolData.schoolType === 'high_school') {
                    if (!['scientific', 'classical', 'artistic', 'none'].includes(schoolData.institutionType)) {
                        errors.institutionType = 'Tipo istituto non valido per scuola superiore';
                    }
                }
            }
    
            // Regione
            if ('region' in schoolData && !schoolData.region?.trim()) {
                errors.region = 'Regione richiesta';
            }
    
            // Provincia
            if ('province' in schoolData && !schoolData.province?.trim()) {
                errors.province = 'Provincia richiesta';
            }
    
            // Indirizzo
            if ('address' in schoolData && !schoolData.address?.trim()) {
                errors.address = 'Indirizzo richiesto';
            }
        } else {
            // La logica originale per la validazione completa
            // (mantenere il codice esistente qui)
        }
    
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const getSchools = async () => {
        return await fetchSchools(1, 1000);
    };

    const getSchoolById = async (id) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching school with ID:', id);
            
            const response = await axiosInstance.get(`/schools/${id}`);
            console.log('School data received:', response.data);
            
            if (response.data.status === 'success') {
                const school = response.data.data.school;
                // Aggiorna lo stato interno
                setSelectedSchool(school);
                // Restituisci i dati
                return school;
            }
            return null;
        } catch (err) {
            console.error('Error fetching school:', err);
            setError(err.message || 'Errore nel caricamento della scuola');
            showNotification('Errore nel caricamento della scuola', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = useCallback(async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit,
                populate: 'manager',
                ...filters
            });
            
            console.log('Fetching schools with params:', queryParams.toString());
            const response = await axiosInstance.get(`/schools?${queryParams}`);
            
            if (response.data.status === 'success') {
                console.log('Schools received:', response.data.data.schools);
                const formattedSchools = response.data.data.schools.map(school => ({
                    ...school,
                    manager: school.manager ? {
                        _id: school.manager._id,
                        firstName: school.manager.firstName,
                        lastName: school.manager.lastName,
                        email: school.manager.email
                    } : null,
                    sections: Array.isArray(school.sections) ? school.sections.map(section => ({
                        name: section.name,
                        maxStudents: section.maxStudents || 0
                    })) : []
                }));
    
                setSchools(formattedSchools);
                setTotalSchools(response.data.results);
                return formattedSchools; // Ritorna i dati formattati
            }
            return []; // Ritorna un array vuoto se non ci sono dati
        } catch (error) {
            console.error('Error fetching schools:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel caricamento delle scuole';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            return []; // Ritorna un array vuoto in caso di errore
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const getSchoolsByRegion = async (region) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`/schools/region/${region}`);
            if (response.data.status === 'success') {
                return response.data.data.schools;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nel caricamento delle scuole per regione';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getSchoolsByType = async (type) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`/schools/type/${type}`);
            if (response.data.status === 'success') {
                return response.data.data.schools;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nel caricamento delle scuole per tipo';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const createSchool = async (schoolData) => {
        const validationErrors = validateSchoolData(schoolData);
        if (validationErrors) {
            console.log('Validation errors in SchoolContext:', validationErrors);
            throw { response: { data: { error: { errors: validationErrors } } } };
        }
    
        setLoading(true);
        setError(null);
        try {
            console.log('Making API request to create school:', schoolData);
            
            const response = await axiosInstance.post('/schools', schoolData);
            console.log('API response:', response);
            
            if (response.data.status === 'success') {
                const newSchool = response.data.data.school;
                setSchools(prev => [...prev, newSchool]);
                showNotification(
                    `Scuola "${newSchool.name}" creata con successo! Configurazione iniziale in corso...`,
                    'success'
                );
                return newSchool;
            } else {
                console.log('Unexpected response format:', response);
                throw new Error('Risposta API non valida');
            }
        } catch (error) {
            console.error('Error in createSchool:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
    
            const errorMessage = error.response?.data?.error?.message || 'Errore nella creazione della scuola';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateSchool = async (id, schoolData) => {
        try {
            console.log('### SchoolContext - Dati ricevuti per update:', schoolData);
            const validationErrors = validateSchoolData(schoolData);
            if (validationErrors) {
                console.log('### SchoolContext - Errori di validazione:', validationErrors);
                throw { response: { data: { error: { errors: validationErrors } } } };
            }
    
            setLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.put(`/schools/${id}`, schoolData);
                
                if (response.data.status === 'success') {
                    // Aggiorna lo stato locale
                    setSchools(prev => prev.map(school => 
                        school._id === id ? response.data.data.school : school
                    ));
                    
                    // Aggiorna anche selectedSchool se è quella che stiamo modificando
                    if (selectedSchool && selectedSchool._id === id) {
                        setSelectedSchool(response.data.data.school);
                    }
                    
                    showNotification('Scuola aggiornata con successo', 'success');
                    return response.data.data.school;
                }
            } catch (error) {
                console.log('### SchoolContext - Errore nella risposta:', error);
                const errorMessage = error.response?.data?.error?.message || 'Errore nell\'aggiornamento della scuola';
                setError(errorMessage);
                showNotification(errorMessage, 'error');
                throw error;
            } finally {
                setLoading(false);
            }
        } catch (error) {
            throw error;
        }
    };

    const deleteSchool = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.delete(`/schools/${id}`);
            
            if (response.data.status === 'success') {
                setSchools(prev => prev.filter(school => school._id !== id));
                showNotification('Scuola eliminata con successo', 'success');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nell\'eliminazione della scuola';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const addUserToSchool = async (schoolId, userId, role = 'teacher') => {
        try {
            const response = await axiosInstance.post(`/schools/${schoolId}/users`, {
                userId,
                role
            });
    
            if (response.data.status === 'success') {
                showNotification('Utente aggiunto alla scuola con successo', 'success');
                return response.data.data.school;
            }
        } catch (error) {
            console.error('Error adding user to school:', error);
            const errorMessage = error.response?.data?.error?.message || 'Errore nell\'aggiunta dell\'utente alla scuola';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    const removeUserFromSchool = async (schoolId, userId) => {
        try {
            setLoading(true);
            setError(null);
    
            console.log('Removing user from school:', { schoolId, userId });
    
            const response = await axiosInstance.delete(`/schools/${schoolId}/users`, {
                data: { userId }
            });
    
            if (response.data.status === 'success') {
                // Aggiorna lo stato locale
                if (selectedSchool?._id === schoolId) {
                    setSelectedSchool(prev => {
                        if (!prev) return null;
                        
                        return {
                            ...prev,
                            users: prev.users.filter(u => {
                                const userIdToCheck = u.user._id || u.user;
                                return userIdToCheck.toString() !== userId.toString();
                            })
                        };
                    });
                }
                
                // Aggiorna la lista scuole se necessario
                setSchools(prev => 
                    prev.map(school => {
                        if (school._id === schoolId) {
                            return {
                                ...school,
                                users: school.users.filter(u => {
                                    const userIdToCheck = u.user._id || u.user;
                                    return userIdToCheck.toString() !== userId.toString();
                                })
                            };
                        }
                        return school;
                    })
                );
    
                showNotification(
                    response.data.message || 'Utente rimosso dalla scuola con successo', 
                    'success'
                );
                
                return response.data;
            }
        } catch (error) {
            console.error('Error removing user from school:', error);
            const errorMessage = error.response?.data?.error?.message || 
                              'Errore nella rimozione dell\'utente dalla scuola';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    
    /**
     * Crea un nuovo utente e lo associa immediatamente alla scuola
     * @param {string} schoolId - ID della scuola
     * @param {Object} userData - Dati del nuovo utente
     * @returns {Promise<Object>} - Utente creato e scuola aggiornata
     */
    const createAndAssociateUser = async (schoolId, userData) => {
        try {
            setLoading(true);
            setError(null);

            console.log('Creating new user and associating to school:', { 
                schoolId, 
                userData: {...userData, password: '[REDACTED]'} 
            });

            // Validazione
            const validationErrors = validateUserData(userData);
            if (validationErrors) {
                throw { response: { data: { error: { errors: validationErrors } } } };
            }

            // Chiama la nuova API endpoint
            const response = await axiosInstance.post(`/schools/${schoolId}/create-user`, userData);
            
            if (response.data.status === 'success') {
                // Aggiorna la scuola selezionata se necessario
                if (selectedSchool?._id === schoolId) {
                    await getSchoolById(schoolId); // Ricarica i dati completi della scuola
                }
                
                showNotification('Utente creato e associato alla scuola con successo', 'success');
                return response.data.data;
            } else {
                throw new Error('Formato risposta non valido');
            }
        } catch (error) {
            console.error('Error creating and associating user:', error);
            const errorMessage = error.response?.data?.error?.message || 
                            'Errore nella creazione dell\'utente';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const addMultipleUsersToSchool = async (schoolId, usersData) => {
        try {
            setLoading(true);
            setError(null);
    
            console.log('Adding multiple users to school:', { schoolId, usersCount: usersData.length });
    
            // Array per tenere traccia delle promesse di aggiunta
            const addPromises = [];
            const successfulAdds = [];
            const failedAdds = [];
    
            // Creiamo una promessa per ogni utente da aggiungere
            for (const userData of usersData) {
                const promise = axiosInstance.post(`/schools/${schoolId}/users`, {
                    userId: userData.userId,
                    role: userData.role
                })
                .then(response => {
                    if (response.data.status === 'success') {
                        successfulAdds.push(userData.userId);
                        return response.data;
                    }
                })
                .catch(error => {
                    console.error('Error adding user:', { userId: userData.userId, error });
                    failedAdds.push(userData.userId);
                    return null;
                });
    
                addPromises.push(promise);
            }
    
            // Attendiamo che tutte le promesse siano risolte
            await Promise.all(addPromises);
    
            // Aggiorniamo la scuola selezionata dopo tutte le aggiunte
            if (successfulAdds.length > 0) {
                // Dopo aver aggiunto gli utenti, ricarica i dettagli della scuola
                await getSchoolById(schoolId);
                
                showNotification(
                    `${successfulAdds.length} utenti aggiunti con successo${failedAdds.length > 0 ? `, ${failedAdds.length} non aggiunti` : ''}`,
                    'success'
                );
            } else if (failedAdds.length > 0) {
                showNotification(
                    `Nessun utente aggiunto. Ci sono stati ${failedAdds.length} errori.`,
                    'error'
                );
            }
    
            return {
                successCount: successfulAdds.length,
                failCount: failedAdds.length,
                totalCount: usersData.length
            };
        } catch (error) {
            console.error('Error in bulk user addition:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'aggiunta di utenti alla scuola';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };    

    const removeManagerFromSchool = async (schoolId) => {
        try {
            setLoading(true);
            setError(null);
    
            const response = await axiosInstance.post(
                `/schools/${schoolId}/remove-manager`
            );
    
            if (response.data.status === 'success') {
                const updatedSchool = response.data.data.school;
                const oldManagerId = response.data.data.oldManagerId;
                
                // Aggiorna lo stato locale
                setSchools(prev => prev.map(school => 
                    school._id === schoolId ? {
                        ...school,
                        manager: null,
                        users: school.users.filter(u => 
                            u.user._id !== oldManagerId
                        )
                    } : school
                ));
    
                if (selectedSchool?._id === schoolId) {
                    setSelectedSchool(prev => ({
                        ...prev,
                        manager: null,
                        users: prev.users.filter(u => 
                            u.user._id !== oldManagerId
                        )
                    }));
                }
    
                showNotification('Manager rimosso con successo', 'success');
                return updatedSchool;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nella rimozione del manager';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const addManagerToSchool = async (schoolId, userId) => {
        try {
            setLoading(true);
            setError(null);
    
            const response = await axiosInstance.post(
                `/schools/${schoolId}/add-manager`,
                { userId }
            );
    
            if (response.data.status === 'success') {
                const updatedSchool = response.data.data.school;
                
                // Aggiorna solo il manager, non l'array users
                setSchools(prev => prev.map(school => 
                    school._id === schoolId ? {
                        ...school,
                        manager: userId
                    } : school
                ));
    
                if (selectedSchool?._id === schoolId) {
                    setSelectedSchool(prev => ({
                        ...prev,
                        manager: userId
                    }));
                }
    
                showNotification('Manager aggiunto con successo', 'success');
                return updatedSchool;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'aggiunta del manager';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const fetchAvailableManagers = async () => {
        try {
            setLoading(true);
            console.log('Iniziando fetchAvailableManagers...');
            
            const response = await axiosInstance.get('/users/available-managers');
            console.log('Risposta completa:', response);
            
            if (response.data.status === 'success' && response.data.data.users) {
                console.log('Manager disponibili:', response.data.data.users);
                setAvailableManagers(response.data.data.users);
            } else {
                console.log('Risposta non valida:', response.data);
            }
        } catch (error) {
            console.error('Errore dettagliato:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            showNotification('Errore nel caricamento dei manager disponibili', 'error');
        } finally {
            setLoading(false);
        }
    };
    

    // Metodo per recuperare le sezioni di una scuola
     // Modifichiamo anche getSections per usare il nuovo stato
     const getSections = useCallback(async (schoolId, includeInactive = false) => {
        try {
            setLoading(true);
            setError(null);
            
            // Rimuoviamo il parametro query includeInactive poiché non lo gestiamo nel backend
            const response = await axiosInstance.get(`/schools/${schoolId}/sections`);
            
            if (response.data.status === 'success') {
                const newSections = response.data.data.sections;
                // Se includeInactive è false, filtriamo qui nel frontend
                const filteredSections = includeInactive 
                    ? newSections 
                    : newSections.filter(section => section.isActive);
                    
                setSections(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(filteredSections)) {
                        return prev;
                    }
                    return filteredSections;
                });
                return filteredSections;
            }
        } catch (error) {
            console.error('Error in getSections:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel recupero delle sezioni';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

// Modifichiamo anche getSectionStudents per usare il nuovo path corretto
const getSectionStudents = async (schoolId, sectionName) => {
    try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get(
            `/schools/${schoolId}/sections/${sectionName}/students`
        );
        
        if (response.data.status === 'success') {
            return response.data.data.students;
        }
        return [];
    } catch (error) {
        console.error('Error in getSectionStudents:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nel recupero degli studenti della sezione';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};

 // I metodi di operazione rimangono ma vengono semplificati
    const deactivateSection = async (schoolId, sectionName) => {
        try {
            setLoading(true);
            setError(null);

            console.log('Deactivating section:', { schoolId, sectionName });

            const response = await axiosInstance.post(
                `/schools/${schoolId}/sections/${sectionName}/deactivate`
            );

            if (response.data.status === 'success') {
                // Aggiorniamo lo stato con i dati aggiornati dal server
                const { school, studentsUpdated } = response.data.data;
                
                // Aggiorna la scuola selezionata con i dati più recenti
                setSelectedSchool(school);

                showNotification(
                    `Sezione disattivata con successo. ${studentsUpdated} studenti aggiornati.`,
                    'success'
                );
                return response.data.data;
            }
        } catch (error) {
            console.error('Error in deactivateSection:', error);
            const errorMessage = error.response?.data?.error?.message || 
                            'Errore nella disattivazione della sezione';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const reactivateSection = async (schoolId, sectionName) => {
        try {
            setLoading(true);
            setError(null);
    
            console.log('Reactivating section:', { schoolId, sectionName });
    
            const response = await axiosInstance.post(
                `schools/${schoolId}/sections/${sectionName}/reactivate`
            );
    
            if (response.data.status === 'success') {
                const { school, classesReactivated } = response.data.data;
                
                // Aggiorna lo stato della scuola
                setSelectedSchool(school);
    
                // Costruisci messaggio di notifica in base al risultato
                let message;
                if (classesReactivated > 0) {
                    message = `Sezione ${sectionName} riattivata con successo. ${classesReactivated} classi riattivate.`;
                } else {
                    message = `Sezione ${sectionName} riattivata con successo.`;
                }
    
                showNotification(message, 'success');
                return response.data.data;
            }
        } catch (error) {
            console.error('Error in reactivateSection:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nella riattivazione della sezione';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const changeSchoolType = async (schoolId, { schoolType, institutionType }) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axiosInstance.post(`/schools/${schoolId}/change-type`, {
                schoolType,
                institutionType
            });
            
            if (response.data.status === 'success') {
                // Aggiorna lo stato locale
                const updatedSchool = response.data.data.school;
                
                setSchools(prev => prev.map(school => 
                    school._id === schoolId ? updatedSchool : school
                ));
                
                if (selectedSchool && selectedSchool._id === schoolId) {
                    setSelectedSchool(updatedSchool);
                }
                
                showNotification('Tipo scuola modificato con successo', 'success');
                return updatedSchool;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel cambio tipo scuola';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    
const setupAcademicYear = async (schoolId, yearData) => {
    try {
        setLoading(true);
        setError(null);
        
        // Validazione del formato dell'anno accademico
        if (!yearData.year || !yearData.year.match(/^\d{4}\/\d{4}$/)) {
            throw {
                response: {
                    data: {
                        error: {
                            message: 'Formato anno non valido. Deve essere YYYY/YYYY'
                        }
                    }
                }
            };
        }
        
        console.log('Creating academic year:', { schoolId, yearData });
        
        const response = await axiosInstance.post(`/schools/${schoolId}/academic-years`, yearData);
        
        if (response.data.status === 'success') {
            showNotification('Anno accademico creato con successo', 'success');
            
            // Aggiorna lo stato della scuola selezionata
            if (selectedSchool && selectedSchool._id === schoolId) {
                await getSchoolById(schoolId);
            }
            
            return response.data.data.school;
        }
    } catch (error) {
        console.error('Error creating academic year:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nella creazione dell\'anno accademico';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};

const activateAcademicYear = async (schoolId, yearId) => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('Activating academic year:', { schoolId, yearId });
        
        const response = await axiosInstance.post(`/schools/${schoolId}/academic-years/${yearId}/activate`);
        
        if (response.data.status === 'success') {
            showNotification('Anno accademico attivato con successo', 'success');
            
            // Aggiorna lo stato della scuola selezionata
            if (selectedSchool && selectedSchool._id === schoolId) {
                await getSchoolById(schoolId);
            }
            
            return response.data.data.school;
        }
    } catch (error) {
        console.error('Error activating academic year:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nell\'attivazione dell\'anno accademico';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};

const archiveAcademicYear = async (schoolId, yearId) => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('Archiving academic year:', { schoolId, yearId });
        
        const response = await axiosInstance.post(`/schools/${schoolId}/academic-years/${yearId}/archive`);
        
        if (response.data.status === 'success') {
            showNotification('Anno accademico archiviato con successo', 'success');
            
            // Aggiorna lo stato della scuola selezionata
            if (selectedSchool && selectedSchool._id === schoolId) {
                await getSchoolById(schoolId);
            }
            
            return response.data.data.school;
        }
    } catch (error) {
        console.error('Error archiving academic year:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nell\'archiviazione dell\'anno accademico';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};

const getClassesByAcademicYear = async (schoolId, academicYear) => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('Getting classes for academic year:', { schoolId, academicYear });
        
        const response = await axiosInstance.get(`/schools/${schoolId}/classes?academicYear=${academicYear}`);
        
        if (response.data.status === 'success') {
            return response.data.data.classes;
        }
        return [];
    } catch (error) {
        console.error('Error getting classes by academic year:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nel recupero delle classi per anno accademico';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        return [];
    } finally {
        setLoading(false);
    }
};

// 1. Aggiungi questa funzione per ottenere l'anteprima della transizione
const getTransitionPreview = async (schoolId, fromYear, toYear) => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('Getting year transition preview:', { schoolId, fromYear, toYear });
        
        const response = await axiosInstance.get(
            `/schools/${schoolId}/transition-preview`,
            { params: { fromYear, toYear } }
        );
        
        if (response.data.status === 'success') {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error('Error getting transition preview:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nel recupero dell\'anteprima della transizione';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        return null;
    } finally {
        setLoading(false);
    }
};

// 2. Aggiungi questa funzione per eseguire la transizione
const executeYearTransition = async (schoolId, transitionData) => {
    try {
        setLoading(true);
        setError(null);
        
        console.log('Executing year transition:', { 
            schoolId, 
            fromYear: transitionData.fromYear,
            toYear: transitionData.toYear,
            exceptionsCount: transitionData.exceptions?.length || 0,
            teacherAssignmentsCount: Object.keys(transitionData.teacherAssignments || {}).length || 0
        });
        
        const response = await axiosInstance.post(
            `/schools/${schoolId}/year-transition`,
            transitionData
        );
        
        if (response.data.status === 'success') {
            showNotification('Transizione anno completata con successo', 'success');
            
            // Aggiorna lo stato della scuola selezionata
            if (selectedSchool && selectedSchool._id === schoolId) {
                await getSchoolById(schoolId);
            }
            
            return response.data.data;
        }
    } catch (error) {
        console.error('Error executing year transition:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nell\'esecuzione della transizione anno';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        throw error;
    } finally {
        setLoading(false);
    }
};

    return (
        <SchoolContext.Provider value={{
            schools,
            loading,
            error,
            totalSchools,
            selectedSchool,
            getSchools,
            getSchoolById,
            fetchSchools,
            getSchoolsByRegion,
            getSchoolsByType,
            createSchool,
            updateSchool,
            deleteSchool,
            addUserToSchool,
            removeUserFromSchool,
            createAndAssociateUser,
            addMultipleUsersToSchool,
            removeManagerFromSchool,
            fetchAvailableManagers,
            addManagerToSchool,
            validateSchoolData,
            getSections,
            getSectionStudents,
            deactivateSection,
            reactivateSection,
            changeSchoolType,
            setupAcademicYear,
            activateAcademicYear,
            archiveAcademicYear,
            getClassesByAcademicYear,
            getTransitionPreview,
            executeYearTransition,
            currentSchool,
            setCurrentSchool
        }}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (!context) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};

export default SchoolContext;