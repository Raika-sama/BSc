import React, { createContext, useContext, useReducer } from 'react';
import { axiosInstance } from '../services/axiosConfig';
import { useNotification } from './NotificationContext';

// Helper function per normalizzare i docenti
const normalizeTeacher = (teacher) => {
    // Caso 1: Se teacher è null o undefined
    if (!teacher) return null;
    
    // Caso 2: Se teacher è una stringa (solo ID)
    if (typeof teacher === 'string') {
        return {
            id: teacher,
            _id: teacher,
            firstName: '',
            lastName: '',
            name: `Docente ${teacher.substring(0, 6)}...`,
            displayName: `Docente ${teacher.substring(0, 6)}...`
        };
    }
    
    // Caso 3: Se teacher è un oggetto
    if (typeof teacher === 'object') {
        // Estrai l'ID (potrebbe essere in teacher._id o teacher.id)
        const id = teacher._id || teacher.id;
        
        // Se l'oggetto non ha un ID, restituisci null
        if (!id) return null;
        
        // Gestisci il nome in base alle proprietà disponibili
        let firstName = teacher.firstName || '';
        let lastName = teacher.lastName || '';
        let name = '';
        
        // Determina il nome da visualizzare
        if (teacher.name) {
            name = teacher.name;
        } else if (firstName || lastName) {
            name = `${firstName} ${lastName}`.trim();
        } else {
            name = `Docente ${id.substring(0, 6)}...`;
        }
        
        // Crea un oggetto normalizzato
        return {
            id: id,
            _id: id,
            firstName: firstName,
            lastName: lastName,
            name: name,
            displayName: name,
            email: teacher.email || '',
            role: teacher.role || '',
            ...teacher // Mantieni tutte le altre proprietà originali
        };
    }
    
    // Caso default: Se arriviamo qui, c'è un formato non previsto
    console.warn('Formato docente non riconosciuto:', teacher);
    return null;
};

// Helper functions per normalizzare gli oggetti scolastici
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

