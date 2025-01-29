import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

// Helper function per normalizzare i dati degli studenti
const normalizeStudent = (student) => {
    if (!student) return null;

    const normalized = {
        ...student,
        id: student._id || student.id,
        schoolId: normalizeSchoolId(student.schoolId),
        classId: normalizeClassId(student.classId),
        lastName: student.lastName || '',
        firstName: student.firstName || '',
        fiscalCode: student.fiscalCode || '',
        gender: student.gender || '',
        email: student.email || '',
        dateOfBirth: student.dateOfBirth || null,
        parentEmail: student.parentEmail || '',
        status: student.status || 'pending',
        needsClassAssignment: student.needsClassAssignment ?? true,
        isActive: student.isActive ?? true,
        specialNeeds: student.specialNeeds ?? false,
        mainTeacher: normalizeTeacher(student.mainTeacher),
        teachers: Array.isArray(student.teachers) ? 
            student.teachers.map(normalizeTeacher) : 
            []
    };

    return normalized;
};



// Helper functions per normalizzare i sotto-oggetti
const normalizeSchoolId = (schoolId) => {
    if (!schoolId) return { _id: null, name: 'N/D' };
    if (typeof schoolId === 'object') return schoolId;
    return { _id: schoolId, name: 'N/D' };
};

const normalizeClassId = (classId) => {
    if (!classId) return null;
    if (typeof classId === 'object') return classId;
    return { _id: classId };
};

