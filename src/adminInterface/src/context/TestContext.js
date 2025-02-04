// src/context/TestContext/TestContext.js
import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';

const TestContext = createContext();

const initialState = {
    tests: [],
    selectedTest: null,
    results: [],
    statistics: null,
    loading: false,
    error: null
};

const testReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_TESTS':
            return { ...state, tests: action.payload, loading: false };
        case 'SET_SELECTED_TEST':
            return { ...state, selectedTest: action.payload, loading: false };
        case 'SET_RESULTS':
            return { ...state, results: action.payload, loading: false };
        case 'SET_STATISTICS':
            return { ...state, statistics: action.payload, loading: false };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
};

export const TestProvider = ({ children }) => {
    const [state, dispatch] = useReducer(testReducer, initialState);

    /**
     * Recupera tutti i test disponibili
     */
    const getTests = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.get('/tests');
            dispatch({ type: 'SET_TESTS', payload: response.data.data });
        } catch (error) {
            console.error('Error fetching tests:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento dei test'
            });
        }
    };

    /**
     * Recupera un test specifico per ID
     */
    const getTestById = async (testId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.get(`/tests/${testId}`);
            dispatch({ type: 'SET_SELECTED_TEST', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento del test'
            });
            return null;
        }
    };

    /**
     * Recupera i risultati di un test
     */
    const getTestResults = async (testId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.get(`/tests/${testId}/results`);
            dispatch({ type: 'SET_RESULTS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test results:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento dei risultati'
            });
            return null;
        }
    };

    /**
     * Recupera statistiche per test o scuola
     */
    const getTestStatistics = async (testId, schoolId = null) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const url = schoolId 
                ? `/tests/stats/school/${schoolId}`
                : `/tests/${testId}/stats`;
            const response = await axiosInstance.get(url);
            dispatch({ type: 'SET_STATISTICS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test statistics:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento delle statistiche'
            });
            return null;
        }
    };

    /**
     * Genera un link per un test
     */
    const generateTestLink = async (studentId, testType) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.post('/tests/generate-link', {
                studentId,
                testType
            });
            return response.data.data;
        } catch (error) {
            console.error('Error generating test link:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nella generazione del link'
            });
            return null;
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        getTests,
        getTestById,
        getTestResults,
        getTestStatistics,
        generateTestLink,
        clearError
    };

    return (
        <TestContext.Provider value={value}>
            {children}
        </TestContext.Provider>
    );
};

export const useTest = () => {
    const context = useContext(TestContext);
    if (!context) {
        throw new Error('useTest must be used within a TestProvider');
    }
    return context;
};

export default TestContext;