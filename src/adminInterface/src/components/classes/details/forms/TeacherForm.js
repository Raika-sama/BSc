import React, { useState, useEffect } from 'react';
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
import { useUser } from '../../../../context/UserContext';
import { axiosInstance } from '../../../../services/axiosConfig';

const TeacherForm = ({ open, onClose, classData, isMainTeacher = true }) => {
    const { getSchoolTeachers } = useUser();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    // Carica i docenti solo quando il form viene aperto
    useEffect(() => {
        if (!open || !classData?.schoolId?._id) {
            return;
        }

        const fetchTeachers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getSchoolTeachers(classData.schoolId._id);
                setTeachers(response || []);
            } catch (err) {
                console.error('Failed to load teachers:', err);
                setError('Errore nel caricamento degli insegnanti');
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, [open, classData?.schoolId?._id]); // Rimuovi getSchoolTeachers dalle dipendenze

    // Reset dello stato quando il form viene chiuso
    useEffect(() => {
        if (!open) {
            setSelectedTeacher(null);
            setError(null);
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeacher) {
            setError('Seleziona un insegnante');
            return;
        }
    
        try {
            setLoading(true);
            setError(null);
    
            const response = await axiosInstance.post(
                `/classes/${classData._id}/update-main-teacher`,
                { teacherId: selectedTeacher._id }
            );
    
            if (response.data.status === 'success') {
                onClose(true);
            }
        } catch (err) {
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
                        <Autocomplete
                            options={teachers}
                            getOptionLabel={(option) => 
                                `${option.firstName} ${option.lastName} (${option.email})`
                            }
                            onChange={(_, newValue) => setSelectedTeacher(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Cerca Docente"
                                    variant="outlined"
                                    fullWidth
                                    required
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