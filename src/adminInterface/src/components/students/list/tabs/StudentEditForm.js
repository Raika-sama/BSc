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
    CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useStudent } from '../../../../context/StudentContext';
import { useUser } from '../../../../context/UserContext';
import { useNotification } from '../../../../context/NotificationContext';

const StudentEditForm = ({ student, setStudent }) => {
    const { updateStudent } = useStudent();
    const { users, getUsers } = useUser();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modified, setModified] = useState(false);
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

    useEffect(() => {
        if (users.length === 0) {
            getUsers();
        }
    }, [users.length, getUsers]);

    useEffect(() => {
        if (student) {
            // Debug log per vedere cosa arriva
            console.log('Student data received:', {
                mainTeacher: student.mainTeacher,
                mainTeacherId: student.mainTeacher?._id || student.mainTeacher
            });

            setFormData({
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                fiscalCode: student.fiscalCode || '',
                gender: student.gender || '',
                dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
                email: student.email || '',
                parentEmail: student.parentEmail || '',
                // Assicurati di prendere SOLO l'ID, non l'oggetto intero
                mainTeacher: typeof student.mainTeacher === 'string' 
                    ? student.mainTeacher 
                    : student.mainTeacher?._id || '',
                // Stessa cosa per teachers - prendiamo solo gli ID
                teachers: student.teachers?.map(t => 
                    typeof t === 'string' ? t : t._id
                ) || [],
                specialNeeds: student.specialNeeds || false
            });
        }
    }, [student]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        
        if (name === 'specialNeeds') {
            setFormData(prev => ({ ...prev, specialNeeds: checked }));
        } else if (name === 'teachers') {
            setFormData(prev => ({ 
                ...prev, 
                teachers: Array.isArray(value) ? value : []
            }));
        } else if (name === 'mainTeacher') {
            // Assicurati che il valore sia una stringa o stringa vuota
            setFormData(prev => ({ 
                ...prev, 
                mainTeacher: value || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
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
        
        const studentId = student._id;
        if (!studentId) {
            setError('ID studente non valido');
            return;
        }
    
        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }
    
        try {
            setLoading(true);
            // Puliamo i dati prima di inviarli
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                gender: formData.gender,
                dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
                email: formData.email.trim(),
                // Invia fiscalCode solo se non è vuoto
                ...(formData.fiscalCode ? { fiscalCode: formData.fiscalCode.trim().toUpperCase() } : {}),
                // Invia parentEmail solo se non è vuoto
                ...(formData.parentEmail ? { parentEmail: formData.parentEmail.trim() } : {}),
                // Assicurati che mainTeacher sia una stringa valida o null
                mainTeacher: formData.mainTeacher || null,
                // Filtra eventuali teachers vuoti o invalidi
                teachers: (formData.teachers || []).filter(Boolean),
                specialNeeds: Boolean(formData.specialNeeds)
            };
    
            console.log('Sending update data:', updateData); // Debug log
    
            const updatedStudent = await updateStudent(studentId, updateData);
            setStudent(updatedStudent);
            setModified(false);
            showNotification('Studente aggiornato con successo', 'success');
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.message || err.message);
            showNotification('Errore durante l\'aggiornamento', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
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
                        value={formData.mainTeacher || ''} // Ora questo sarà sempre un ID o stringa vuota
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

export default StudentEditForm;