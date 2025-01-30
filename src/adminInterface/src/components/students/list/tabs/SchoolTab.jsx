import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Alert,
    Stack,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import {
    School as SchoolIcon,
    CalendarToday as CalendarIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useSchool } from '../../../../context/SchoolContext';
import { useStudent } from '../../../../context/StudentContext';
import { useNotification } from '../../../../context/NotificationContext';

const SchoolTab = ({ student, setStudent }) => {
    const { schools, loading: schoolsLoading, fetchSchools } = useSchool();
    const { updateStudent } = useStudent();
    const { showNotification } = useNotification();

    const [selectedSchool, setSelectedSchool] = useState(student?.schoolId?._id || '');
    const [selectedClass, setSelectedClass] = useState(student?.classId?._id || '');
    const [availableClasses, setAvailableClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    // Carica scuole all'avvio
    useEffect(() => {
        if (schools.length === 0) {
            fetchSchools();
        }
    }, [schools.length, fetchSchools]);

    // Aggiorna classi disponibili quando cambia la scuola
    useEffect(() => {
        if (selectedSchool) {
            const school = schools.find(s => s._id === selectedSchool);
            if (school) {
                // Qui dovresti fare una chiamata API per ottenere le classi della scuola
                // Per ora simuliamo con dati statici
                const classes = school.classes || [];
                setAvailableClasses(classes);
            }
        } else {
            setAvailableClasses([]);
            setSelectedClass('');
        }
    }, [selectedSchool, schools]);

    const handleSchoolChange = (event) => {
        const newSchoolId = event.target.value;
        if (newSchoolId !== selectedSchool) {
            setSelectedSchool(newSchoolId);
            setSelectedClass(''); // Reset classe quando cambia scuola
            setConfirmAction({
                type: 'school',
                data: { schoolId: newSchoolId }
            });
            setConfirmDialogOpen(true);
        }
    };

    const handleClassChange = (event) => {
        const newClassId = event.target.value;
        if (newClassId !== selectedClass) {
            setSelectedClass(newClassId);
            setConfirmAction({
                type: 'class',
                data: { classId: newClassId }
            });
            setConfirmDialogOpen(true);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const updateData = {
                ...confirmAction.data,
                needsClassAssignment: confirmAction.type === 'school'
            };

            const updatedStudent = await updateStudent(student._id, updateData);
            setStudent(updatedStudent);
            showNotification(
                `${confirmAction.type === 'school' ? 'Scuola' : 'Classe'} aggiornata con successo`,
                'success'
            );
        } catch (error) {
            showNotification(
                `Errore durante l'aggiornamento: ${error.message}`,
                'error'
            );
            // Reset selezioni in caso di errore
            setSelectedSchool(student?.schoolId?._id || '');
            setSelectedClass(student?.classId?._id || '');
        } finally {
            setLoading(false);
            setConfirmDialogOpen(false);
            setConfirmAction(null);
        }
    };

    return (
        <Box>
            {/* Header section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Gestione Scuola e Classe
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gestisci l'assegnazione dello studente a scuola e classe
                </Typography>
            </Box>

            {/* Current status */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Scuola Attuale
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <SchoolIcon color={student?.schoolId ? "primary" : "disabled"} />
                            <Typography>
                                {student?.schoolId?.name || 'Nessuna scuola assegnata'}
                            </Typography>
                            {student?.needsClassAssignment && (
                                <Chip
                                    icon={<WarningIcon />}
                                    label="Assegnazione classe necessaria"
                                    color="warning"
                                    size="small"
                                />
                            )}
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Classe Attuale
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <CalendarIcon color={student?.classId ? "primary" : "disabled"} />
                            <Typography>
                                {student?.classId ? 
                                    `${student.classId.year}${student.classId.section}` : 
                                    'Nessuna classe assegnata'
                                }
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

            {/* Change section */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Modifica Assegnazione
                </Typography>

                <Stack spacing={3} sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Scuola</InputLabel>
                        <Select
                            value={selectedSchool}
                            onChange={handleSchoolChange}
                            label="Scuola"
                            disabled={loading || schoolsLoading}
                        >
                            <MenuItem value="">
                                <em>Nessuna scuola</em>
                            </MenuItem>
                            {schools.map((school) => (
                                <MenuItem key={school._id} value={school._id}>
                                    {school.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Classe</InputLabel>
                        <Select
                            value={selectedClass}
                            onChange={handleClassChange}
                            label="Classe"
                            disabled={!selectedSchool || loading || availableClasses.length === 0}
                        >
                            <MenuItem value="">
                                <em>Nessuna classe</em>
                            </MenuItem>
                            {availableClasses.map((classInfo) => (
                                <MenuItem key={classInfo._id} value={classInfo._id}>
                                    {`${classInfo.year}${classInfo.section}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {!selectedSchool && (
                        <Alert severity="info">
                            Seleziona prima una scuola per vedere le classi disponibili
                        </Alert>
                    )}
                </Stack>
            </Paper>

            {/* Confirm Dialog */}
            <Dialog 
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>
                    Conferma Modifica
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {confirmAction?.type === 'school' 
                            ? 'Sei sicuro di voler cambiare la scuola? Questa azione rimuoverà anche l\'assegnazione alla classe attuale.'
                            : 'Sei sicuro di voler cambiare la classe?'
                        }
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmDialogOpen(false)}
                        disabled={loading}
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        Conferma
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolTab;