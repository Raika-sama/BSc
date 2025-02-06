import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Button,
    Alert,
    Typography,
    CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useStudent } from '../../context/StudentContext';
import { useSchool } from '../../context/SchoolContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

const StudentForm = () => {
    const navigate = useNavigate();
    const { createStudent } = useStudent();
    const { schools, fetchSchools } = useSchool();
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
        schoolId: '',
        parentEmail: '',
        mainTeacher: '',
        teachers: [],
        specialNeeds: false,
        status: 'pending',
        needsClassAssignment: true,
        isActive: true
    });

    useEffect(() => {
        if (schools.length === 0) fetchSchools();
        if (users.length === 0) getUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        
        if (name === 'specialNeeds') {
            setFormData(prev => ({ ...prev, specialNeeds: checked }));
        } else if (name === 'teachers') {
            setFormData(prev => ({ ...prev, teachers: Array.isArray(value) ? value : [] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.firstName) errors.push('Nome richiesto');
        if (!formData.lastName) errors.push('Cognome richiesto');
        if (!formData.gender) errors.push('Genere richiesto');
        if (!formData.dateOfBirth) errors.push('Data di nascita richiesta');
        if (!formData.email) errors.push('Email richiesta');
        if (!formData.schoolId) errors.push('Scuola richiesta');
        
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

        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newStudent = await createStudent(formData);
            showNotification('Studente creato con successo', 'success');
            navigate(`/admin/students/${newStudent.id}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            showNotification('Errore nella creazione dello studente', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6">Nuovo Studente</Typography>
                <Typography variant="body2" color="text.secondary">
                    Inserisci i dati del nuovo studente
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
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

                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Scuola</InputLabel>
                            <Select
                                name="schoolId"
                                value={formData.schoolId}
                                onChange={handleChange}
                                label="Scuola"
                            >
                                {schools.map(school => (
                                    <MenuItem key={school._id} value={school._id}>
                                        {school.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

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
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            >
                                {loading ? 'Creazione...' : 'Crea Studente'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default StudentForm;