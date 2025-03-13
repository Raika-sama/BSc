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
import { useNotification } from '../../../../context/NotificationContext';

const StudentEditForm = ({ student, setStudent, onCancel }) => {
    const { updateStudent } = useStudent();
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
        specialNeeds: false
    });

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
                specialNeeds: student.specialNeeds || false
            });
        }
    }, [student]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        
        if (name === 'specialNeeds') {
            setFormData(prev => ({ ...prev, specialNeeds: checked }));
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
            setError(null);
            
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                gender: formData.gender,
                dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
                email: formData.email.trim(),
                ...(formData.fiscalCode ? { fiscalCode: formData.fiscalCode.trim().toUpperCase() } : {}),
                ...(formData.parentEmail ? { parentEmail: formData.parentEmail.trim() } : {}),
                specialNeeds: Boolean(formData.specialNeeds)
            };

            const updatedStudent = await updateStudent(studentId, updateData);
            
            if (updatedStudent) {
                showNotification('Studente aggiornato con successo', 'success');
                
                // Prima chiudiamo il form
                if (onCancel) {
                    onCancel();
                }
                
                // Poi aggiorniamo lo stato dello studente
                // Usiamo setTimeout per assicurarci che l'aggiornamento avvenga dopo la chiusura del form
                setTimeout(() => {
                    setStudent(updatedStudent);
                }, 0);
                
                setModified(false);
            }
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
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Annulla
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!modified || loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            >
                                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </form>
    );
};

export default StudentEditForm;