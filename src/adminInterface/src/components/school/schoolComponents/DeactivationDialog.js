import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    List,
    ListItem,
    ListItemText,
    CircularProgress
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { useSchool } from '../../../context/SchoolContext';

const DeactivationDialog = ({ open, onClose, onConfirm, section }) => {
    // Local state
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Context
    const { getSectionStudents } = useSchool();

    // Fetch students function
    const fetchStudents = useCallback(async () => {
        if (!section?.schoolId || !section?.name) {
            console.log('Missing required section data:', { section });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const fetchedStudents = await getSectionStudents(section.schoolId, section.name);
            setStudents(fetchedStudents || []);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Errore nel recupero degli studenti');
        } finally {
            setLoading(false);
        }
    }, [section?.schoolId, section?.name, getSectionStudents]);

    // Effect for fetching students
    useEffect(() => {
        // Reset state when dialog closes
        if (!open) {
            setStudents([]);
            setError(null);
            return;
        }

        // Fetch students when dialog opens
        if (open && section) {
            fetchStudents();
        }
    }, [open, section, fetchStudents]);

    // Early return if no section
    if (!section) return null;

    // Handlers
    const handleConfirm = () => {
        if (students.length > 0) {
            // Se ci sono studenti, mostra un messaggio di errore
            setError('Non è possibile disattivare una sezione con studenti assegnati');
            return;
        }
        onConfirm(section);
        onClose();
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Conferma Disattivazione Sezione
            </DialogTitle>
            <DialogContent>
                <Typography gutterBottom>
                    Stai per disattivare la sezione <strong>{section.name}</strong>.
                </Typography>

                <Box sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon color="primary" />
                    <Typography>
                        {loading ? (
                            'Verifica studenti in corso...'
                        ) : students.length > 0 ? (
                            `${students.length} studenti sono attualmente assegnati a questa sezione:`
                        ) : (
                            'Nessuno studente verrà influenzato da questa operazione.'
                        )}
                    </Typography>
                </Box>

                {loading && (
                    <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && students.length > 0 && (
                    <>
                        <List dense sx={{ bgcolor: 'background.paper', mt: 2 }}>
                            {students.map((student) => (
                                <ListItem key={student._id}>
                                    <ListItemText
                                        primary={`${student.lastName} ${student.firstName}`}
                                        secondary={`Classe ${student.year}${section.name}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Non è possibile disattivare una sezione con studenti assegnati.
                            Riassegna prima gli studenti ad altre sezioni.
                        </Alert>
                    </>
                )}

                {!loading && students.length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Questa operazione non può essere annullata.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirm}
                    color="warning"
                    variant="contained"
                    disabled={loading || students.length > 0}
                >
                    Conferma Disattivazione
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(DeactivationDialog);