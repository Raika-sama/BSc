// src/components/students/StudentForm.js

import React, { useState, useEffect } from 'react';
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
    Box
} from '@mui/material';
import { useStudent } from '../../context/StudentContext';
import { useSchool } from '../../context/SchoolContext';

const StudentForm = ({ open, onClose, student = null, schoolId = null }) => {
    const { createStudent, updateStudent } = useStudent();
    const { schools, fetchSchools } = useSchool();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fiscalCode: '',
        gender: '',
        dateOfBirth: '',
        email: '',
        schoolId: schoolId || '',
        currentYear: 1,
        parentEmail: ''
    });

    useEffect(() => {
        if (schools.length === 0) {
            fetchSchools();
        }
        
        if (student) {
            setFormData({
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                fiscalCode: student.fiscalCode || '',
                gender: student.gender || '',
                dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
                email: student.email || '',
                schoolId: student.schoolId?._id || student.schoolId || '',
                currentYear: student.currentYear || 1,
                parentEmail: student.parentEmail || ''
            });
        }
    }, [student, schools.length, fetchSchools]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.firstName) errors.push('Nome richiesto');
        if (!formData.lastName) errors.push('Cognome richiesto');
        if (!formData.gender) errors.push('Genere richiesto');
        if (!formData.dateOfBirth) errors.push('Data di nascita richiesta');
        if (!formData.email) errors.push('Email richiesta');
        if (!formData.schoolId) errors.push('Scuola richiesta');
        
            // Validazione codice fiscale solo se presente
        if (formData.fiscalCode && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(formData.fiscalCode)) {
            errors.push('Formato codice fiscale non valido');
        }
        
        if (formData.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
            errors.push('Formato email non valido');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Dati che sto per inviare:", formData);

        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (student) {
                await updateStudent(student.id, formData);
            } else {
                await createStudent(formData);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                {student ? 'Modifica Studente' : 'Nuovo Studente'}
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
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Anno</InputLabel>
                                <Select
                                    name="currentYear"
                                    value={formData.currentYear}
                                    onChange={handleChange}
                                    label="Anno"
                                >
                                    {[1, 2, 3, 4, 5].map(year => (
                                        <MenuItem key={year} value={year}>
                                            {year}° Anno
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
                                    disabled={!!schoolId}
                                >
                                    {schools.map(school => (
                                        <MenuItem key={school._id} value={school._id}>
                                            {school.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        Annulla
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {student ? 'Aggiorna' : 'Crea'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default StudentForm;