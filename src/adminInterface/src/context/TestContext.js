// src/context/TestContext/TestContext.js
import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';  // Importa axiosInstance invece di axios

const TestContext = createContext();

const initialState = {
    tests: [],
    selectedTest: null,
    results: [],
    statistics: null,
    questions: [], // Aggiunto stato per le domande
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
        case 'SET_QUESTIONS':
            return { ...state, questions: action.payload, loading: false };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
};

export const TestProvider = ({ children }) => {
    const [state, dispatch] = useReducer(testReducer, initialState);

    const getTestQuestions = async () => {  // Rimosso testType perché non necessario
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            console.log('Fetching CSI questions...');  // Debug log
            const response = await axiosInstance.get('/tests/csi/questions');
            console.log('Response:', response.data);  // Debug log
            dispatch({ type: 'SET_QUESTIONS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching questions:', error);  // Debug log
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento delle domande'
            });
            return [];
        }
    };

    const updateTestQuestion = async (questionData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.put(
                `/tests/csi/questions/${questionData.id}`,
                questionData
            );
            dispatch({ type: 'UPDATE_QUESTION', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nell\'aggiornamento della domanda'
            });
            throw error;
        }
    };

    const getTests = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.get('/tests');
            dispatch({ type: 'SET_TESTS', payload: response.data.data });
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento dei test'
            });
        }
    };

    const getTestById = async (testId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.get(`/tests/${testId}`);
            dispatch({ type: 'SET_SELECTED_TEST', payload: response.data.data });
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento del test'
            });
        }
    };

    const getTestResults = async (testId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.get(`/tests/${testId}/results`);
            dispatch({ type: 'SET_RESULTS', payload: response.data.data });
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento dei risultati'
            });
        }
    };

    const getTestStatistics = async (testId, schoolId = null) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const url = schoolId 
                ? `/tests/stats/school/${schoolId}`
                : `/tests/${testId}/stats`;
            const response = await axiosInstance.get(url);
            dispatch({ type: 'SET_STATISTICS', payload: response.data.data });
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento delle statistiche'
            });
        }
    };

    const generateTestLink = async (studentId, testType) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.post('/tests/generate-link', {
                studentId,
                testType
            });
            return response.data.data;
        } catch (error) {
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
        getTestQuestions,
        getTestResults,
        getTestStatistics,
        generateTestLink,
        clearError,
        updateTestQuestion
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