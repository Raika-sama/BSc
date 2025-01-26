import React, { useState, useEffect } from 'react';
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
import { axiosInstance } from '../../../services/axiosConfig';
import { useSchool } from '../../../context/SchoolContext';



const DeactivationDialog = ({ open, onClose, onConfirm, section }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { getSectionStudents } = useSchool();

    // Aggiungiamo una flag per tracciare se abbiamo già fatto il fetch
    const [hasFetchedStudents, setHasFetchedStudents] = useState(false);

    useEffect(() => {
        // Resetta lo stato quando il dialog si chiude
        if (!open) {
            setStudents([]);
            setError(null);
            setHasFetchedStudents(false);
            return;
        }

        // Fetch solo se non l'abbiamo già fatto e abbiamo i dati necessari
        if (!hasFetchedStudents && section?.schoolId && section?.name) {
            const fetchStudents = async () => {
                setLoading(true);
                try {
                    const fetchedStudents = await getSectionStudents(section.schoolId, section.name);
                    setStudents(fetchedStudents || []);
                    setHasFetchedStudents(true);
                } catch (err) {
                    setError('Errore nel recupero degli studenti');
                    console.error('Error fetching students:', err);
                } finally {
                    setLoading(false);
                }
            };

            fetchStudents();
        }
    }, [open, section?.schoolId, section?.name, hasFetchedStudents, getSectionStudents]);
    if (!section) return null;

    const handleConfirm = () => {
        onConfirm(section);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
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
                        {section.studentsCount > 0 
                            ? `${section.studentsCount} studenti verranno rimossi dalle loro classi:`
                            : 'Nessuno studente verrà influenzato da questa operazione.'}
                    </Typography>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress size={24} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                ) : students.length > 0 ? (
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
                ) : null}

                <Alert severity="warning" sx={{ mt: 2 }}>
                    Questa operazione non può essere annullata. Gli studenti dovranno essere riassegnati manualmente ad altre sezioni.
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirm}
                    color="warning"
                    variant="contained"
                >
                    Conferma Disattivazione
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeactivationDialog;