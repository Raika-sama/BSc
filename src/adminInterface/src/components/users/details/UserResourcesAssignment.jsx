// src/components/users/details/UserResourcesAssignment.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardHeader,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Chip,
    Paper
} from '@mui/material';
import {
    School as SchoolIcon,
    Class as ClassIcon,
    Person as StudentIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useSchool } from '../../../context/SchoolContext';
import { useClass } from '../../../context/ClassContext';
import { useStudent } from '../../../context/StudentContext';
import { axiosInstance } from '../../../services/axiosConfig';

// Definisci quali risorse sono rilevanti per ogni ruolo
const ROLE_RESOURCE_REQUIREMENTS = {
    admin: {
        needsSchool: true,
        needsClasses: true,
        needsStudents: true
    },
    developer: {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    },
    manager: {
        needsSchool: true,
        needsClasses: true,
        needsStudents: false
    },
    pcto: {
        needsSchool: true,
        needsClasses: false,
        needsStudents: false
    },
    teacher: {
        needsSchool: true,
        needsClasses: true,
        needsStudents: false
    },
    tutor: {
        needsSchool: true,
        needsClasses: false,
        needsStudents: true
    },
    researcher: {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    },
    health: {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    },
    student: {
        needsSchool: true,
        needsClasses: true,
        needsStudents: false
    }
};

