// src/components/users/details/UserResourcesAssignment.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Button,
    Alert,
    CircularProgress,
    ListItemText,
    Checkbox,
    Divider,
    Card,
    CardHeader,
    CardContent
} from '@mui/material';
import {
    School as SchoolIcon,
    Class as ClassIcon,
    Person as StudentIcon
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';
import { useSchool } from '../../../context/SchoolContext';
import { useClass } from '../../../context/ClassContext';
import { useStudent } from '../../../context/StudentContext';

// Definisci quali risorse sono necessarie per ogni ruolo
const ROLE_RESOURCE_REQUIREMENTS = {
    admin: {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    },
    developer: {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    },
    manager: {
        needsSchool: true,
        needsClasses: false,
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

const UserResourcesAssignment = ({ userData, onUpdate }) => {
    const { updateUser } = useUser();
    const { schools, getAllSchools } = useSchool();
    const { getClasses } = useClass();
    const { getStudents } = useStudent();

    // Stato per le risorse selezionate
    const [selectedSchool, setSelectedSchool] = useState(userData.assignedSchoolId || '');
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState(userData.assignedClassIds || []);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(userData.assignedStudentIds || []);

    // Stato per i controlli UI
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Ottieni i requisiti in base al ruolo
    const roleRequirements = ROLE_RESOURCE_REQUIREMENTS[userData.role] || {
        needsSchool: false,
        needsClasses: false,
        needsStudents: false
    };

    // Carica le scuole all'avvio
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                
                // Carica tutte le scuole
                if (roleRequirements.needsSchool) {
                    await getAllSchools();
                }

                // Se c'è una scuola assegnata e sono necessarie classi o studenti
                if (userData.assignedSchoolId && 
                    (roleRequirements.needsClasses || roleRequirements.needsStudents)) {
                    // Carica classi per la scuola
                    if (roleRequirements.needsClasses) {
                        const classesData = await getClasses({ schoolId: userData.assignedSchoolId });
                        setAvailableClasses(classesData || []);
                    }

                    // Carica studenti per la scuola
                    if (roleRequirements.needsStudents) {
                        const studentsData = await getStudents({ schoolId: userData.assignedSchoolId });
                        setAvailableStudents(studentsData || []);
                    }
                }
            } catch (error) {
                console.error('Error loading resources:', error);
                setError('Errore nel caricamento delle risorse');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [userData.role, userData.assignedSchoolId]);

    // Gestisci cambio scuola
    const handleSchoolChange = async (event) => {
        const schoolId = event.target.value;
        setSelectedSchool(schoolId);

        try {
            setLoading(true);
            
            // Reset classi e studenti selezionati
            setSelectedClasses([]);
            setSelectedStudents([]);
            
            if (schoolId) {
                // Carica classi per la nuova scuola
                if (roleRequirements.needsClasses) {
                    const classesData = await getClasses({ schoolId });
                    setAvailableClasses(classesData || []);
                }

                // Carica studenti per la nuova scuola
                if (roleRequirements.needsStudents) {
                    const studentsData = await getStudents({ schoolId });
                    setAvailableStudents(studentsData || []);
                }
            } else {
                // Reset available resources if no school selected
                setAvailableClasses([]);
                setAvailableStudents([]);
            }
        } catch (error) {
            console.error('Error loading school resources:', error);
            setError('Errore nel caricamento delle risorse della scuola');
        } finally {
            setLoading(false);
        }
    };

    // Gestisci cambio classi
    const handleClassesChange = (event) => {
        setSelectedClasses(event.target.value);
    };

    // Gestisci cambio studenti
    const handleStudentsChange = (event) => {
        setSelectedStudents(event.target.value);
    };

    // Salva le assegnazioni

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
    
            // Validazione
            if (roleRequirements.needsSchool && !selectedSchool) {
                setError('È necessario selezionare una scuola');
                return;
            }
    
            if (roleRequirements.needsClasses && selectedClasses.length === 0) {
                setError('È necessario selezionare almeno una classe');
                return;
            }
    
            if (roleRequirements.needsStudents && selectedStudents.length === 0) {
                setError('È necessario selezionare almeno uno studente');
                return;
            }
    
            // Prepara i dati da aggiornare
            const updateData = {
                assignedSchoolId: selectedSchool || null,
                assignedClassIds: selectedClasses || [],
                assignedStudentIds: selectedStudents || []
            };
            
            console.log('Salvataggio risorse - UserResourcesAssignment - updateData:', updateData, 'userId:', userData._id);
    
            // Verifica che l'ID utente sia valido
            if (!userData._id) {
                setError('ID utente mancante');
                console.error('ID utente mancante');
                return;
            }
    
            // Aggiorna l'utente
            await updateUser(userData._id, updateData);
            
            // Notifica il componente padre
            if (typeof onUpdate === 'function') {
                onUpdate();
            } else {
                console.warn('onUpdate non è una funzione o non è definita');
            }
            
        } catch (error) {
            console.error('Errore completo durante il salvataggio delle risorse:', error);
            setError('Errore durante il salvataggio delle assegnazioni: ' + (error.message || 'Errore sconosciuto'));
        } finally {
            setSaving(false);
        }
    };

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

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
                Assegnazione Risorse
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Selezione Scuola */}
                {roleRequirements.needsSchool && (
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader 
                                avatar={<SchoolIcon color="primary" />}
                                title="Scuola Assegnata"
                            />
                            <Divider />
                            <CardContent>
                                <FormControl fullWidth disabled={loading || saving}>
                                    <InputLabel>Seleziona Scuola</InputLabel>
                                    <Select
                                        value={selectedSchool}
                                        onChange={handleSchoolChange}
                                        label="Seleziona Scuola"
                                    >
                                        <MenuItem value="">
                                            <em>Nessuna</em>
                                        </MenuItem>
                                        {schools.map((school) => (
                                            <MenuItem value={school._id} key={school._id}>
                                                {school.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Selezione Classi */}
                {roleRequirements.needsClasses && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader 
                                avatar={<ClassIcon color="secondary" />}
                                title="Classi Assegnate"
                            />
                            <Divider />
                            <CardContent>
                                <FormControl 
                                    fullWidth 
                                    disabled={!selectedSchool || loading || saving}
                                >
                                    <InputLabel>Seleziona Classi</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedClasses}
                                        onChange={handleClassesChange}
                                        label="Seleziona Classi"
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const classItem = availableClasses.find(c => c._id === value);
                                                    return (
                                                        <Chip 
                                                            key={value} 
                                                            label={classItem ? `${classItem.year}${classItem.section}` : value} 
                                                            size="small" 
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {availableClasses.map((classItem) => (
                                            <MenuItem value={classItem._id} key={classItem._id}>
                                                <Checkbox checked={selectedClasses.indexOf(classItem._id) > -1} />
                                                <ListItemText primary={`${classItem.year}${classItem.section} - ${classItem.name || 'Classe senza nome'}`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {!selectedSchool && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Seleziona prima una scuola
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Selezione Studenti */}
                {roleRequirements.needsStudents && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader 
                                avatar={<StudentIcon color="info" />}
                                title="Studenti Assegnati"
                            />
                            <Divider />
                            <CardContent>
                                <FormControl 
                                    fullWidth 
                                    disabled={!selectedSchool || loading || saving}
                                >
                                    <InputLabel>Seleziona Studenti</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedStudents}
                                        onChange={handleStudentsChange}
                                        label="Seleziona Studenti"
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const student = availableStudents.find(s => s._id === value);
                                                    return (
                                                        <Chip 
                                                            key={value} 
                                                            label={student ? `${student.firstName} ${student.lastName}` : value} 
                                                            size="small" 
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {availableStudents.map((student) => (
                                            <MenuItem value={student._id} key={student._id}>
                                                <Checkbox checked={selectedStudents.indexOf(student._id) > -1} />
                                                <ListItemText primary={`${student.firstName} ${student.lastName}`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {!selectedSchool && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Seleziona prima una scuola
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {loading && (
                <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress />
                </Box>
            )}

            <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading || saving}
                    startIcon={saving && <CircularProgress size={24} />}
                >
                    Salva Assegnazioni
                </Button>
            </Box>
        </Box>
    );
};

export default UserResourcesAssignment;