const normalizeTeacher = (teacher) => {
    if (!teacher) return null;
    
    // Se è una stringa (ID), restituisci un oggetto base
    if (typeof teacher === 'string') {
        return { id: teacher, name: `Docente ${teacher.substr(0, 6)}...` };
    }

    // Se è un oggetto ma senza proprietà necessarie
    if (typeof teacher === 'object') {
        const id = teacher._id || teacher.id;
        if (!id) return null;

        // Costruisci il nome del docente in base alle proprietà disponibili
        let name = teacher.name;
        if (!name && teacher.firstName) {
            name = `${teacher.firstName} ${teacher.lastName || ''}`.trim();
        }
        if (!name) {
            name = `Docente ${id.substr(0, 6)}...`;
        }

        return {
            id: id,
            name: name,
            ...teacher  // mantieni le altre proprietà
        };
    }

    return null;
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
    BATCH_ASSIGN_STUDENTS: 'BATCH_ASSIGN_STUDENTS',
    SET_UNASSIGNED_TO_SCHOOL_STUDENTS: 'SET_UNASSIGNED_TO_SCHOOL_STUDENTS',
    BATCH_ASSIGN_TO_SCHOOL: 'BATCH_ASSIGN_TO_SCHOOL',
    CREATE_STUDENT_WITH_CLASS: 'CREATE_STUDENT_WITH_CLASS'
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
                const normalizedStudents = (action.payload.students || [])
                    .map(student => normalizeStudent(student))
                    .filter(student => student !== null); // Filtriamo eventuali null
                return {
                    ...state,
                    students: normalizedStudents,
                    totalStudents: action.payload.total || normalizedStudents.length,
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
                const normalizedNewStudent = normalizeStudent(action.payload);
                if (!normalizedNewStudent) return state;
                return {
                    ...state,
                    students: [...state.students, normalizedNewStudent],
                    totalStudents: state.totalStudents + 1
                };

        case STUDENT_ACTIONS.UPDATE_STUDENT:
            const normalizedUpdatedStudent = normalizeStudent(action.payload);
            if (!normalizedUpdatedStudent) return state;
            return {
                ...state,
                students: state.students.map(student =>
                    student.id === normalizedUpdatedStudent.id ? 
                        normalizedUpdatedStudent : 
                        student
                ),
                selectedStudent: state.selectedStudent?.id === normalizedUpdatedStudent.id ?
                    normalizedUpdatedStudent : state.selectedStudent
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
            const unassignedStudents = (action.payload || [])
                .map(student => normalizeStudent(student))
                .filter(student => student !== null);
            return {
                ...state,
                students: unassignedStudents,
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

            case STUDENT_ACTIONS.SET_UNASSIGNED_TO_SCHOOL_STUDENTS:
                return {
                    ...state,
                    students: action.payload.map(student => normalizeStudent(student)),
                    loading: false
                };
            
            case STUDENT_ACTIONS.BATCH_ASSIGN_TO_SCHOOL:
                return {
                    ...state,
                    students: state.students.filter(
                        student => !action.payload.studentIds.includes(student.id)
                    ),
                    loading: false
                };
    }
};

export const StudentProvider = ({ children }) => {
    const [state, dispatch] = useReducer(studentReducer, initialState);
    const { showNotification } = useNotification();

 // In StudentContext.js, nella funzione fetchStudents:
 const fetchStudents = async (filters = {}) => {
    try {
        dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
        
        // Costruisci i query params
        const queryParams = new URLSearchParams();
        
        // Aggiungi i parametri base
        queryParams.append('page', filters.page || 1);
        queryParams.append('limit', filters.limit || 50);

        // Aggiungi i filtri se presenti
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.schoolId) queryParams.append('schoolId', filters.schoolId);
        if (filters.classFilter) { // Nota: cambiato da year/section a classFilter
            queryParams.append('classFilter', filters.classFilter);
        }
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.specialNeeds !== undefined) {
            queryParams.append('specialNeeds', filters.specialNeeds);
        }

        console.log('Fetching students with params:', queryParams.toString());

        const response = await axiosInstance.get(`/students?${queryParams}`);
        
        console.log('Server response:', response.data);

        if (response.data.status === 'success') {
            const normalizedStudents = response.data.data.students.map(student => ({
                ...student,
                _id: student._id || student.id,
                id: student._id || student.id,
                schoolName: student.schoolId?.name || 'N/D',
                className: student.classId ? 
                    `${student.classId.year}${student.classId.section}` : 
                    'N/D',
                testCount: student.testCount || 0
            }));

            console.log('Normalized students:', normalizedStudents);

            dispatch({
                type: STUDENT_ACTIONS.SET_STUDENTS,
                payload: {
                    students: normalizedStudents,
                    total: response.data.data.count
                }
            });
        }
    } catch (error) {
        console.error('Error in fetchStudents:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        const errorMessage = error.response?.data?.error?.message || 
                        'Errore nel caricamento degli studenti';
        
        dispatch({
            type: STUDENT_ACTIONS.SET_ERROR,
            payload: errorMessage
        });
        showNotification(errorMessage, 'error');
    } finally {
        dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: false });
    }
};

    // Recupera un singolo studente per ID
    const getStudentById = async (studentId) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.get(`/students/${studentId}?includeTestCount=true`);
    
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
    // Modifica la funzione createStudent per validare e formattare i dati prima dell'invio
    const normalizeStudent = (student) => {
    if (!student) return null;
    
    // Debugging
    console.log('Normalizing student:', student);
    console.log('Original mainTeacher:', student.mainTeacher);

    const normalized = {
        ...student,
        id: student._id || student.id,
       _id: student._id || student.id, // Manteniamo anche _id per compatibilità

       schoolId: typeof student.schoolId === 'object' ? student.schoolId : { _id: student.schoolId, name: 'N/D' },
       classId: typeof student.classId === 'object' ? student.classId : student.classId ? { _id: student.classId } : null,     
       lastName: student.lastName || '',
        firstName: student.firstName || '',
        fiscalCode: student.fiscalCode || '',
        gender: student.gender || '',
        email: student.email || '',
        dateOfBirth: student.dateOfBirth || null,
        parentEmail: student.parentEmail || '',
        status: student.status || 'pending',
        needsClassAssignment: student.needsClassAssignment ?? true,
        isActive: student.isActive ?? true,
        specialNeeds: student.specialNeeds ?? false,
        // Gestione più accurata del mainTeacher
        mainTeacher: student.mainTeacher ? {
            id: student.mainTeacher._id || student.mainTeacher.id,
            name: student.mainTeacher.name || student.mainTeacher.firstName + ' ' + student.mainTeacher.lastName || 'N/D',
            ...student.mainTeacher
            
        } : null,        
        teachers: Array.isArray(student.teachers) ? 
        student.teachers.map(normalizeTeacher) : 
            [],
        testCount: student.testCount || 0

    };

// Debugging
console.log('Normalized student:', normalized);
console.log('Normalized mainTeacher:', normalized.mainTeacher);
    
return normalized;
    };

    const createStudent = async (studentData) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            console.log('Creating student with data:', studentData);

            // Formattazione dati secondo il modello
            const formattedData = {
                firstName: studentData.firstName?.trim(),
                lastName: studentData.lastName?.trim(),
                gender: studentData.gender,
                dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString() : null,
                email: studentData.email?.trim().toLowerCase(),
                schoolId: studentData.schoolId,
                parentEmail: studentData.parentEmail?.trim().toLowerCase() || null,
                fiscalCode: studentData.fiscalCode?.trim().toUpperCase() || null,
                mainTeacher: studentData.mainTeacher || null,
                teachers: studentData.teachers || [],
                specialNeeds: studentData.specialNeeds || false,
                status: 'pending',
                needsClassAssignment: true,
                isActive: true
            };

            console.log('Creating student with data:', formattedData);
            
            const response = await axiosInstance.post('/students', formattedData);
            
            if (response.data.status === 'success') {
                const newStudent = normalizeStudent(response.data.data.student);
                dispatch({
                    type: STUDENT_ACTIONS.ADD_STUDENT,
                    payload: newStudent
                });
                showNotification('Studente creato con successo', 'success');
                return newStudent;
            }
        } catch (error) {
            console.error('Error creating student:', error);
            const errorMessage = error.response?.data?.error?.message || 
                            error.message || 
                            'Errore nella creazione dello studente';
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    const createStudentWithClass = async (studentData) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const formattedData = {
                firstName: studentData.firstName?.trim(),
                lastName: studentData.lastName?.trim(),
                gender: studentData.gender,
                dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString() : null,
                email: studentData.email?.trim().toLowerCase(),
                schoolId: studentData.schoolId,
                classId: studentData.classId,
                section: studentData.section,
                academicYear: studentData.academicYear,
                parentEmail: studentData.parentEmail?.trim().toLowerCase() || null,
                fiscalCode: studentData.fiscalCode?.trim().toUpperCase() || null,
                mainTeacher: studentData.mainTeacher || null,
                teachers: studentData.teachers || [],
                specialNeeds: studentData.specialNeeds || false,
                status: 'active',  // Cambiato da 'pending' a 'active'
                needsClassAssignment: false,  // Cambiato da true a false
                isActive: true
            };
    
            // Modifica qui: usa il nuovo endpoint
            const response = await axiosInstance.post('/students/with-class', formattedData);
            
            if (response.data.status === 'success') {
                const newStudent = normalizeStudent(response.data.data.student);
                dispatch({
                    type: STUDENT_ACTIONS.ADD_STUDENT,
                    payload: newStudent
                });
                showNotification('Studente creato e assegnato con successo', 'success');
                return newStudent;
            }
        } catch (error) {
            console.error('Error creating student:', error);
            const errorMessage = error.response?.data?.error?.message || 
                            error.message || 
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
            console.log('Updating student:', { studentId, updateData });  // Aggiungi questo
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
        
        console.log('Fetching unassigned students for school:', schoolId);
        
        const response = await axiosInstance.get(`/students/unassigned/${schoolId}`);
        
        console.log('Unassigned students response:', response.data);

        if (response.data.status === 'success') {
            const students = response.data.data?.students || [];
            
            // Dispatch per aggiornare lo stato
            dispatch({
                type: STUDENT_ACTIONS.SET_UNASSIGNED_STUDENTS,
                payload: students
            });

            // Normalizza i dati prima di restituirli
            const normalizedStudents = students.map(student => normalizeStudent(student))
                                             .filter(student => student !== null);
            
            return normalizedStudents; // Ritorna i dati normalizzati
        } else {
            throw new Error(response.data.message || 'Errore nel recupero degli studenti non assegnati');
        }
    } catch (error) {
        console.error('Error fetching unassigned students:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           error.message || 
                           'Errore nel caricamento degli studenti non assegnati';
        
        dispatch({
            type: STUDENT_ACTIONS.SET_ERROR,
            payload: errorMessage
        });
        
        showNotification(errorMessage, 'error');
        
        // Ritorna un array vuoto in caso di errore
        return [];
    } finally {
        // Non settiamo loading a false qui perché viene gestito dal reducer
    }
};
    
    // Assegnazione batch di studenti
    const batchAssignStudents = async (studentIds, classId, academicYear) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            // Validazione input
            if (!Array.isArray(studentIds) || studentIds.length === 0) {
                throw new Error('Lista studenti non valida');
            }
    
            if (!classId) {
                throw new Error('ID classe non valido');
            }
    
            if (!academicYear) {
                throw new Error('Anno accademico non valido');
            }
    
            // Debug log prima della chiamata
            console.log('Sending batch assign request:', {
                studentIds,
                classId,
                academicYear
            });
    
            const response = await axiosInstance.post('/students/batch-assign', {
                studentIds,  // Array di ID semplici
                classId,
                academicYear
            });
    
            console.log('Batch assign response:', response);
    
            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.BATCH_ASSIGN_STUDENTS,
                    payload: {
                        studentIds,
                        classId,
                        modifiedCount: response.data.data.modifiedCount,
                        className: response.data.data.className
                    }
                });
    
                showNotification(
                    `${response.data.data.modifiedCount} studenti assegnati alla classe ${response.data.data.className}`,
                    'success'
                );
                
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Errore nell\'assegnazione degli studenti');
            }
        } catch (error) {
            console.error('Error in batchAssignStudents:', {
                error,
                studentIds,
                classId,
                academicYear
            });
    
            const errorMessage = error.response?.data?.error?.message || 
                               error.message || 
                               'Errore nell\'assegnazione degli studenti';
                               
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            
            showNotification(errorMessage, 'error');
            throw error;
        } finally {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: false });
        }
    };

