import React, { useState, useEffect } from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    Button,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useStudent } from '../../../../context/StudentContext';
import { useUser } from '../../../../context/UserContext';
import { useNotification } from '../../../../context/NotificationContext';

const InfoTab = ({ student, setStudent }) => {
    const { updateStudent } = useStudent();
    const { users, getUsers } = useUser();
    const { showNotification } = useNotification();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fiscalCode: '',
        gender: '',
        dateOfBirth: '',
        email: '',
        parentEmail: '',
        mainTeacher: '',
        teachers: [],
        specialNeeds: false
    });
    const [modified, setModified] = useState(false);

    // Carica utenti (docenti) se non presenti
    useEffect(() => {
        if (users.length === 0) {
            getUsers();
        }
    }, [users.length, getUsers]);

    // Inizializza form con dati studente
    useEffect(() => {
        if (student) {
            setFormData({
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                fiscalCode: student.fiscalCode || '',
                gender: student.gender || '',
                dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
                email: student.email || '',
                parentEmail: student.parentEmail || '',
                mainTeacher: student.mainTeacher?._id || '',
                teachers: student.teachers?.map(t => t._id) || [],
                specialNeeds: student.specialNeeds || false
            });
        }
    }, [student]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        
        // Gestione speciale per switch
        if (name === 'specialNeeds') {
            setFormData(prev => ({
                ...prev,
                specialNeeds: checked
            }));
        }
        // Gestione speciale per select multipla docenti
        else if (name === 'teachers') {
            setFormData(prev => ({
                ...prev,
                teachers: Array.isArray(value) ? value : []
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        setModified(true);
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.firstName) errors.push('Nome richiesto');
        if (!formData.lastName) errors.push('Cognome richiesto');
        if (!formData.gender) errors.push('Genere richiesto');
        if (!formData.dateOfBirth) errors.push('Data di nascita richiesta');
        if (!formData.email) errors.push('Email richiesta');
        
        if (formData.fiscalCode && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(formData.fiscalCode)) {
            errors.push('Formato codice fiscale non valido');
        }
        
        if (formData.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
            errors.push('Formato email non valido');
        }

        if (formData.parentEmail && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.parentEmail)) {
            errors.push('Formato email genitore non valido');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const studentId = student.id || student._id;
        console.log('[InfoTab] Submitting update for student:', {
            studentId,
            student,
            formData
        });
    
        if (!studentId) {
            setError('ID studente non valido');
            return;
        }
    
        try {
            const updateData = {
                ...formData,
                dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
                mainTeacher: formData.mainTeacher || null,
                teachers: formData.teachers || []
            };
    
            console.log('[InfoTab] Update data being sent:', updateData);
    
            const updatedStudent = await updateStudent(studentId, updateData);
            console.log('[InfoTab] Update successful:', updatedStudent);
    
            setStudent(updatedStudent);
            setModified(false);
            showNotification('Studente aggiornato con successo', 'success');
        } catch (err) {
            console.error('[InfoTab] Update failed:', err);
            setError(err.response?.data?.message || err.message);
            showNotification('Errore durante l\'aggiornamento', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Dati Personali
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gestisci le informazioni personali dello studente
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Prima riga: Dati principali */}
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Nome"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Cognome"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Codice Fiscale"
                        name="fiscalCode"
                        value={formData.fiscalCode}
                        onChange={handleChange}
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                </Grid>

                {/* Seconda riga: Dettagli personali */}
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth required>
                        <InputLabel>Genere</InputLabel>
                        <Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            label="Genere"
                        >
                            <MenuItem value="M">Maschio</MenuItem>
                            <MenuItem value="F">Femmina</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Data di Nascita"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                {/* Terza riga: Contatti */}
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Email Genitore"
                        name="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={handleChange}
                    />
                </Grid>

                {/* Quarta riga: Docenti */}
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Docente Principale</InputLabel>
                        <Select
                            name="mainTeacher"
                            value={formData.mainTeacher}
                            onChange={handleChange}
                            label="Docente Principale"
                        >
                            <MenuItem value="">Nessuno</MenuItem>
                            {users.map(user => (
                                <MenuItem key={user._id} value={user._id}>
                                    {`${user.firstName} ${user.lastName}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Docenti</InputLabel>
                        <Select
                            multiple
                            name="teachers"
                            value={formData.teachers}
                            onChange={handleChange}
                            label="Docenti"
                        >
                            {users.map(user => (
                                <MenuItem key={user._id} value={user._id}>
                                    {`${user.firstName} ${user.lastName}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Ultima riga: Flag e Submit */}
                <Grid item xs={12}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 2
                    }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.specialNeeds}
                                    onChange={handleChange}
                                    name="specialNeeds"
                                />
                            }
                            label="Necessità Speciali"
                        />
                        
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!modified || loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        >
                            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </form>
    );
};

export default InfoTab;