const UserResourcesAssignment = ({ userData }) => {
    // Stati per memorizzare i dati delle risorse
    const [schoolsData, setSchoolsData] = useState([]);
    const [classesData, setClassesData] = useState([]);
    const [studentsData, setStudentsData] = useState([]);
    // Usa gli hook di contesto per accedere ai dati
    const { getSchoolById } = useSchool();
    const { getClassById } = useClass();  // Usa il nome corretto della funzione
    const { getStudentById } = useStudent();
    // Stati per gestire il caricamento e gli errori
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Ottieni i requisiti in base al ruolo
    const roleRequirements = ROLE_RESOURCE_REQUIREMENTS[userData.role] || {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    };

    // Carica i dati all'avvio
    useEffect(() => {
        const loadResourcesData = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log("Caricamento risorse per l'utente:", userData);
                
                // Verifica se l'utente ha risorse assegnate
                const hasSchoolIds = Array.isArray(userData.assignedSchoolIds) && userData.assignedSchoolIds.length > 0;
                const hasClassIds = Array.isArray(userData.assignedClassIds) && userData.assignedClassIds.length > 0;
                const hasStudentIds = Array.isArray(userData.assignedStudentIds) && userData.assignedStudentIds.length > 0;
                
                // Carica dati scuole se assegnate
                if (roleRequirements.needsSchool && hasSchoolIds) {
                    const schools = [];
                    for (const schoolId of userData.assignedSchoolIds) {
                        try {
                            // Chiamata API diretta per recuperare la scuola
                            const response = await axiosInstance.get(`/schools/${schoolId}`);
                            if (response.data.status === 'success' && response.data.data.school) {
                                const schoolData = response.data.data.school;
                                
                                // Determina il ruolo dell'utente nella scuola
                                let userRole = "Utente";
                                let isManager = false;
                                
                                // Controlla se l'utente è il manager della scuola
                                if (schoolData.manager && 
                                    (schoolData.manager._id === userData._id || 
                                     schoolData.manager === userData._id)) {
                                    userRole = "Manager";
                                    isManager = true;
                                } 
                                // Altrimenti, cerca il ruolo negli utenti della scuola
                                else if (schoolData.users && Array.isArray(schoolData.users)) {
                                    const userEntry = schoolData.users.find(u => 
                                        (u.user._id === userData._id || u.user === userData._id)
                                    );
                                    if (userEntry && userEntry.role) {
                                        userRole = userEntry.role.charAt(0).toUpperCase() + userEntry.role.slice(1); // Capitalizza il ruolo
                                    }
                                }
                                
                                // Aggiungi l'informazione del ruolo alla scuola
                                schools.push({
                                    ...schoolData,
                                    userRole: userRole,
                                    isManager: isManager
                                });
                            }
                        } catch (err) {
                            console.error(`Error loading school ${schoolId}:`, err);
                        }
                    }
                    setSchoolsData(schools);
                }
                
                // Carica dati classi se assegnate
                if (roleRequirements.needsClasses && hasClassIds) {
                    const classes = [];
                    for (const classId of userData.assignedClassIds) {
                        try {
                            const classData = await getClassById(classId);
                            if (classData) classes.push(classData);
                        } catch (err) {
                            console.error(`Error loading class ${classId}:`, err);
                        }
                    }
                    setClassesData(classes);
                }
                
                // Carica dati studenti se assegnati
                if (roleRequirements.needsStudents && hasStudentIds) {
                    const students = [];
                    for (const studentId of userData.assignedStudentIds) {
                        try {
                            const studentData = await getStudentById(studentId);
                            if (studentData) students.push(studentData);
                        } catch (err) {
                            console.error(`Error loading student ${studentId}:`, err);
                        }
                    }
                    setStudentsData(students);
                }
            } catch (error) {
                console.error('Error loading resources:', error);
                setError('Errore nel caricamento delle risorse');
            } finally {
                setLoading(false);
            }
        };

        loadResourcesData();
    }, [userData, roleRequirements, getClassById, getStudentById]);

    // Mostra messaggio se il ruolo non richiede risorse
    if (!roleRequirements.needsSchool && 
        !roleRequirements.needsClasses && 
        !roleRequirements.needsStudents) {
        return (
            <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Il ruolo {userData.role} non richiede l'assegnazione di risorse specifiche.
                </Alert>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
            </Box>
        );
    }

    // Se non ci sono risorse assegnate
    const hasNoResources = 
        (schoolsData.length === 0 && roleRequirements.needsSchool) &&
        (classesData.length === 0 && roleRequirements.needsClasses) &&
        (studentsData.length === 0 && roleRequirements.needsStudents);

    if (hasNoResources && !loading) {
        return (
            <Box>
                <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <InfoIcon color="info" sx={{ mr: 2 }} />
                    <Typography>
                        Nessuna risorsa assegnata a questo utente. Le risorse verranno assegnate in base al ruolo dell'utente.
                        <br/>
                        <Typography variant="caption" color="text.secondary">
                            Debug: assignedSchoolIds = {JSON.stringify(userData.assignedSchoolIds)}
                        </Typography>
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
                Risorse Assegnate
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Visualizzazione Scuole con ruolo dell'utente */}
                {roleRequirements.needsSchool && schoolsData.length > 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader 
                                avatar={<SchoolIcon color="primary" />}
                                title="Scuole Assegnate"
                            />
                            <Divider />
                            <CardContent>
                                {schoolsData.map(school => (
                                    <Box 
                                        key={school._id} 
                                        sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            mb: 1
                                        }}
                                    >
                                        <Typography variant="body1">
                                            {school.name} - {school.address}, {school.province}
                                        </Typography>
                                        <Chip 
                                            label={school.userRole}
                                            color={school.isManager ? "primary" : "default"}
                                            size="small"
                                            sx={{ ml: 2 }}
                                        />
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Visualizzazione Classi */}
                {roleRequirements.needsClasses && classesData.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader 
                                avatar={<ClassIcon color="secondary" />}
                                title="Classi Assegnate"
                            />
                            <Divider />
                            <CardContent>
                                <List dense>
                                    {classesData.map((classItem) => (
                                        <ListItem key={classItem._id}>
                                            <ListItemText 
                                                primary={`${classItem.year}${classItem.section}`}
                                                secondary={
                                                    classItem.academicYear && 
                                                    `Anno accademico: ${classItem.academicYear}`
                                                }
                                            />
                                            <Chip 
                                                label={classItem.status || 'active'} 
                                                color={classItem.status === 'active' ? 'success' : 'default'} 
                                                size="small"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Visualizzazione Studenti */}
                {roleRequirements.needsStudents && studentsData.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader 
                                avatar={<StudentIcon color="info" />}
                                title="Studenti Assegnati"
                            />
                            <Divider />
                            <CardContent>
                                <List dense>
                                    {studentsData.map((student) => (
                                        <ListItem key={student._id}>
                                            <ListItemText 
                                                primary={`${student.firstName} ${student.lastName}`}
                                                secondary={student.email}
                                            />
                                            <Chip 
                                                label={student.status || 'active'} 
                                                color={student.status === 'active' ? 'success' : 'default'} 
                                                size="small"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default UserResourcesAssignment;