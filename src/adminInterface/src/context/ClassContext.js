// src/adminInterface/src/context/ClassContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useAuth } from './AuthContext'; // Aggiungi questo import


const ClassContext = createContext();

// Definizione degli action types
export const CLASS_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_CLASSES: 'SET_CLASSES',
    ADD_CLASS: 'ADD_CLASS',
    UPDATE_CLASS: 'UPDATE_CLASS',
    DELETE_CLASS: 'DELETE_CLASS',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_MY_CLASSES: 'SET_MY_CLASSES',
    UPDATE_STATS: 'UPDATE_STATS'
};

// Stato iniziale
const initialState = {
    classes: [],
    mainTeacherClasses: [],
    coTeacherClasses: [],
    loading: false,
    error: null,
    stats: {
        totalClasses: 0,
        activeClasses: 0,
        totalStudents: 0,
        activeStudents: 0
    }
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
            case CLASS_ACTIONS.SET_MY_CLASSES:
        return {
            ...state,
            mainTeacherClasses: action.payload.mainTeacherClasses,
            coTeacherClasses: action.payload.coTeacherClasses,
            loading: false
        };
        case CLASS_ACTIONS.UPDATE_STATS:
            return {
                ...state,
                stats: action.payload
            };
        default:
            return state;
    }
};

