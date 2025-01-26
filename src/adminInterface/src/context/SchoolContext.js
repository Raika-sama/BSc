// src/context/SchoolContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalSchools, setTotalSchools] = useState(0);
    const { showNotification } = useNotification();
    const [selectedSchool, setSelectedSchool] = useState(null);

    const validateSchoolData = (schoolData) => {
        const errors = {};
    
        // Validazione nome
        if (!schoolData.name?.trim()) {
            errors.name = 'Nome scuola richiesto';
        }
    
        // Validazione tipo scuola
        if (!['middle_school', 'high_school'].includes(schoolData.schoolType)) {
            errors.schoolType = 'Tipo scuola non valido';
        }
    
        // Validazione tipo istituto in base al tipo di scuola
        if (schoolData.schoolType === 'middle_school') {
            if (schoolData.institutionType !== 'none') {
                errors.institutionType = 'Le scuole medie devono avere tipo istituto impostato come "nessuno"';
            }
        } else if (schoolData.schoolType === 'high_school') {
            if (!['scientific', 'classical', 'artistic', 'none'].includes(schoolData.institutionType)) {
                errors.institutionType = 'Tipo istituto non valido per scuola superiore';
            }
        }
    
        // Validazione sezioni
        if (schoolData.sections) {
            console.log("Validazione sezioni:", schoolData.sections); // Debug
            const invalidSections = schoolData.sections.filter(section => {
                console.log("Validando sezione:", section); // Debug
                return !/^[A-Z]$/.test(section.name);
            });
            
            if (invalidSections.length > 0) {
                errors.sections = 'Le sezioni devono essere lettere maiuscole';
            }
        }
    
        // Validazione numero anni in base al tipo di scuola
        if (schoolData.schoolType === 'middle_school') {
            if (schoolData.numberOfYears !== 3) {
                errors.numberOfYears = 'La scuola media deve avere 3 anni';
            }
        } else if (schoolData.schoolType === 'high_school') {
            if (schoolData.numberOfYears !== 5) {
                errors.numberOfYears = 'La scuola superiore deve avere 5 anni';
            }
        }
    
        // Validazione campi obbligatori
        if (!schoolData.region?.trim()) {
            errors.region = 'Regione richiesta';
        }
    
        if (!schoolData.province?.trim()) {
            errors.province = 'Provincia richiesta';
        }
    
        if (!schoolData.address?.trim()) {
            errors.address = 'Indirizzo richiesto';
        }
    
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const getSchoolById = async (id) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching school with ID:', id);
            
            const response = await axiosInstance.get(`/schools/${id}`);
            console.log('School data received:', response.data);
            
            if (response.data.status === 'success') {
                setSelectedSchool(response.data.data.school);
            }
        } catch (err) {
            console.error('Error fetching school:', err);
            setError(err.message || 'Errore nel caricamento della scuola');
            showNotification('Errore nel caricamento della scuola', 'error');
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
                populate: 'manager', // Aggiungiamo questo per popolare i dati del manager
                ...filters
            });
            
            console.log('Fetching schools with params:', queryParams.toString());
            const response = await axiosInstance.get(`/schools?${queryParams}`);
            
            if (response.data.status === 'success') {
                console.log('Schools received:', response.data.data.schools);
                // Assicuriamoci che i dati del manager siano strutturati correttamente
                const formattedSchools = response.data.data.schools.map(school => ({
                    ...school,
                    manager: school.manager ? {
                        _id: school.manager._id,
                        firstName: school.manager.firstName,
                        lastName: school.manager.lastName,
                        email: school.manager.email
                    } : null,
                    // Formattiamo le sezioni se necessario
                    sections: Array.isArray(school.sections) ? school.sections.map(section => ({
                        name: section.name,
                        maxStudents: section.maxStudents || 0
                    })) : []
                }));
    
                setSchools(formattedSchools);
                setTotalSchools(response.data.results);
            }
        } catch (error) {
            console.error('Error fetching schools:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel caricamento delle scuole';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
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
                setSchools(prev => [...prev, response.data.data.school]);
                showNotification('Scuola creata con successo', 'success');
                return response.data.data.school;
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
                setSchools(prev => prev.map(school => 
                    school._id === id ? response.data.data.school : school
                ));
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
                // Invece di usare setSections, aggiorniamo direttamente selectedSchool
                setSelectedSchool(prevSchool => {
                    if (!prevSchool) return null;
                    
                    return {
                        ...prevSchool,
                        sections: prevSchool.sections.map(section => 
                            section.name === sectionName
                                ? {
                                    ...section,
                                    isActive: false,
                                    deactivatedAt: new Date(),
                                    students: [] // Svuotiamo l'array degli studenti
                                }
                                : section
                        )
                    };
                });

                showNotification('Sezione disattivata con successo', 'success');
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
                `/schools/${schoolId}/sections/${sectionName}/reactivate`
            );

            if (response.data.status === 'success') {
                // Aggiorniamo selectedSchool invece di sections
                setSelectedSchool(prevSchool => {
                    if (!prevSchool) return null;
                    
                    return {
                        ...prevSchool,
                        sections: prevSchool.sections.map(section => 
                            section.name === sectionName
                                ? {
                                    ...section,
                                    isActive: true,
                                    deactivatedAt: null
                                }
                                : section
                        )
                    };
                });

                showNotification(
                    `Sezione ${sectionName} riattivata con successo`,
                    'success'
                );
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

    return (
        <SchoolContext.Provider value={{
            schools,
            loading,
            error,
            totalSchools,
            selectedSchool,
            getSchoolById,
            fetchSchools,
            getSchoolsByRegion,
            getSchoolsByType,
            createSchool,
            updateSchool,
            deleteSchool,
            validateSchoolData,
            getSections,
            getSectionStudents,
            deactivateSection,
            reactivateSection
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