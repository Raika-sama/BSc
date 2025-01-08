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

        if (!schoolData.name?.trim()) {
            errors.name = 'Nome scuola richiesto';
        }

        if (!['middle_school', 'high_school'].includes(schoolData.schoolType)) {
            errors.schoolType = 'Tipo scuola non valido';
        }

        if (!['scientific', 'classical', 'artistic', 'none'].includes(schoolData.institutionType)) {
            errors.institutionType = 'Tipo istituto non valido';
        }

        if (schoolData.sections) {
            const invalidSections = schoolData.sections.filter(section => !/^[A-Z]$/.test(section));
            if (invalidSections.length > 0) {
                errors.sections = 'Le sezioni devono essere lettere maiuscole';
            }
        }

        // Validazione numberOfYears basata sul tipo di scuola
        if (schoolData.schoolType === 'middle_school' && schoolData.numberOfYears !== 3) {
            errors.numberOfYears = 'La scuola media deve avere 3 anni';
        } else if (schoolData.schoolType === 'high_school' && schoolData.numberOfYears !== 5) {
            errors.numberOfYears = 'La scuola superiore deve avere 5 anni';
        }

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
            } else {
                throw new Error('Errore nel formato della risposta');
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
                ...filters
            });

            const response = await axiosInstance.get(`/schools?${queryParams}`);
            
            if (response.data.status === 'success') {
                setSchools(response.data.data.schools);
                setTotalSchools(response.data.results);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nel caricamento delle scuole';
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
            throw { response: { data: { error: { errors: validationErrors } } } };
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post('/schools', schoolData);
            
            if (response.data.status === 'success') {
                setSchools(prev => [...prev, response.data.data.school]);
                showNotification('Scuola creata con successo', 'success');
                return response.data.data.school;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'Errore nella creazione della scuola';
            setError(errorMessage);
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateSchool = async (id, schoolData) => {
        const validationErrors = validateSchoolData(schoolData);
        if (validationErrors) {
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
            validateSchoolData
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