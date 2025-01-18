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
    Box,
    FormControlLabel,
    Switch
} from '@mui/material';
import { useStudent } from '../../context/StudentContext';
import { useSchool } from '../../context/SchoolContext';
import { useUser } from '../../context/UserContext';

const StudentForm = ({ open, onClose, student, onSubmit }) => {
    const { createStudent, updateStudent } = useStudent();
    const { schools, fetchSchools, selectedSchool } = useSchool();
    const { users, getUsers } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        fiscalCode: '',
        gender: '',
        dateOfBirth: '',
        email: '',
        schoolId: selectedSchool?._id || '',  // Qui usiamo selectedSchool
        currentYear: 1,
        parentEmail: '',
        mainTeacher: '',
        teachers: [],
        specialNeeds: false,
        status: 'pending',
        needsClassAssignment: true,
        isActive: true
    });

    // Add form open tracking
    useEffect(() => {
        console.log('Form opened, initial values:', formData);
    }, [open]);

    useEffect(() => {
        if (schools.length === 0) {
            fetchSchools();
        }
        if (users.length === 0) {
            getUsers();
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
                parentEmail: student.parentEmail || '',
                mainTeacher: student.mainTeacher?._id || '',
                teachers: student.teachers?.map(t => t._id) || [],
                specialNeeds: student.specialNeeds || false,
                status: student.status || 'pending',
                needsClassAssignment: student.needsClassAssignment ?? true,
                isActive: student.isActive ?? true
            });
        }
    }, [student, schools.length, users.length, fetchSchools, getUsers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'specialNeeds') {
            setFormData(prev => ({
                ...prev,
                specialNeeds: e.target.checked
            }));
        }
        else if (name === 'teachers') {
            setFormData(prev => ({
                ...prev,
                teachers: Array.isArray(value) ? value : []
            }));
        }
        else if (name === 'mainTeacher') {  // Aggiungi questo case
            setFormData(prev => ({
                ...prev,
                mainTeacher: value || null  // Gestisce il caso "Nessuno"
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
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
        
        // Validazione codice fiscale solo se presente
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
        console.log('Submit clicked, current formData:', formData);

        const formattedData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            gender: formData.gender,
            dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
            email: formData.email.trim(),
            parentEmail: formData.parentEmail.trim() || null,
            fiscalCode: formData.fiscalCode.trim().toUpperCase() || null,
            schoolId: formData.schoolId,
            currentYear: parseInt(formData.currentYear),
            mainTeacher: formData.mainTeacher || null,
            teachers: Array.isArray(formData.teachers) ? formData.teachers : [],
            specialNeeds: formData.specialNeeds,
            status: 'pending',
            needsClassAssignment: true,
            isActive: true
        };
    
        console.log("Dati formattati da inviare:", formattedData);
    
        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }
    
        setLoading(true);
        setError(null);
    
        try {
            if (student) {
                await updateStudent(student.id, formattedData);
            } else {
                await createStudent(formattedData);
            }
            onClose();
        } catch (err) {
            console.error('Error details:', err);
            setError(err.response?.data?.message || err.message);
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
            schoolId: selectedSchool?._id || '',  // Qui usiamo selectedSchool
            currentYear: 1,
            parentEmail: '',
            mainTeacher: '',
            teachers: [],
            specialNeeds: false,
            status: 'pending',
            needsClassAssignment: true,
            isActive: true
        });
        setError(null);
        onClose();
    };
    return (
        <Dialog 
            open={open} 
            onClose={handleClose}  // Qui
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

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Docente Principale</InputLabel>
                                <Select
                                    name="mainTeacher"
                                    value={formData.mainTeacher || ''}  // Corretto
                                    onChange={handleChange} // Corretto
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

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Docenti</InputLabel>
                                <Select
                                    multiple
                                    name="teachers"
                                    value={Array.isArray(formData.teachers) ? formData.teachers : []}
                                    onChange={handleChange}
                                    label="Docenti"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const user = users.find(u => u._id === value);
                                                return user ? `${user.firstName} ${user.lastName}` : '';
                                            })}
                                        </Box>
                                    )}
                                >
                                    <MenuItem value="clear" onClick={() => handleChange({
                                        target: {
                                            name: 'teachers',
                                            value: []
                                        }
                                    })}>
                                        Nessuno
                                    </MenuItem>
                                    {users.map(user => (
                                        <MenuItem key={user._id} value={user._id}>
                                            {`${user.firstName} ${user.lastName}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.specialNeeds}
                                        onChange={(e) => handleChange({
                                            target: {
                                                name: 'specialNeeds',
                                                value: e.target.checked
                                            }
                                        })}
                                        name="specialNeeds"
                                    />
                                }
                                label="Necessità Speciali"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Scuola</InputLabel>
                                <Select
                                    name="schoolId"
                                    value={formData.schoolId}
                                    onChange={handleChange}
                                    label="Scuola"
                                    disabled={!!selectedSchool?._id}  // Usa selectedSchool._id invece di schoolId
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
                    <Button onClick={handleClose}> 
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