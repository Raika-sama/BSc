import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Avatar,
    InputAdornment,
    IconButton,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider
} from '@mui/material';
import {
    School as SchoolIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

import { useUser } from '../../../../context/UserContext';
import { useStudent } from '../../../../context/StudentContext';
import { useNotification } from '../../../../context/NotificationContext';
import { axiosInstance } from '../../../../services/axiosConfig';

const TeachersTab = ({ student, setStudent }) => {
    const { updateStudent } = useStudent();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [error, setError] = useState(null);
    const [schoolTeachers, setSchoolTeachers] = useState([]);

    // Carica i docenti della scuola quando il componente si monta o cambia la scuola
    useEffect(() => {
        const loadSchoolTeachers = async () => {
            if (!student?.schoolId?._id) return;
            
            try {
                setLoading(true);
                console.log('Loading teachers for school:', student.schoolId._id);
                
                const response = await axiosInstance.get(`/users/school/${student.schoolId._id}/teachers`);
                
                if (response.data.status === 'success') {
                    const teachers = response.data.data?.data?.teachers || 
                                    response.data.data?.teachers || 
                                    [];
                    
                    console.log('School teachers loaded:', {
                        count: teachers.length,
                        sample: teachers.slice(0, 3).map(t => t.firstName + ' ' + t.lastName)
                    });
                    
                    setSchoolTeachers(teachers);
                }
            } catch (error) {
                console.error('Error loading school teachers:', error);
                setError('Errore nel caricamento dei docenti della scuola');
            } finally {
                setLoading(false);
            }
        };
        
        loadSchoolTeachers();
    }, [student?.schoolId?._id]);

    // Filtra gli insegnanti disponibili (solo quelli non già assegnati)
    useEffect(() => {
        if (schoolTeachers.length > 0 && student) {
            // Ottieni gli ID dei docenti già assegnati
            const assignedTeacherIds = (student.teachers || []).map(teacher => 
                typeof teacher === 'string' ? teacher : teacher._id || teacher.id
            );
            
            console.log('Already assigned teachers:', assignedTeacherIds);
            
            // Filtra gli insegnanti disponibili
            const filteredTeachers = schoolTeachers.filter(teacher => {
                // Non deve essere già tra i docenti assegnati
                const teacherId = teacher._id || teacher.id;
                return !assignedTeacherIds.includes(teacherId);
            });
            
            console.log('Available teachers after filtering:', {
                total: filteredTeachers.length,
                names: filteredTeachers.map(t => `${t.firstName} ${t.lastName}`)
            });
            
            setAvailableTeachers(filteredTeachers);
        } else {
            setAvailableTeachers([]);
        }
    }, [schoolTeachers, student]);

    // Gestisce l'apertura del dialog per aggiungere docenti
    const handleOpenAddDialog = () => {
        setSelectedTeachers([]);
        setOpenAddDialog(true);
    };

    // Gestisce la chiusura del dialog
    const handleCloseDialog = () => {
        setOpenAddDialog(false);
        setSelectedTeachers([]);
        setSearchQuery('');
    };

    // Gestisce la selezione di docenti da aggiungere
    const handleTeacherSelection = (e) => {
        setSelectedTeachers(e.target.value);
    };

    // Filtra i docenti disponibili in base alla ricerca
    const filteredTeachers = availableTeachers.filter(teacher => 
        `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Gestisce l'aggiunta dei docenti selezionati
    const handleAddTeachers = async () => {
        if (selectedTeachers.length === 0) {
            showNotification('Seleziona almeno un docente da aggiungere', 'warning');
            return;
        }

        try {
            setLoading(true);
            
            // Ottieni gli ID dei docenti già assegnati
            const currentTeacherIds = (student.teachers || []).map(teacher => 
                typeof teacher === 'string' ? teacher : teacher._id
            );
            
            // Unisci gli ID esistenti con i nuovi selezionati
            const updatedTeacherIds = [...new Set([...currentTeacherIds, ...selectedTeachers])];
            
            console.log('Updating teachers:', {
                current: currentTeacherIds,
                selected: selectedTeachers,
                updated: updatedTeacherIds
            });
            
            // Aggiorna lo studente con i nuovi docenti
            const updatedStudent = await updateStudent(student._id, {
                teachers: updatedTeacherIds,
                updateTeacherAssignments: true // Nuovo flag per indicare l'aggiornamento anche degli assignedStudentIds nei profili docente
            });
            
            // Aggiorna lo stato dello studente nel componente genitore
            setStudent(updatedStudent);
            
            showNotification('Docenti assegnati con successo', 'success');
            handleCloseDialog();
        } catch (err) {
            console.error('Error adding teachers:', err);
            setError(err.message || 'Errore durante l\'assegnazione dei docenti');
            showNotification('Errore durante l\'assegnazione dei docenti', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Gestisce la rimozione di un docente
    const handleRemoveTeacher = async (teacherId) => {
        try {
            setLoading(true);
            
            // Filtra il docente da rimuovere
            const updatedTeachers = (student.teachers || [])
                .filter(teacher => {
                    const id = typeof teacher === 'string' ? teacher : teacher._id;
                    return id !== teacherId;
                })
                .map(teacher => typeof teacher === 'string' ? teacher : teacher._id);
            
            // Aggiorna lo studente con la lista docenti aggiornata
            const updatedStudent = await updateStudent(student._id, {
                teachers: updatedTeachers,
                updateTeacherAssignments: true // Nuovo flag per indicare l'aggiornamento anche degli assignedStudentIds nei profili docente
            });
            
            // Aggiorna lo stato
            setStudent(updatedStudent);
            
            showNotification('Docente rimosso con successo', 'success');
        } catch (err) {
            console.error('Error removing teacher:', err);
            setError(err.message || 'Errore durante la rimozione del docente');
            showNotification('Errore durante la rimozione del docente', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            {/* Dialog per aggiungere docenti */}
            <Dialog 
                open={openAddDialog} 
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Aggiungi Docenti
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Cerca docente"
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>
                    
                    {/* Debug info */}
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.75rem' }}>
                        <Typography variant="caption" component="div">
                            Scuola: {student?.schoolId?.name || 'N/A'} (ID: {student?.schoolId?._id || 'N/A'})
                        </Typography>
                        <Typography variant="caption" component="div">
                            Docenti disponibili: {availableTeachers.length} di {schoolTeachers.length} totali
                        </Typography>
                    </Box>
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="teacher-select-label">Seleziona Utenti</InputLabel>
                        <Select
                            labelId="teacher-select-label"
                            id="teacher-select"
                            multiple
                            value={selectedTeachers}
                            onChange={handleTeacherSelection}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map(teacherId => {
                                        const teacher = availableTeachers.find(t => t._id === teacherId);
                                        return (
                                            <Chip 
                                                key={teacherId} 
                                                label={teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherId} 
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {student.schoolId ? (
                                filteredTeachers.length > 0 ? (
                                    filteredTeachers.map((teacher) => (
                                        <MenuItem key={teacher._id} value={teacher._id}>
                                            {`${teacher.firstName} ${teacher.lastName} (${teacher.role})`}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>
                                        <Typography variant="body2" color="text.secondary">
                                            Non ci sono utenti disponibili nella scuola
                                        </Typography>
                                    </MenuItem>
                                )
                            ) : (
                                <MenuItem disabled>
                                    <Typography variant="body2" color="text.secondary">
                                        Lo studente deve essere assegnato a una scuola prima di poter associare utenti
                                    </Typography>
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseDialog} 
                        color="inherit"
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleAddTeachers} 
                        variant="contained" 
                        color="primary" 
                        disabled={selectedTeachers.length === 0 || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        {loading ? 'Aggiungendo...' : 'Aggiungi Docenti'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Contenuto principale */}
            <Box>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3 
                }}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Gestione Docenti
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Visualizza e gestisci i docenti assegnati allo studente
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddDialog}
                        disabled={!student?.schoolId?._id}
                    >
                        Assegna Docenti
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Docente principale */}
                    <Grid item xs={12}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 3
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SchoolIcon color="primary" sx={{ mr: 2 }} />
                                <Typography variant="subtitle1" fontWeight="500">
                                    Docente Principale
                                </Typography>
                            </Box>
                            
                            <Box sx={{ p: 2, my: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                {student.mainTeacher ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body1">
                                                {`${student.mainTeacher.firstName || ''} ${student.mainTeacher.lastName || ''}`}
                                                {(!student.mainTeacher.firstName && !student.mainTeacher.lastName) ? 
                                                  `Docente ${(student.mainTeacher._id || '').substring(0, 6)}...` : ''}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {student.mainTeacher._id || student.mainTeacher.id || 'N/D'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Nessun docente principale assegnato. Il docente principale viene assegnato tramite la gestione classi.
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    <em>Nota: Il docente principale viene assegnato automaticamente quando lo studente viene aggiunto a una classe. Questa assegnazione può essere modificata solo dal coordinatore di classe.</em>
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Docenti aggiuntivi */}
                    <Grid item xs={12}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="500">
                                    Docenti Aggiuntivi
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenAddDialog}
                                    disabled={!student?.schoolId?._id}
                                >
                                    Aggiungi
                                </Button>
                            </Box>

                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            )}

                            {!loading && student.teachers?.length > 0 ? (
                                <List>
                                    {student.teachers.map(teacher => {
                                        // Gestisci sia oggetti che ID
                                        const teacherId = typeof teacher === 'string' ? teacher : teacher._id;
                                        const teacherName = typeof teacher === 'string' 
                                            ? `Docente ${teacher.substr(0, 8)}...` 
                                            : `${teacher.firstName || ''} ${teacher.lastName || ''}`;
                                        
                                        // Se non ci sono firstName e lastName, usa l'ID formattato
                                        const displayName = teacherName.trim() || `Docente ${teacherId?.substr(0, 8)}...`;
                                        
                                        return (
                                            <React.Fragment key={teacherId}>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar>
                                                            <PersonIcon />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText 
                                                        primary={displayName} 
                                                        secondary={typeof teacher !== 'string' ? teacher.email : ''} 
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton 
                                                            edge="end" 
                                                            color="error"
                                                            onClick={() => handleRemoveTeacher(teacherId)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Nessun docente aggiuntivo assegnato
                                    </Typography>
                                    {student?.schoolId?._id && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={handleOpenAddDialog}
                                            sx={{ mt: 2 }}
                                        >
                                            Assegna Docenti
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

TeachersTab.propTypes = {
    student: PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        mainTeacher: PropTypes.shape({
            _id: PropTypes.string,
            firstName: PropTypes.string,
            lastName: PropTypes.string
        }),
        teachers: PropTypes.arrayOf(
            PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.shape({
                    _id: PropTypes.string,
                    firstName: PropTypes.string,
                    lastName: PropTypes.string
                })
            ])
        )
    }).isRequired,
    setStudent: PropTypes.func.isRequired
};

export default TeachersTab;