export const ClassProvider = ({ children }) => {
    const [state, dispatch] = useReducer(classReducer, initialState);
    const { user } = useAuth(); // Usa useAuth hook

    const fetchClasses = async (schoolId) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.get(`/classes/school/${schoolId}`);
            
            if (response.data.status === 'success') {
                dispatch({ type: CLASS_ACTIONS.SET_CLASSES, payload: response.data.classes });
                return response.data.classes;
            } else {
                throw new Error(response.data.message || 'Errore nel caricamento delle classi');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        }
    };

    const createInitialClasses = async (setupData) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.post('/classes/initial-setup', setupData);
    
            if (response.data.status === 'success') {
                dispatch({ type: CLASS_ACTIONS.SET_CLASSES, payload: response.data.classes });
                return response.data.classes;
            } else {
                throw new Error(response.data.message || 'Errore nella creazione delle classi');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        }
    };

    const addClass = async (classData) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.post('/classes', classData);

            if (response.data.status === 'success') {
                dispatch({ type: CLASS_ACTIONS.ADD_CLASS, payload: response.data.class });
                return response.data.class;
            } else {
                throw new Error(response.data.message || 'Errore nella creazione della classe');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        }
    };

    const updateClass = async (id, classData) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.put(`/classes/${id}`, classData);

            if (response.data.status === 'success') {
                dispatch({ type: CLASS_ACTIONS.UPDATE_CLASS, payload: response.data.class });
                return response.data.class;
            } else {
                throw new Error(response.data.message || 'Errore nell\'aggiornamento della classe');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        }
    };

    const deleteClass = async (id) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.delete(`/classes/${id}`);

            if (response.data.status === 'success') {
                dispatch({ type: CLASS_ACTIONS.DELETE_CLASS, payload: id });
            } else {
                throw new Error(response.data.message || 'Errore nell\'eliminazione della classe');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        }
    };

    const getMyClasses = async () => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            
            if (!user) {
                throw new Error('Utente non autenticato');
            }
    
            console.log('ClassContext: Iniziando getMyClasses', {
                role: user.role,
                schoolId: user.schoolId,
                userId: user._id
            });
                
            const response = await axiosInstance.get('/classes');
            console.log('ClassContext: Risposta API ricevuta', response.data);
                
            if (response.data.status === 'success') {
                // Funzione per formattare una classe secondo il modello Class.js
                const formatClass = (classData) => {
                    // Estrai il nome della scuola in modo sicuro
                    const schoolName = classData.schoolId?.name || 
                                      classData.school?.name || 
                                      'N/A';
                
                    // Estrai l'ID della scuola in modo sicuro
                    const schoolId = classData.schoolId?._id || 
                                    classData.schoolId || 
                                    null;
                
                    console.log('Debug formatClass:', {
                        originalSchoolData: classData.schoolId,
                        extractedName: schoolName,
                        extractedId: schoolId
                    });
                
                    return {
                        classId: classData._id,
                        year: classData.year,
                        section: classData.section,
                        academicYear: classData.academicYear,
                        status: classData.status || 'active',
                        // Aggiungi sia il nome che l'ID della scuola
                        schoolName: schoolName,
                        schoolId: schoolId,
                        mainTeacher: classData.mainTeacher,
                        mainTeacherIsTemporary: classData.mainTeacherIsTemporary || false,
                        previousMainTeacher: classData.previousMainTeacher,
                        teachers: classData.teachers || [],
                        isActive: classData.isActive,
                        capacity: classData.capacity,
                        students: classData.students || [],
                        notes: classData.notes,
                        // Campi calcolati
                        totalStudents: classData.students?.length || 0,
                        activeStudents: classData.students?.filter(s => s.status === 'active')?.length || 0
                    };
                };
    
                let mainTeacherClasses = [];
                let coTeacherClasses = [];
    
                switch (user.role) {
                    case 'admin':
                        const classes = Array.isArray(response.data.classes) ? 
                            response.data.classes : 
                            (response.data.data?.classes || []);
                        mainTeacherClasses = classes.map(formatClass);
                        break;
                            
                    case 'manager':
                        const schoolClasses = Array.isArray(response.data.classes) ? 
                            response.data.classes.filter(c => c.schoolId === user.schoolId) : 
                            [];
                        mainTeacherClasses = schoolClasses.map(formatClass);
                        break;
                            
                    case 'teacher':
                        mainTeacherClasses = Array.isArray(response.data.mainTeacherClasses) ? 
                            response.data.mainTeacherClasses.map(formatClass) :
                            [];
                        coTeacherClasses = Array.isArray(response.data.coTeacherClasses) ?
                            response.data.coTeacherClasses.map(formatClass) :
                            [];
                        break;
                            
                    default:
                        console.warn('Ruolo utente non riconosciuto:', user.role);
                }
    
                console.log('Classi formattate:', {
                    role: user.role,
                    mainTeacherCount: mainTeacherClasses.length,
                    coTeacherCount: coTeacherClasses.length
                });
    
                dispatch({ 
                    type: CLASS_ACTIONS.SET_MY_CLASSES, 
                    payload: {
                        mainTeacherClasses,
                        coTeacherClasses
                    }
                });
    
                return {
                    mainTeacherClasses,
                    coTeacherClasses
                };
            }
                
            throw new Error(response.data.message || 'Errore nel recupero delle classi');
        } catch (error) {
            console.error('Error fetching classes:', error);
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            
            dispatch({ 
                type: CLASS_ACTIONS.SET_MY_CLASSES, 
                payload: {
                    mainTeacherClasses: [],
                    coTeacherClasses: []
                }
            });
            throw error;
        } finally {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: false });
        }
    };

    const getClassDetails = useCallback(async (classId) => {
        try {
            console.log('🎯 ClassContext: Getting details for classId:', classId);
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.get(`/classes/${classId}`);
            
            if (response.data.status === 'success') {
                // Assicurarsi di estrarre correttamente i dati dalla risposta
                const classData = response.data.class || response.data.data?.class;
                if (!classData) {
                    throw new Error('Dati della classe non trovati nella risposta');
                }
                
                dispatch({
                    type: CLASS_ACTIONS.UPDATE_CLASS,
                    payload: classData
                });
                return classData;
            } else {
                throw new Error(response.data.message || 'Errore nel recupero dei dettagli della classe');
            }
        } catch (error) {
            console.error('❌ ClassContext: Error in getClassDetails:', error);
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        } finally {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    const removeStudentsFromClass = async (classId, studentIds) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.post(`/classes/${classId}/remove-students`, {
                studentIds
            });

            if (response.data.status === 'success') {
                return response.data.class;
            } else {
                throw new Error(response.data.message || 'Errore nella rimozione degli studenti');
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        } finally {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: false });
        }
    };

    const removeMainTeacher = async (classId) => {
        try {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.post(`/classes/${classId}/remove-main-teacher`);
            
            if (response.data.status === 'success') {
                // Aggiorna lo stato locale
                dispatch({
                    type: CLASS_ACTIONS.UPDATE_CLASS,
                    payload: response.data.data.class
                });
                
                return response.data.data.class;
            }
        } catch (error) {
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || error.message 
            });
            throw error;
        } finally {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: false });
        }
    };


    return (
        <ClassContext.Provider value={{
            ...state,
            getMyClasses,
            fetchClasses,
            addClass,
            createInitialClasses,
            updateClass,
            deleteClass,
            getClassDetails,
            removeStudentsFromClass,
            removeMainTeacher,
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