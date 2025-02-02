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

    // Modifica la funzione per caricare gli insegnanti
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                setLoading(true);
                console.log('Fetching teachers with filters:', {
                    search: searchQuery,
                    role: 'teacher',
                    schoolId: classData.schoolId._id,
                });

                // Usa getUsers con i filtri appropriati
                const response = await getUsers({
                    search: searchQuery,
                    role: 'teacher', // Filtra solo per insegnanti
                    schoolId: classData.schoolId._id, // Filtra per la scuola della classe
                    limit: 50 // Aumenta il limite per ottenere più risultati
                });
                console.log('Teachers response:', response);

                
                if (response && response.users) {
                    setTeachers(response.users);
                } else {
                    console.error('Invalid response format:', response);
                }
            } catch (err) {
                console.error('Error fetching teachers:', err);
                setError('Errore nel caricamento degli insegnanti');
            } finally {
                setLoading(false);
            }
        };

        if (open && searchQuery.length >= 2) { // Aggiungi un minimo di caratteri per la ricerca
            fetchTeachers();
        }
    }, [open, searchQuery, classData.schoolId._id, getUsers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeacher) {
            setError('Seleziona un insegnante');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Prepara i dati da inviare
            const updateData = {
                ...classData,
                mainTeacher: selectedTeacher._id
            };

            // Chiama l'API per aggiornare la classe
            await updateClass(classData._id, updateData);

            // Chiudi il form e aggiorna i dati
            onClose(true);
        } catch (err) {
            setError(err.message || 'Errore durante l\'aggiornamento del docente principale');
            console.error('Error updating main teacher:', err);
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