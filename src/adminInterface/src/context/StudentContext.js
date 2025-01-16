// src/context/StudentContext.js

import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

const StudentContext = createContext();

// Action types
const STUDENT_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_STUDENTS: 'SET_STUDENTS',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_SELECTED_STUDENT: 'SET_SELECTED_STUDENT',
    ADD_STUDENT: 'ADD_STUDENT',
    UPDATE_STUDENT: 'UPDATE_STUDENT',
    DELETE_STUDENT: 'DELETE_STUDENT'
};

// Stato iniziale
const initialState = {
    students: [],
    loading: false,
    error: null,
    selectedStudent: null,
    totalStudents: 0
};

// Reducer
const studentReducer = (state, action) => {
    switch (action.type) {
        case STUDENT_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
        case STUDENT_ACTIONS.SET_STUDENTS:
            return {
                ...state,
                students: action.payload.students,
                totalStudents: action.payload.total,
                loading: false
            };
        case STUDENT_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        case STUDENT_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
        case STUDENT_ACTIONS.SET_SELECTED_STUDENT:
            return {
                ...state,
                selectedStudent: action.payload
            };
        case STUDENT_ACTIONS.ADD_STUDENT:
            return {
                ...state,
                students: [...state.students, action.payload],
                totalStudents: state.totalStudents + 1
            };
        case STUDENT_ACTIONS.UPDATE_STUDENT:
            return {
                ...state,
                students: state.students.map(student =>
                    student.id === action.payload.id ? action.payload : student
                ),
                selectedStudent: state.selectedStudent?.id === action.payload.id ?
                    action.payload : state.selectedStudent
            };
        case STUDENT_ACTIONS.DELETE_STUDENT:
            return {
                ...state,
                students: state.students.filter(student => student.id !== action.payload),
                totalStudents: state.totalStudents - 1,
                selectedStudent: state.selectedStudent?.id === action.payload ?
                    null : state.selectedStudent
            };
        default:
            return state;
    }
};

export const StudentProvider = ({ children }) => {
    const [state, dispatch] = useReducer(studentReducer, initialState);
    const { showNotification } = useNotification();

    // Recupera tutti gli studenti con filtri opzionali
    const fetchStudents = async (filters = {}) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const queryParams = new URLSearchParams(filters);
            const response = await axiosInstance.get(`/students?${queryParams}`);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.SET_STUDENTS,
                    payload: {
                        students: response.data.data.students,
                        total: response.data.data.count
                    }
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel caricamento degli studenti';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
        }
    };

    // Recupera un singolo studente per ID
    const getStudentById = async (studentId) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.get(`/students/${studentId}`);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.SET_SELECTED_STUDENT,
                    payload: response.data.data.student
                });
                return response.data.data.student;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel recupero dello studente';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
        }
    };

    // Crea nuovo studente
    const createStudent = async (studentData) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.post('/students', studentData);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.ADD_STUDENT,
                    payload: response.data.data.student
                });
                showNotification('Studente creato con successo', 'success');
                return response.data.data.student;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nella creazione dello studente';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    // Aggiorna studente esistente
    const updateStudent = async (studentId, updateData) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.put(`/students/${studentId}`, updateData);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.UPDATE_STUDENT,
                    payload: response.data.data.student
                });
                showNotification('Studente aggiornato con successo', 'success');
                return response.data.data.student;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'aggiornamento dello studente';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    // Elimina studente
    const deleteStudent = async (studentId) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.delete(`/students/${studentId}`);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.DELETE_STUDENT,
                    payload: studentId
                });
                showNotification('Studente eliminato con successo', 'success');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'eliminazione dello studente';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    // Ricerca studenti
    const searchStudents = async (query) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.get(`/students/search?query=${query}`);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.SET_STUDENTS,
                    payload: {
                        students: response.data.data.students,
                        total: response.data.data.count
                    }
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nella ricerca degli studenti';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
        }
    };

    // Reset errori
    const clearError = () => {
        dispatch({ type: STUDENT_ACTIONS.CLEAR_ERROR });
    };

    return (
        <StudentContext.Provider value={{
            ...state,
            fetchStudents,
            getStudentById,
            createStudent,
            updateStudent,
            deleteStudent,
            searchStudents,
            clearError
        }}>
            {children}
        </StudentContext.Provider>
    );
};

// Hook personalizzato
export const useStudent = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudent deve essere usato all\'interno di uno StudentProvider');
    }
    return context;
};

export default StudentContext;


// Gestione Stato:

// Lista studenti
// Studente selezionato
// Stati di loading ed errori
// Totale studenti per paginazione


// Operazioni CRUD:

// Fetch studenti (con filtri)
// Creazione
// Aggiornamento
// Eliminazione
// Ricerca


// Gestione Errori:

// Catch di tutti gli errori
// Notifiche utente
// Reset errori


// Features:

// Caching locale dello stato
// Aggiornamento ottimistico UI
// Integrazione con il sistema di notifiche