import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

// Helper function per normalizzare i dati degli studenti
const normalizeStudent = (student) => {
    if (!student) return null;
    
    // Assicurati che ci sia un id
    const normalizedStudent = {
        ...student,
        id: student._id || student.id, // Aggiungi sempre un id
        schoolId: typeof student.schoolId === 'object' ? 
            student.schoolId : 
            { _id: student.schoolId, name: 'N/D' },
        classId: typeof student.classId === 'object' ?
            student.classId :
            (student.classId ? { _id: student.classId } : null),
        lastName: student.lastName || '',
        firstName: student.firstName || '',
        fiscalCode: student.fiscalCode || '',
        gender: student.gender || '',
        email: student.email || '',
        currentYear: student.currentYear || 1,
        dateOfBirth: student.dateOfBirth || null,
        parentEmail: student.parentEmail || ''
    };

    // Log per debug
    console.log('Normalized student:', normalizedStudent);

    return normalizedStudent;
};

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
    DELETE_STUDENT: 'DELETE_STUDENT',
    SET_UNASSIGNED_STUDENTS: 'SET_UNASSIGNED_STUDENTS',
    BATCH_ASSIGN_STUDENTS: 'BATCH_ASSIGN_STUDENTS'
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
            const normalizedStudents = action.payload.students.map(student => ({
                ...normalizeStudent(student),
                id: student._id || student.id // Assicurati che ogni studente abbia un id
            }));
            return {
                ...state,
                students: normalizedStudents,
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
                selectedStudent: normalizeStudent(action.payload)
            };
        case STUDENT_ACTIONS.ADD_STUDENT:
            return {
                ...state,
                students: [...state.students, normalizeStudent(action.payload)],
                totalStudents: state.totalStudents + 1
            };
        case STUDENT_ACTIONS.UPDATE_STUDENT:
            return {
                ...state,
                students: state.students.map(student =>
                    student.id === action.payload.id ? 
                        normalizeStudent(action.payload) : 
                        student
                ),
                selectedStudent: state.selectedStudent?.id === action.payload.id ?
                    normalizeStudent(action.payload) : state.selectedStudent
            };
        case STUDENT_ACTIONS.DELETE_STUDENT:
            return {
                ...state,
                students: state.students.filter(student => student.id !== action.payload),
                totalStudents: state.totalStudents - 1,
                selectedStudent: state.selectedStudent?.id === action.payload ?
                    null : state.selectedStudent
            };
        case STUDENT_ACTIONS.SET_UNASSIGNED_STUDENTS:
            return {
                ...state,
                students: (action.payload || []).map(normalizeStudent),
                loading: false
            };
        case STUDENT_ACTIONS.BATCH_ASSIGN_STUDENTS:
            return {
                ...state,
                students: state.students.map(student => 
                    action.payload.studentIds.includes(student.id) 
                        ? normalizeStudent({ 
                            ...student, 
                            classId: action.payload.classId,
                            needsClassAssignment: false
                          })
                        : student
                ),
                loading: false
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

            console.log('API Response:', response.data);

            if (response.data.status === 'success') {
                const students = response.data.data?.students || [];
                const total = response.data.data?.count || students.length;

                dispatch({
                    type: STUDENT_ACTIONS.SET_STUDENTS,
                    payload: {
                        students,
                        total
                    }
                });
            }
        } catch (error) {
            console.error('Error in fetchStudents:', error);
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

    // Recupera studenti non assegnati
    const fetchUnassignedStudents = async (schoolId) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.get(`/students/unassigned/${schoolId}`);
            
            if (response.data.status === 'success') {
                const students = response.data.data?.students || [];
                dispatch({
                    type: STUDENT_ACTIONS.SET_UNASSIGNED_STUDENTS,
                    payload: students
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel caricamento degli studenti non assegnati';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
        }
    };
    
    // Assegnazione batch di studenti
    const batchAssignStudents = async (studentIds, classId, academicYear) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.post('/students/batch-assign', {
                studentIds,
                classId,
                academicYear
            });
    
            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.BATCH_ASSIGN_STUDENTS,
                    payload: {
                        studentIds,
                        classId
                    }
                });
                showNotification('Studenti assegnati con successo', 'success');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'assegnazione degli studenti';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    // Reset errori
    const clearError = () => {
        dispatch({ type: STUDENT_ACTIONS.CLEAR_ERROR });
    };

    return (
        <StudentContext.Provider value={{
            ...state,
            students: state.students || [],
            totalStudents: state.totalStudents || 0,
            loading: state.loading || false,
            error: state.error || null,
            fetchStudents,
            getStudentById,
            createStudent,
            updateStudent,
            deleteStudent,
            searchStudents,
            clearError,
            fetchUnassignedStudents,
            batchAssignStudents
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