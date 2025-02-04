// src/context/TestContext/TestContext.js
import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';

const TestContext = createContext();

const initialState = {
    tests: [],
    selectedTest: null,
    results: [],
    statistics: null,
    metadata: {
        types: ['CSI', 'FUTURE_TEST_1', 'FUTURE_TEST_2'],
        status: ['active', 'completed', 'expired'],
        configurations: null
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    },
    loading: {
        tests: false,
        results: false,
        statistics: false
    },
    error: null
};

const testReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { 
                ...state, 
                loading: { 
                    ...state.loading, 
                    [action.payload.type]: action.payload.status 
                } 
            };
        case 'SET_ERROR':
            return { 
                ...state, 
                error: action.payload,
                loading: { ...state.loading, [action.payload.type]: false }
            };
        case 'SET_TESTS':
            return { 
                ...state, 
                tests: action.payload.tests,
                pagination: {
                    ...state.pagination,
                    ...action.payload.pagination
                },
                loading: { ...state.loading, tests: false }
            };
        case 'SET_SELECTED_TEST':
            return { 
                ...state, 
                selectedTest: action.payload, 
                loading: { ...state.loading, tests: false }
            };
        case 'SET_RESULTS':
            return { 
                ...state, 
                results: action.payload, 
                loading: { ...state.loading, results: false }
            };
        case 'SET_STATISTICS':
            return { 
                ...state, 
                statistics: action.payload, 
                loading: { ...state.loading, statistics: false }
            };
        case 'SET_METADATA':
            return { 
                ...state, 
                metadata: { ...state.metadata, ...action.payload }
            };
        case 'UPDATE_TEST':
            return {
                ...state,
                tests: state.tests.map(test => 
                    test.id === action.payload.id ? action.payload : test
                ),
                loading: { ...state.loading, tests: false }
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'RESET_STATE':
            return { ...initialState };
        default:
            return state;
    }
};

export const TestProvider = ({ children }) => {
    const [state, dispatch] = useReducer(testReducer, initialState);

    /**
     * Recupera tutti i test con paginazione e filtri
     */
    const getTests = async (params = {}) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'tests', status: true } });
        try {
            const { page = 1, limit = 10, type, status, sortBy } = params;
            const queryParams = new URLSearchParams({
                page,
                limit,
                ...(type && { type }),
                ...(status && { status }),
                ...(sortBy && { sortBy })
            });

            const response = await axiosInstance.get(`/tests?${queryParams}`);
            dispatch({ 
                type: 'SET_TESTS', 
                payload: {
                    tests: response.data.data,
                    pagination: response.data.pagination
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching tests:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento dei test',
                    type: 'tests'
                }
            });
            return null;
        }
    };

    /**
     * Recupera configurazione e metadati
     */
    const getTestConfiguration = async (testType) => {
        try {
            const response = await axiosInstance.get(`/tests/config/${testType}`);
            dispatch({ 
                type: 'SET_METADATA', 
                payload: { 
                    configurations: {
                        ...state.metadata.configurations,
                        [testType]: response.data.data
                    }
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test configuration:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento della configurazione',
                    type: 'configuration'
                }
            });
            return null;
        }
    };

    /**
     * Recupera un test specifico per ID
     */
    const getTestById = async (testId) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'tests', status: true } });
        try {
            const response = await axiosInstance.get(`/tests/${testId}`);
            dispatch({ type: 'SET_SELECTED_TEST', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento del test',
                    type: 'tests'
                }
            });
            return null;
        }
    };

    /**
     * Recupera i risultati di un test con filtri
     */
    const getTestResults = async (testId, params = {}) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'results', status: true } });
        try {
            const { page, limit, sortBy, status } = params;
            const queryParams = new URLSearchParams({
                ...(page && { page }),
                ...(limit && { limit }),
                ...(sortBy && { sortBy }),
                ...(status && { status })
            });

            const response = await axiosInstance.get(`/tests/${testId}/results?${queryParams}`);
            dispatch({ type: 'SET_RESULTS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test results:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento dei risultati',
                    type: 'results'
                }
            });
            return null;
        }
    };

    /**
     * Recupera statistiche per test o scuola
     */
    const getTestStatistics = async (testId, schoolId = null) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'statistics', status: true } });
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
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento delle statistiche',
                    type: 'statistics'
                }
            });
            return null;
        }
    };

    /**
     * Genera un link per un test
     */
    const generateTestLink = async (studentId, testType) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'tests', status: true } });
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
                payload: {
                    message: error.response?.data?.message || 'Errore nella generazione del link',
                    type: 'tests'
                }
            });
            return null;
        }
    };

    /**
     * Reset dello stato
     */
    const resetState = () => {
        dispatch({ type: 'RESET_STATE' });
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
        getTestConfiguration,
        generateTestLink,
        resetState,
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