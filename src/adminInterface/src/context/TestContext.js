// src/context/TestContext/TestContext.js
import React, { createContext, useContext, useReducer } from 'react';
import axios from 'axios';

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
    const apiUrl = process.env.REACT_APP_API_URL;

    const getTestQuestions = async (testType) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axios.get(`${apiUrl}/api/tests/${testType}/questions`);
            dispatch({ type: 'SET_QUESTIONS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento delle domande'
            });
            return [];
        }
    };

    const getTests = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axios.get(`${apiUrl}/api/tests`);
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
            const response = await axios.get(`${apiUrl}/api/tests/${testId}`);
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
            const response = await axios.get(`${apiUrl}/api/tests/${testId}/results`);
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
                ? `${apiUrl}/api/tests/stats/school/${schoolId}`
                : `${apiUrl}/api/tests/${testId}/stats`;
            const response = await axios.get(url);
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
            const response = await axios.post(`${apiUrl}/api/tests/generate-link`, {
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