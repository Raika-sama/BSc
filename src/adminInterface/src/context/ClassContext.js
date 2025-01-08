// src/adminInterface/src/context/ClassContext.js
import React, { createContext, useContext, useReducer } from 'react';

const ClassContext = createContext();

// Definizione degli action types
export const CLASS_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_CLASSES: 'SET_CLASSES',
    ADD_CLASS: 'ADD_CLASS',
    UPDATE_CLASS: 'UPDATE_CLASS',
    DELETE_CLASS: 'DELETE_CLASS',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Stato iniziale
const initialState = {
    classes: [],
    loading: false,
    error: null
};

// Reducer
const classReducer = (state, action) => {
    switch (action.type) {
        case CLASS_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
        case CLASS_ACTIONS.SET_CLASSES:
            return {
                ...state,
                classes: action.payload,
                loading: false
            };
        case CLASS_ACTIONS.ADD_CLASS:
            return {
                ...state,
                classes: [...state.classes, action.payload]
            };
        case CLASS_ACTIONS.UPDATE_CLASS:
            return {
                ...state,
                classes: state.classes.map(c => 
                    c._id === action.payload._id ? action.payload : c
                )
            };
        case CLASS_ACTIONS.DELETE_CLASS:
            return {
                ...state,
                classes: state.classes.filter(c => c._id !== action.payload)
            };
        case CLASS_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        case CLASS_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

export const ClassProvider = ({ children }) => {
    const [state, dispatch] = useReducer(classReducer, initialState);

    const fetchClasses = async () => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await fetch('/api/v1/classes');
            const data = await response.json();
            
            if (response.ok) {
                dispatch({ type: CLASS_ACTIONS.SET_CLASSES, payload: data.classes });
            } else {
                throw new Error(data.message || 'Errore nel caricamento delle classi');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.message 
            });
        }
    };

    const addClass = async (classData) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await fetch('/api/v1/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData)
            });
            const data = await response.json();

            if (response.ok) {
                dispatch({ type: CLASS_ACTIONS.ADD_CLASS, payload: data.class });
                return data.class;
            } else {
                throw new Error(data.message || 'Errore nella creazione della classe');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.message 
            });
            throw error;
        }
    };

    // ... altri metodi per update e delete

    return (
        <ClassContext.Provider value={{
            ...state,
            fetchClasses,
            addClass,
            dispatch
        }}>
            {children}
        </ClassContext.Provider>
    );
};

export const useClass = () => {
    const context = useContext(ClassContext);
    if (!context) {
        throw new Error('useClass deve essere usato all\'interno di un ClassProvider');
    }
    return context;
};