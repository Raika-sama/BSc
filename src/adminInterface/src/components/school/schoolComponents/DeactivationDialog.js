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
import { useSchool } from '../../../context/SchoolContext';

const DeactivationDialog = ({ open, onClose, onConfirm, section }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { getSectionStudents } = useSchool();

    useEffect(() => {
        const fetchStudents = async () => {
            if (!open || !section?.schoolId || !section?.name) {
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                console.log('Fetching students for section:', {
                    schoolId: section.schoolId,
                    sectionName: section.name
                });
                
                const fetchedStudents = await getSectionStudents(
                    section.schoolId,
                    section.name
                );
                
                setStudents(fetchedStudents || []);
            } catch (err) {
                console.error('Error fetching students:', err);
                setError('Errore nel recupero degli studenti');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [open, section, getSectionStudents]);

    // Reset degli stati quando il dialog si chiude
    useEffect(() => {
        if (!open) {
            setStudents([]);
            setError(null);
        }
    }, [open]);

    if (!section) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Conferma Disattivazione Sezione {section.name}
            </DialogTitle>
            <DialogContent>
                <Typography gutterBottom>
                    Questa operazione disattiverà la sezione e tutte le sue classi.
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                ) : (
                    <>
                        <Box sx={{ my: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Studenti coinvolti: {students.length}
                            </Typography>
                            {students.length > 0 && (
                                <List dense>
                                    {students.map((student) => (
                                        <ListItem key={student._id}>
                                            <ListItemText
                                                primary={`${student.lastName} ${student.firstName}`}
                                                secondary={`Classe ${student.year}${section.name}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                        <Alert severity="warning">
                            {students.length > 0 
                                ? 'Gli studenti verranno rimossi dalle loro classi attuali.'
                                : 'Non ci sono studenti assegnati a questa sezione.'}
                        </Alert>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={onConfirm}
                    color="warning"
                    disabled={loading}
                >
                    Conferma Disattivazione
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeactivationDialog;