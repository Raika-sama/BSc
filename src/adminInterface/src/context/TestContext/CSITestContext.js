// src/context/TestContext/CSITestContext.js
import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../../services/axiosConfig';

const CSITestContext = createContext();

// Aggiungiamo queste funzioni


const initialState = {
    questions: [],
    selectedQuestion: null,
    config: null,
    metadata: {
        tags: [],
        categories: [],
        difficulties: ['facile', 'medio', 'difficile']
    },
    loading: {
        questions: false,
        saving: false,
        config: false
    },
    error: null
};

const csiTestReducer = (state, action) => {
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
        case 'SET_QUESTIONS':
            return { 
                ...state, 
                questions: action.payload, 
                loading: { ...state.loading, questions: false }
            };
        case 'SET_METADATA':
            return { ...state, metadata: { ...state.metadata, ...action.payload } };
        case 'UPDATE_QUESTION':
            return {
                ...state,
                questions: state.questions.map(q => 
                    q.id === action.payload.id ? action.payload : q
                ),
                loading: { ...state.loading, saving: false }
            };
            case 'SET_CONFIG':
            return { 
                ...state, 
                config: action.payload,
                loading: { ...state.loading, config: false }
            };
        case 'UPDATE_CONFIG':
            return {
                ...state,
                config: action.payload,
                loading: { ...state.loading, saving: false }
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
};

export const CSITestProvider = ({ children }) => {
    const [state, dispatch] = useReducer(csiTestReducer, initialState);

    /**
     * Recupera tutte le domande CSI
     */
    const getTestQuestions = async () => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'questions', status: true } });
        try {
            const response = await axiosInstance.get('/tests/csi/config');
            dispatch({ type: 'SET_QUESTIONS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento delle domande',
                    type: 'questions'
                }
            });
            return [];
        }
    };

    /**
     * Recupera la configurazione del test CSI
     */
    const getTestConfiguration = async () => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'config', status: true } });
        try {
            const response = await axiosInstance.get('/tests/csi/config');
            dispatch({ type: 'SET_CONFIG', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching configuration:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel caricamento della configurazione',
                    type: 'config'
                }
            });
            return null;
        }
    };

    /**
     * Aggiorna la configurazione del test CSI
     */
    const updateTestConfiguration = async (configData) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'saving', status: true } });
        try {
            const response = await axiosInstance.put('/tests/csi/config', configData);
            dispatch({ type: 'UPDATE_CONFIG', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error updating configuration:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nel salvataggio della configurazione',
                    type: 'saving'
                }
            });
            return null;
        }
    };

    /**
     * Aggiorna una domanda CSI
     */
    const updateTestQuestion = async (questionData) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'saving', status: true } });
        try {
            const formattedData = {
                testo: questionData.testo,
                categoria: questionData.categoria,
                metadata: {
                    polarity: questionData.metadata?.polarity || '+',
                    weight: parseFloat(questionData.metadata?.weight || 1),
                    difficultyLevel: questionData.metadata?.difficultyLevel || 'medio',
                    tags: questionData.metadata?.tags || []
                },
                active: questionData.active ?? true
            };

            const response = await axiosInstance.put(
                `/tests/csi/questions/${questionData.id}`,
                formattedData
            );

            dispatch({ type: 'UPDATE_QUESTION', payload: response.data.data });
            await getTestQuestions(); // Ricarica le domande per avere la lista aggiornata
            return response.data.data;
        } catch (error) {
            console.error('Error updating question:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nell\'aggiornamento della domanda',
                    type: 'saving'
                }
            });
            return null;
        }
    };

    /**
     * Crea una nuova domanda CSI
     */
    const createTestQuestion = async (questionData) => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'saving', status: true } });
        try {
            const formattedData = {
                testo: questionData.testo,
                categoria: questionData.categoria,
                metadata: {
                    polarity: questionData.metadata?.polarity || '+',
                    weight: parseFloat(questionData.metadata?.weight || 1),
                    difficultyLevel: 'medio',
                    tags: []
                },
                version: '1.0.0',
                active: true
            };

            const response = await axiosInstance.post('/tests/csi/questions', formattedData);
            await getTestQuestions(); // Ricarica le domande
            return response.data.data;
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: {
                    message: error.response?.data?.message || 'Errore nella creazione della domanda',
                    type: 'saving'
                }
            });
            return null;
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        getTestQuestions,
        updateTestQuestion,
        createTestQuestion,
        getTestConfiguration,    // Aggiungiamo
        updateTestConfiguration, // Aggiungiamo
        clearError
    };

    return (
        <CSITestContext.Provider value={value}>
            {children}
        </CSITestContext.Provider>
    );
};

export const useCSITest = () => {
    const context = useContext(CSITestContext);
    if (!context) {
        throw new Error('useCSITest must be used within a CSITestProvider');
    }
    return context;
};

export default CSITestContext;