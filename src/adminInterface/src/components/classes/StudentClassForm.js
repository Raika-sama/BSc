import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';

const StudentClassForm = ({ open, onClose, classData }) => {
    const { createStudentWithClass } = useStudent();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
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

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'specialNeeds' ? checked : value
        }));
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.firstName) errors.push('Nome richiesto');
        if (!formData.lastName) errors.push('Cognome richiesto');
        if (!formData.gender) errors.push('Genere richiesto');
        if (!formData.dateOfBirth) errors.push('Data di nascita richiesta');
        if (!formData.email) errors.push('Email richiesta');
        
        if (formData.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
            errors.push('Formato email non valido');
        }

        if (formData.parentEmail && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.parentEmail)) {
            errors.push('Formato email genitore non valido');
        }

        if (formData.fiscalCode && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(formData.fiscalCode)) {
            errors.push('Formato codice fiscale non valido');
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
            console.log('ClassData ricevuto:', {
                _id: classData._id,
                schoolId: classData.schoolId?._id,
                mainTeacher: classData.mainTeacher?._id,
            });
            
            const studentData = {
                ...formData,
                schoolId: classData.schoolId._id,
                classId: classData._id,
                status: 'active',
                needsClassAssignment: false,
                isActive: true,
                mainTeacher: classData.mainTeacher?._id,
                teachers: classData.teachers?.map(t => t._id) || []
            };
    
            console.log('Dati studente da creare (dettagliato):', {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                schoolId: studentData.schoolId,
                classId: studentData.classId,
                mainTeacher: studentData.mainTeacher,
                status: studentData.status,
                needsClassAssignment: studentData.needsClassAssignment
            });
    
            // Salviamo la risposta in una variabile
            const response = await createStudentWithClass(studentData);
            console.log('Risposta creazione studente:', response);
    
            showNotification('Studente creato e assegnato con successo', 'success');
            handleClose();
        } catch (err) {
            console.error('Error creating student:', err);
            setError(err.response?.data?.message || err.message);
            showNotification('Errore nella creazione dello studente', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            firstName: '',
            lastName: '',
            fiscalCode: '',
            gender: '',
            dateOfBirth: '',
            email: '',
            parentEmail: '',
            specialNeeds: false
        });
        setError(null);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Nuovo Studente per la Classe {classData?.year}{classData?.section}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nome"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cognome"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Codice Fiscale"
                                name="fiscalCode"
                                value={formData.fiscalCode}
                                onChange={handleChange}
                                inputProps={{ style: { textTransform: 'uppercase' } }}
                                helperText="Opzionale"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
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

                        <Grid item xs={12} sm={6}>
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

                        <Grid item xs={12} sm={6}>
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

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email Genitore"
                                name="parentEmail"
                                type="email"
                                value={formData.parentEmail}
                                onChange={handleChange}
                                helperText="Opzionale"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
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
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>
                        Annulla
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        Aggiungi
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default StudentClassForm;