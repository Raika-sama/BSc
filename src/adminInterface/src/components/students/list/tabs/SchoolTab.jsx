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
import { axiosInstance } from '../../../../services/axiosConfig';

const SchoolTab = ({ student, setStudent }) => {
    const { schools, loading: schoolsLoading, fetchSchools } = useSchool();
    const { updateStudent } = useStudent();
    const { showNotification } = useNotification();

    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [availableClasses, setAvailableClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        if (student) {
            setSelectedSchool(student.schoolId?._id || '');
            setSelectedClass(student.classId?._id || '');
        }
    }, [student]);

    useEffect(() => {
        if (schools.length === 0) {
            fetchSchools();
        }
    }, [schools.length, fetchSchools]);

    useEffect(() => {
        const loadClasses = async () => {
            if (selectedSchool) {
                try {
                    // Carica direttamente le classi dalla scuola
                    const response = await axiosInstance.get(`/schools/${selectedSchool}`);
                    if (response.data.status === 'success') {
                        const school = response.data.data.school;
                        const activeClasses = (school.classes || [])
                            .filter(c => c.isActive)
                            .sort((a, b) => {
                                if (a.year !== b.year) return a.year - b.year;
                                return a.section.localeCompare(b.section);
                            });
                        setAvailableClasses(activeClasses);
                    }
                } catch (error) {
                    console.error('Error loading classes:', error);
                    showNotification('Errore nel caricamento delle classi', 'error');
                    setAvailableClasses([]);
                }
            } else {
                setAvailableClasses([]);
            }
            setSelectedClass('');
        };
    
        loadClasses();
    }, [selectedSchool, showNotification]);

    const handleSchoolChange = (event) => {
        const newSchoolId = event.target.value;
        if (newSchoolId !== selectedSchool) {
            setSelectedSchool(newSchoolId);
            setSelectedClass('');
            setConfirmAction({
                type: 'school',
                data: { 
                    schoolId: newSchoolId,
                    classId: null,
                    needsClassAssignment: true
                }
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
                action: newClassId === '' ? 'remove' : 'assign',
                data: { 
                    classId: newClassId,
                    needsClassAssignment: newClassId === ''
                }
            });
            setConfirmDialogOpen(true);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            let updatedStudent;

            if (confirmAction.type === 'school') {
                updatedStudent = await updateStudent(student._id, {
                    schoolId: confirmAction.data.schoolId,
                    classId: null,
                    needsClassAssignment: true
                });
            } else if (confirmAction.type === 'class') {
                const response = await axiosInstance.post(
                    confirmAction.action === 'remove' 
                        ? `/students/${student._id}/remove-from-class`
                        : `/students/${student._id}/assign-class`,
                    confirmAction.action === 'remove'
                        ? { reason: 'Rimozione manuale dalla classe' }
                        : { classId: confirmAction.data.classId }
                );

                if (response.data.status === 'success') {
                    updatedStudent = response.data.data.student;
                }
            }

            if (updatedStudent) {
                setStudent(updatedStudent);
                const actionText = confirmAction.type === 'school' 
                    ? 'Scuola'
                    : confirmAction.action === 'remove'
                        ? 'Rimozione dalla classe'
                        : 'Classe';
                showNotification(`${actionText} aggiornata con successo`, 'success');
            }
        } catch (error) {
            console.error('Error updating student:', error);
            showNotification(
                `Errore durante l'aggiornamento: ${error.message}`,
                'error'
            );
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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Gestione Scuola e Classe
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gestisci l'assegnazione dello studente a scuola e classe
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Scuola Attuale
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <SchoolIcon color={student?.schoolId ? "primary" : "disabled"} />
                            <Box>
                                <Typography>
                                    {student?.schoolId?.name || 'Nessuna scuola assegnata'}
                                </Typography>
                                {student?.schoolId && (
                                    <Typography variant="body2" color="text.secondary">
                                        {student.schoolId.schoolType === 'middle_school' ? 
                                            'Scuola Media' : 'Scuola Superiore'}
                                        {student.schoolId.institutionType !== 'none' && 
                                            ` - ${student.schoolId.institutionType}`}
                                    </Typography>
                                )}
                            </Box>
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
                            <Box>
                                {student?.classId ? (
                                    <>
                                        <Typography>
                                            {`${student.classId.year}${student.classId.section}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Anno Accademico: {student.classId.academicYear}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography>
                                        Nessuna classe assegnata
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

        </Box>
    );
};

export default SchoolTab;