// src/adminInterface/src/components/classes/details/forms/TeacherForm.js

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
import { useUser } from '../../../../context/UserContext'; // Aggiungi questo import
import { axiosInstance } from '../../../../services/axiosConfig';

const TeacherForm = ({
    open,
    onClose,
    classData,
    isMainTeacher = true
}) => {
    const { updateClass } = useClass();
    const { getUsers } = useUser(); // Usa useUser hook
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

// Separare il caricamento iniziale dalla ricerca
useEffect(() => {
    let mounted = true;

    const loadInitialTeachers = async () => {
        if (!open || !classData?.schoolId?._id) return;
        
        try {
            setLoading(true);
            console.log('Loading teachers with schoolId:', classData.schoolId._id);

            const response = await getUsers({
                schoolId: classData.schoolId._id.toString(), // Forziamo la conversione a string
                limit: 50
            });

            if (mounted && response?.users) {
                console.log('Teachers loaded:', response.users);
                setTeachers(response.users);
            }
        } catch (err) {
            if (mounted) {
                console.error('Error loading teachers:', err);
                setError('Errore nel caricamento degli insegnanti');
            }
        } finally {
            if (mounted) {
                setLoading(false);
            }
        }
    };

    loadInitialTeachers();

    return () => {
        mounted = false;
    };
}, [open, classData?.schoolId?._id]);

// Gestire la ricerca separatamente
useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(async () => {
        if (!open || searchQuery.length < 2) return;
        
        try {
            setLoading(true);
            const response = await getUsers({
                search: searchQuery,
                schoolId: classData.schoolId._id,
                limit: 50
            });

            if (mounted && response?.users) {
                setTeachers(response.users);
            }
        } catch (err) {
            if (mounted) {
                console.error('Error searching teachers:', err);
                setError('Errore nella ricerca');
            }
        } finally {
            if (mounted) {
                setLoading(false);
            }
        }
    }, 300); // Debounce

    return () => {
        mounted = false;
        clearTimeout(timeoutId);
    };
}, [searchQuery, open, classData.schoolId._id]);

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
                        <Autocomplete
                            options={teachers}
                            getOptionLabel={(option) => 
                                `${option.firstName} ${option.lastName} (${option.email})`
                            }
                            onChange={(_, newValue) => setSelectedTeacher(newValue)}
                            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Cerca Docente"
                                    variant="outlined"
                                    fullWidth
                                    required
                                    helperText="Inserisci almeno 2 caratteri per cercare"
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