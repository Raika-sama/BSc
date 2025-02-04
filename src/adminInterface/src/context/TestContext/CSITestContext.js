// src/context/TestContext/CSITestContext.js
import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../../services/axiosConfig';

const CSITestContext = createContext();

const initialState = {
    questions: [],
    selectedQuestion: null,
    loading: false,
    error: null
};

const csiTestReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_QUESTIONS':
            return { ...state, questions: action.payload, loading: false };
        case 'SET_SELECTED_QUESTION':
            return { ...state, selectedQuestion: action.payload, loading: false };
        case 'UPDATE_QUESTION':
            return {
                ...state,
                questions: state.questions.map(q => 
                    q.id === action.payload.id ? action.payload : q
                ),
                loading: false
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
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            console.log('Fetching CSI questions...');
            const response = await axiosInstance.get('/tests/csi/questions');
            console.log('Response:', response.data);
            dispatch({ type: 'SET_QUESTIONS', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel caricamento delle domande'
            });
            return [];
        }
    };

    /**
     * Aggiorna una domanda CSI
     */
    const updateTestQuestion = async (questionData) => {
        try {
            const formattedData = {
                ...questionData,
                weight: parseFloat(questionData.weight || 1).toFixed(1),
                version: questionData.version || '1.0.0',
                active: Boolean(questionData.active),
                metadata: {
                    ...questionData.metadata,
                    polarity: questionData.metadata?.polarity || '+'
                }
            };

            console.log('Sending update request with data:', formattedData);

            const response = await axiosInstance.put(
                `/tests/csi/questions/${questionData.id}`,
                formattedData
            );

            if (response.data.status === 'success') {
                dispatch({ type: 'UPDATE_QUESTION', payload: response.data.data });
                await getTestQuestions(); // Ricarica le domande per avere la lista aggiornata
            }

            return response.data.data;
        } catch (error) {
            console.error('Error updating question:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nell\'aggiornamento della domanda'
            });
            return null;
        }
    };

    /**
     * Invia una risposta al test CSI
     */
    const submitCSIAnswer = async (token, answerData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.post(`/tests/csi/${token}/answer`, answerData);
            return response.data.data;
        } catch (error) {
            console.error('Error submitting CSI answer:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nell\'invio della risposta'
            });
            return null;
        }
    };

    /**
     * Completa un test CSI
     */
    const completeCSITest = async (token) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await axiosInstance.post(`/tests/csi/${token}/complete`);
            return response.data.data;
        } catch (error) {
            console.error('Error completing CSI test:', error);
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error.response?.data?.message || 'Errore nel completamento del test'
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
        submitCSIAnswer,
        completeCSITest,
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