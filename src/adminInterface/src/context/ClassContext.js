// src/adminInterface/src/context/ClassContext.js
import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';

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
            
            const user = JSON.parse(localStorage.getItem('user'));
            console.debug('Fetching classes as:', {
                role: user?.role,
                schoolId: user?.schoolId
            });
                
            const response = await axiosInstance.get('/classes');
                
            if (response.data.status === 'success') {
                // Funzione per formattare una classe
                const formatClass = (classData) => {
                    // Verifica che schoolName sia presente o estrailo da schoolId
                    const schoolName = classData.schoolName || 
                                     (classData.school?.name) || 
                                     (classData.schoolId?.name) || 
                                     'N/A';
    
                    return {
                        classId: classData.classId || classData._id, // Gestisce entrambi i formati
                        year: classData.year,
                        section: classData.section,
                        academicYear: classData.academicYear,
                        status: classData.status || 'active', // Valore di default
                        schoolName: schoolName,
                        schoolId: classData.schoolId?._id || classData.schoolId,
                        mainTeacher: classData.mainTeacher,
                        teachers: classData.teachers || [],
                        isActive: classData.isActive ?? true, // Default a true se non specificato
                        capacity: classData.capacity || 0,
                        students: classData.students || [],
                        totalStudents: classData.students?.length || 0,
                        activeStudents: classData.students?.filter(s => s.status === 'active')?.length || 0
                    };
                };
    
                let mainTeacherClasses = [];
                let coTeacherClasses = [];
    
                // Gestisce diversi formati di risposta possibili
                if (user?.role === 'admin') {
                    // Per admin, tutte le classi vanno in mainTeacherClasses
                    const classes = Array.isArray(response.data.classes) ? 
                        response.data.classes : 
                        (response.data.data?.classes || []);
                    
                    mainTeacherClasses = classes.map(formatClass);
                } else {
                    // Per altri ruoli, usa la separazione mainTeacher/coTeacher
                    mainTeacherClasses = Array.isArray(response.data.mainTeacherClasses) ? 
                        response.data.mainTeacherClasses.map(formatClass) :
                        (Array.isArray(response.data.data?.mainTeacherClasses) ?
                            response.data.data.mainTeacherClasses.map(formatClass) : []);
    
                    coTeacherClasses = Array.isArray(response.data.coTeacherClasses) ?
                        response.data.coTeacherClasses.map(formatClass) :
                        (Array.isArray(response.data.data?.coTeacherClasses) ?
                            response.data.data.coTeacherClasses.map(formatClass) : []);
                }
    
                console.debug('Classes formatted:', {
                    mainTeacherCount: mainTeacherClasses.length,
                    coTeacherCount: coTeacherClasses.length,
                    role: user?.role
                });
    
                dispatch({ 
                    type: CLASS_ACTIONS.SET_MY_CLASSES, 
                    payload: {
                        mainTeacherClasses,
                        coTeacherClasses
                    }
                });
    
                dispatch({
                    type: CLASS_ACTIONS.UPDATE_STATS,
                    payload: {
                        totalClasses: mainTeacherClasses.length + coTeacherClasses.length,
                        activeClasses: mainTeacherClasses.filter(c => c.isActive).length + 
                                     coTeacherClasses.filter(c => c.isActive).length,
                        totalStudents: mainTeacherClasses.reduce((acc, c) => acc + c.totalStudents, 0) +
                                     coTeacherClasses.reduce((acc, c) => acc + c.totalStudents, 0),
                        activeStudents: mainTeacherClasses.reduce((acc, c) => acc + c.activeStudents, 0) +
                                      coTeacherClasses.reduce((acc, c) => acc + c.activeStudents, 0)
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
                payload: error.response?.data?.message || 'Errore nel recupero delle classi' 
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

    const getClassDetails = async (classId) => {
        try {
            console.log('🎯 ClassContext: Getting details for classId:', classId); // Log 7
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: true });
            const response = await axiosInstance.get(`/classes/${classId}`);
            console.log('📡 ClassContext: API Response:', response.data); // Log 8

            if (response.data.status === 'success') {
                return response.data.data.class; // Modifica qui per estrarre i dati corretti
            } else {
                console.warn('⚠️ ClassContext: API returned non-success status:', response.data); // Log 9
                throw new Error(response.data.message || 'Errore nel recupero dei dettagli della classe');
            }
        } catch (error) {
            console.error('❌ ClassContext: Error in getClassDetails:', error); // Log 10
            dispatch({ 
                type: CLASS_ACTIONS.SET_ERROR, 
                payload: error.response?.data?.message || 'Errore nel recupero dei dettagli della classe' 
            });
            throw error;
        } finally {
            dispatch({ type: CLASS_ACTIONS.SET_LOADING, payload: false });
        }
    };

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



    return (
        <ClassContext.Provider value={{
            ...state,
            getMyClasses,
            fetchClasses,
            addClass,
            createInitialClasses,
            updateClass,
            deleteClass,
            getClassDetails,  // Aggiungi questa
            removeStudentsFromClass,
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