// Recupera studenti senza scuola
const fetchUnassignedToSchoolStudents = async () => {
    try {
        dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
        
        console.log('Chiamata API iniziata');
        const response = await axiosInstance.get('/students/unassigned-to-school');
        console.log('Risposta API completa:', response.data);

        if (response.data.status === 'success') {
            // Aggiungiamo più controlli sulla struttura della risposta
            const students = response.data.data?.students || [];
            console.log('Struttura risposta:', {
                status: response.data.status,
                hasData: !!response.data.data,
                studentsArray: students,
                studentsCount: students.length
            });

            // Se non ci sono studenti, non aggiorniamo lo stato
            if (students.length === 0) {
                console.log('Nessuno studente da assegnare trovato');
                return [];
            }

            dispatch({
                type: STUDENT_ACTIONS.SET_STUDENTS,
                payload: {
                    students: students,
                    total: students.length
                }
            });
            return students;
        }
    } catch (error) {
        console.error('Errore dettagliato:', error);
        console.error('Response error:', error.response);
        const errorMessage = error.response?.data?.error?.message || 
                           'Errore nel caricamento degli studenti';
        dispatch({
            type: STUDENT_ACTIONS.SET_ERROR,
            payload: errorMessage
        });
        showNotification(errorMessage, 'error');
        return [];
    } finally {
        dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: false });
    }
};

// Assegna studenti alla scuola
const batchAssignToSchool = async (studentIds, schoolId) => {
    try {
        dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
        
        // Modifica il path per allinearlo con il backend
        const response = await axiosInstance.post('/students/batch-assign-to-school', {
            studentIds,
            schoolId
        });

        if (response.data.status === 'success') {
            dispatch({
                type: STUDENT_ACTIONS.BATCH_ASSIGN_TO_SCHOOL,
                payload: {
                    studentIds,
                    schoolId,
                    modifiedCount: response.data.data.modifiedCount,
                    schoolName: response.data.data.schoolName
                }
            });

            showNotification(
                `${response.data.data.modifiedCount} studenti assegnati alla scuola ${response.data.data.schoolName}`,
                'success'
            );
            
            return response.data.data;
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
    } finally {
        dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: false });  // Aggiungiamo questo per sicurezza
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
            batchAssignStudents,
            fetchUnassignedToSchoolStudents,
            batchAssignToSchool,
            createStudentWithClass
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