// src/adminInterface/src/components/classes/details/forms/TeacherForm.js

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    CircularProgress,
    Autocomplete
} from '@mui/material';
import { useClass } from '../../../../context/ClassContext';
import { useUser } from '../../../../context/UserContext'; // Aggiungi questo import
import { axiosInstance } from '../../../../services/axiosConfig';

const TeacherForm = ({ open, onClose, classData, isMainTeacher = true }) => {
    const { getSchoolTeachers } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    useEffect(() => {
        let mounted = true;
    
        const loadTeachers = async () => {
            if (!open || !classData?.schoolId?._id) return;
    
            try {
                setLoading(true);
                setError(null);
                
                const teachersList = await getSchoolTeachers(classData.schoolId._id);
                console.log('Received teachers list:', teachersList);
    
                if (mounted) {
                    if (Array.isArray(teachersList) && teachersList.length > 0) {
                        console.log('Setting teachers:', teachersList);
                        setTeachers(teachersList);
                    } else {
                        console.log('No teachers found or invalid data:', teachersList);
                        setTeachers([]);
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to load teachers:', err);
                    setError('Errore nel caricamento degli insegnanti');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
    
        loadTeachers();
    
        return () => {
            mounted = false;
        };
    }, [open, classData?.schoolId?._id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeacher) {
            setError('Seleziona un insegnante');
            return;
        }
    
        try {
            setLoading(true);
            setError(null);
    
            console.log('Updating main teacher:', {
                classId: classData._id,
                teacherId: selectedTeacher._id,
                teacherName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
            });
    
            const response = await axiosInstance.post(
                `/classes/${classData._id}/update-main-teacher`,
                { teacherId: selectedTeacher._id }
            );
    
            console.log('Update response:', response.data);
    
            if (response.data.status === 'success') {
                onClose(true);  // Trigger refresh dei dati
            }
        } catch (err) {
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data
            });
            setError(err.response?.data?.message || 'Errore durante l\'aggiornamento del docente principale');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => onClose(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {isMainTeacher ? 'Modifica Docente Principale' : 'Aggiungi Docente'}
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        {/* Aggiungi un log per vedere i dati disponibili */}
                        {console.log('Teachers data in render:', teachers)}

                    <Autocomplete
                        options={teachers || []}
                        getOptionLabel={(option) => {
                            console.log('Option being rendered:', option); // Aggiungi questo log
                            return option ? `${option.firstName} ${option.lastName} (${option.email})` : '';
                        }}
                        onChange={(_, newValue) => {
                            console.log('Selected teacher:', newValue); // Aggiungi questo log
                            setSelectedTeacher(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Cerca Docente"
                                variant="outlined"
                                fullWidth
                                required
                                error={!!error}
                                helperText={error || 'Seleziona un docente'}
                            />
                        )}
                        loading={loading}
                        disabled={loading}
                        noOptionsText="Nessun docente trovato"
                        loadingText="Caricamento..."
                    />
                    </Box>

                    {selectedTeacher && (
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                label="Nome"
                                value={selectedTeacher.firstName}
                                fullWidth
                                disabled
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Cognome"
                                value={selectedTeacher.lastName}
                                fullWidth
                                disabled
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Email"
                                value={selectedTeacher.email}
                                fullWidth
                                disabled
                            />
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button 
                        onClick={() => onClose(false)}
                        disabled={loading}
                    >
                        Annulla
                    </Button>
                    <Button 
                        type="submit"
                        variant="contained"
                        disabled={loading || !selectedTeacher}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        Conferma
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TeacherForm;