// Funzione principale per normalizzare uno studente
const normalizeStudent = (student) => {
    if (!student) return null;
    
    // Debug log - prima della normalizzazione
    console.log('Normalizing student:', {
        id: student._id || student.id,
        name: `${student.firstName} ${student.lastName}`,
        mainTeacher: student.mainTeacher,
        teachersCount: Array.isArray(student.teachers) ? student.teachers.length : 'not an array'
    });
    
    // Assicuriamoci di avere un ID valido
    const studentId = student._id || student.id;
    if (!studentId) {
        console.warn('Student without ID:', student);
        return null;
    }
    
    const normalized = {
        ...student,
        id: studentId,
        _id: studentId,
        
        schoolId: student.schoolId ? {
            _id: typeof student.schoolId === 'object' ? student.schoolId._id : student.schoolId,
            name: typeof student.schoolId === 'object' ? student.schoolId.name : 'N/D',
            schoolType: typeof student.schoolId === 'object' ? student.schoolId.schoolType : null,
            institutionType: typeof student.schoolId === 'object' ? student.schoolId.institutionType : null,
            region: typeof student.schoolId === 'object' ? student.schoolId.region : null,
            province: typeof student.schoolId === 'object' ? student.schoolId.province : null
        } : null,
        
        classId: student.classId ? {
            _id: typeof student.classId === 'object' ? student.classId._id : student.classId,
            year: typeof student.classId === 'object' ? student.classId.year : null,
            section: typeof student.classId === 'object' ? student.classId.section : null,
            academicYear: typeof student.classId === 'object' ? student.classId.academicYear : null
        } : null,
        
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
        
        // Normalizza il docente principale utilizzando la funzione migliorata
        mainTeacher: normalizeTeacher(student.mainTeacher),
        
        // Normalizza l'array di docenti, filtrando eventuali valori null
        teachers: Array.isArray(student.teachers) ? 
            student.teachers.map(normalizeTeacher).filter(Boolean) : 
            [],
        
        testCount: student.testCount || 0
    };

    // Debug log - dopo la normalizzazione
    console.log('Normalized student:', {
        id: normalized.id,
        name: `${normalized.firstName} ${normalized.lastName}`,
        mainTeacher: normalized.mainTeacher ? normalized.mainTeacher.displayName : 'none',
        teachersCount: normalized.teachers.length,
        teachersSample: normalized.teachers.slice(0, 2).map(t => t.displayName)
    });
    
    return normalized;
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
    totalStudents: 0,
    unassignedStudents: [],
    unassignedToSchoolStudents: []  // Aggiungi questa riga
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
                // Return current state if payload is null or undefined
                if (!action.payload) {
                    return {
                        ...state,
                        selectedStudent: null
                    };
                }
                
                const student = action.payload;
                console.log('[StudentReducer] Setting selected student:', {
                    original: student,
                    id: student.id,
                    _id: student._id
                });
                return {
                    ...state,
                    selectedStudent: {
                        ...student,
                        _id: student.id || student._id,
                        id: student.id || student._id
                    }
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
            const normalizedUnassignedStudents = (action.payload || [])
                .map(student => ({
                    ...student,
                    id: student._id || student.id,
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    email: student.email || '',
                    gender: student.gender || ''
                }))
                .filter(student => student !== null);
            
            return {
                ...state,
                unassignedStudents: normalizedUnassignedStudents,
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
                    // Salva gli studenti non assegnati in una proprietà separata dello stato
                    unassignedToSchoolStudents: action.payload.map(student => normalizeStudent(student)),
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
            console.log('StudentContext: Fetching student with ID:', studentId);
            
            const response = await axiosInstance.get(`/students/${studentId}?includeTestCount=true`);
            
            if (response.data.status === 'success') {
                const student = response.data.data.student;
                // Nella funzione getStudentById, aggiungi questo prima di normalizzare
console.log('Raw student data from API:', {
    mainTeacherType: typeof student.mainTeacher,
    mainTeacher: student.mainTeacher,
    teachersType: typeof student.teachers,
    teachers: student.teachers
});
                const normalizedStudent = normalizeStudent(student);
                
                // Aggiorna lo stato interno
                dispatch({
                    type: STUDENT_ACTIONS.SET_SELECTED_STUDENT,
                    payload: normalizedStudent
                });
                
                // Importante: ritorna i dati normalizzati
                return normalizedStudent;
            }
            
            throw new Error('Errore nel recupero dello studente');
        } catch (error) {
            console.error('Error getting student:', error);
            
            // Aggiungi gestione errori
            const errorMessage = error.response?.data?.error?.message || 
                               error.message || 
                               'Errore nel recupero dello studente';
            
            // Aggiorna lo stato dell'errore
            dispatch({
                type: STUDENT_ACTIONS.SET_ERROR,
                payload: errorMessage
            });
            
            return null; // Ritorna null in caso di errore
        } finally {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: false });
        }
    };

    // Modifica createStudent
    const createStudent = async (studentData) => {
        try {
            // Pulizia dei dati prima dell'invio
            const formattedData = {
                ...studentData,
                // Converti stringhe vuote in null
                fiscalCode: studentData.fiscalCode || null,
                parentEmail: studentData.parentEmail || null,
                // Gestisci correttamente mainTeacher e teachers
                mainTeacher: studentData.mainTeacher || null,
                teachers: (studentData.teachers || []).filter(Boolean),
                // Assicurati che la data sia in formato ISO
                dateOfBirth: new Date(studentData.dateOfBirth).toISOString()
            };
    
            console.log('Sending formatted data to server:', formattedData);
    
            const response = await axiosInstance.post('/students', formattedData);
    
            if (response.data.status === 'success') {
                const newStudent = normalizeStudent(response.data.data.student);
                dispatch({
                    type: STUDENT_ACTIONS.ADD_STUDENT,
                    payload: newStudent
                });
                return newStudent;
            }
        } catch (error) {
            console.error('Error creating student:', error);
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
            console.log('[StudentContext] Starting update:', { studentId, updateData });

            if (!studentId) {
                const error = new Error('ID studente mancante');
                error.code = 'MISSING_ID';
                throw error;
            }

            // Gestione specifica per i docenti per evitare riferimenti circolari
            const sanitizedData = { ...updateData };
            
            // Sanitizza l'array dei docenti se presente
            if (Array.isArray(sanitizedData.teachers)) {
                sanitizedData.teachers = sanitizedData.teachers.map(teacher => {
                    // Se è già un ID, ritornalo
                    if (typeof teacher === 'string') return teacher;
                    // Se è un oggetto docente, prendi solo l'ID
                    return teacher._id || teacher.id;
                });
            }

            // Sanitizza il docente principale se presente
            if (sanitizedData.mainTeacher) {
                if (typeof sanitizedData.mainTeacher === 'object') {
                    sanitizedData.mainTeacher = sanitizedData.mainTeacher._id || sanitizedData.mainTeacher.id;
                }
            }

            console.log('[StudentContext] Sanitized update data:', sanitizedData);
            
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            const response = await axiosInstance.put(`/students/${studentId}`, sanitizedData);
            console.log('[StudentContext] Update response:', response.data);

            if (response.data.status === 'success') {
                const updatedStudent = normalizeStudent(response.data.data.student);
                
                // Dispatch the update action to update both the students list and selectedStudent
                dispatch({
                    type: STUDENT_ACTIONS.UPDATE_STUDENT,
                    payload: updatedStudent
                });

                // If this is the selected student, update it as well
                if (state.selectedStudent?.id === studentId) {
                    dispatch({
                        type: STUDENT_ACTIONS.SET_SELECTED_STUDENT,
                        payload: updatedStudent
                    });
                }
                
                showNotification('Studente aggiornato con successo', 'success');
                return updatedStudent;
            }

            throw new Error('Errore nell\'aggiornamento dello studente');
        } catch (error) {
            console.error('Error in update student:', {
                error: error.message,
                studentId,
                updateData
            });
            
            const errorMessage = error.code === 'MISSING_ID' 
                ? 'ID studente mancante'
                : error.response?.data?.error?.message || 
                  'Errore nell\'aggiornamento dello studente';
                  
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

    // Elimina studente
    const deleteStudent = async (studentId) => {
        try {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: true });
            
            // Aggiungiamo il parametro cascade=true per eliminare tutti i riferimenti
            const response = await axiosInstance.delete(`/students/${studentId}?cascade=true`);

            if (response.data.status === 'success') {
                dispatch({
                    type: STUDENT_ACTIONS.DELETE_STUDENT,
                    payload: studentId
                });
                showNotification('Studente e tutti i suoi riferimenti eliminati con successo', 'success');
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
            
            console.log('Server response:', response.data);

            // Modifica qui: accedi correttamente ai dati annidati
            if (response.data?.data?.data?.students) {
                const students = response.data.data.data.students;
                
                console.log('Received students:', students);

                // Normalizza i dati degli studenti
                const normalizedStudents = students.map(student => ({
                    ...student,
                    id: student._id || student.id,
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    email: student.email || '',
                    gender: student.gender || '',
                    fullName: `${student.firstName} ${student.lastName}`
                }));

                console.log('Normalized students:', normalizedStudents);

                dispatch({
                    type: STUDENT_ACTIONS.SET_UNASSIGNED_STUDENTS,
                    payload: normalizedStudents
                });

                return normalizedStudents;
            } else {
                console.error('Struttura dati non valida:', response.data);
                throw new Error('Formato risposta non valido dal server');
            }
        } catch (error) {
            console.error('Error in fetchUnassignedStudents:', error);
            throw error;
        } finally {
            dispatch({ type: STUDENT_ACTIONS.SET_LOADING, payload: false });
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
                    dispatch({
                        type: STUDENT_ACTIONS.SET_UNASSIGNED_TO_SCHOOL_STUDENTS,
                        payload: []
                    });
                    return [];
                }
    
                // Importante: usa l'action SET_UNASSIGNED_TO_SCHOOL_STUDENTS invece di SET_STUDENTS
                dispatch({
                    type: STUDENT_ACTIONS.SET_UNASSIGNED_TO_SCHOOL_STUDENTS,
                    payload: students
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

    // In StudentContext.js, aggiungi queste nuove funzioni
    const generateCredentials = async (studentId) => {
        try {
            // Correggiamo l'URL aggiungendo /admin/
            const response = await axiosInstance.post(`/student-auth/admin/generate/${studentId}`);
            
            if (response.data.status === 'success') {
                // Aggiorniamo anche lo stato dello studente
                await updateStudent(studentId, {
                    hasCredentials: true,
                    credentialsSentAt: new Date()
                });
    
                showNotification('Credenziali generate con successo', 'success');
                return response.data.data.credentials;
            }
            throw new Error('Errore nel formato della risposta');
        } catch (error) {
            console.error('Error generating credentials:', error);
            const errorMessage = error.response?.data?.message || 
                               'Errore nella generazione delle credenziali';
            showNotification(errorMessage, 'error');
            throw error;
        }
    };

    const resetPassword = async (studentId) => {
        try {
            console.log('========== RESET PASSWORD DEBUG ==========');
            console.log('Resetting password - Request:', {
                studentId,
                url: `/student-auth/admin/reset-password/${studentId}`
            });
    
            const response = await axiosInstance.post(`/student-auth/admin/reset-password/${studentId}`);
            
            console.log('Reset password - Raw response:', response);
            console.log('Response status:', response.status);
            console.log('Response data type:', typeof response.data);
            console.log('Response data structure:', Object.keys(response.data));
            
            // Converti l'oggetto in JSON per una visualizzazione più pulita
            const prettyResponse = JSON.stringify(response.data, null, 2);
            console.log('Response data (formatted JSON):', prettyResponse);
    
            // Analizza la struttura dettagliata della risposta
            console.log('Response data analysis:');
            if (response.data) {
                if (response.data.status) console.log('- response.data.status:', response.data.status);
                if (response.data.data) {
                    console.log('- response.data.data is present');
                    if (response.data.data.credentials) {
                        console.log('- response.data.data.credentials is present');
                        console.log('- credentials keys:', Object.keys(response.data.data.credentials));
                        console.log('- username:', response.data.data.credentials.username);
                        console.log('- temporaryPassword:', response.data.data.credentials.temporaryPassword);
                    } else {
                        console.log('- response.data.data.credentials is NOT present');
                        console.log('- data keys:', Object.keys(response.data.data));
                    }
                }
            }
    
            // Meglio estrai i dati con più controlli espliciti
            let credentials = null;
            
            // Verifica ogni percorso possibile, dal più specifico al più generico
            if (response.data?.data?.credentials?.username && 
                response.data?.data?.credentials?.temporaryPassword) {
                console.log('Found credentials in response.data.data.credentials');
                credentials = response.data.data.credentials;
            } 
            else if (response.data?.data?.username && 
                     response.data?.data?.temporaryPassword) {
                console.log('Found credentials in response.data.data');
                credentials = response.data.data;
            }
            else if (response.data?.username && 
                     response.data?.temporaryPassword) {
                console.log('Found credentials in response.data');
                credentials = response.data;
            }
            // Ultimo tentativo con ricerca ricorsiva
            else {
                console.log('Recursive search for credentials');
                const findCredentials = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    
                    // Verifica se l'oggetto corrente contiene username e temporaryPassword
                    if (obj.username && obj.temporaryPassword) {
                        return obj;
                    }
                    
                    // Cerca ricorsivamente in ogni proprietà dell'oggetto
                    for (const key in obj) {
                        if (typeof obj[key] === 'object') {
                            const found = findCredentials(obj[key]);
                            if (found) return found;
                        }
                    }
                    
                    return null;
                };
                
                credentials = findCredentials(response.data);
                if (credentials) {
                    console.log('Found credentials recursively:', credentials);
                }
            }
    
            console.log('Final extracted credentials:', credentials);
    
            if (!credentials?.username || !credentials?.temporaryPassword) {
                console.error('Invalid credentials structure:', {
                    responseData: prettyResponse,
                    extractedCredentials: credentials
                });
                throw new Error('Credenziali mancanti o non valide nella risposta');
            }
    
            showNotification('Password resettata con successo', 'success');
            
            console.log('=========================================');
            
            return {
                username: credentials.username,
                temporaryPassword: credentials.temporaryPassword
            };
        } catch (error) {
            console.error('Reset password error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                stack: error.stack
            });
            
            const errorMessage = error.response?.data?.error?.message 
                || error.message 
                || 'Errore nel reset della password';
                
            showNotification(errorMessage, 'error');
            throw error;
        }
    };


    return (
        <StudentContext.Provider value={{
            ...state,
                students: state.students || [],
                totalStudents: state.totalStudents || 0,
                unassignedStudents: state.unassignedStudents || [], 
                unassignedToSchoolStudents: state.unassignedToSchoolStudents || [], // Aggiungi questa riga
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
                createStudentWithClass,
                generateCredentials,
                resetPassword
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