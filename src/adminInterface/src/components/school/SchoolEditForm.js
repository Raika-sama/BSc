// src/components/school/SchoolEditForm.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Box,
    Chip,
    FormHelperText,
    CircularProgress,
    Autocomplete
} from '@mui/material';
import { useSchool } from '../../context/SchoolContext';
import { useNotification } from '../../context/NotificationContext';

const SECTIONS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => ({ label: letter }));

const SchoolEditForm = ({ open, onClose, onSave, school }) => {
    const [formData, setFormData] = useState({
        name: '',
        schoolType: 'middle_school',
        institutionType: 'none',
        sections: [],
        numberOfYears: 3,
        region: '',
        province: '',
        address: '',
        isActive: true
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const { validateSchoolData } = useSchool();

    useEffect(() => {
        if (open && school) {
            setFormData({
                name: school.name || '',
                schoolType: school.schoolType || 'middle_school',
                institutionType: school.institutionType || 'none',
                sections: school.sections || [],
                numberOfYears: school.numberOfYears || 3,
                region: school.region || '',
                province: school.province || '',
                address: school.address || '',
                isActive: school.isActive ?? true
            });
            setErrors({});
        }
    }, [open, school]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            
            // Gestione automatica di institutionType e numberOfYears in base a schoolType
            if (name === 'schoolType') {
                newData.numberOfYears = value === 'middle_school' ? 3 : 5;
                if (value === 'middle_school') {
                    newData.institutionType = 'none';
                }
            }
            
            return newData;
        });
        
        // Pulizia errori quando l'utente modifica un campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Nome scuola richiesto';
        }

        if (!['middle_school', 'high_school'].includes(formData.schoolType)) {
            newErrors.schoolType = 'Tipo scuola non valido';
        }

        // Validazione institutionType in base a schoolType
        if (formData.schoolType === 'middle_school' && formData.institutionType !== 'none') {
            newErrors.institutionType = 'Le scuole medie non possono avere un tipo di istituto';
        }

        if (!formData.region?.trim()) {
            newErrors.region = 'Regione richiesta';
        }

        if (!formData.province?.trim()) {
            newErrors.province = 'Provincia richiesta';
        }

        if (!formData.address?.trim()) {
            newErrors.address = 'Indirizzo richiesto';
        }

        return Object.keys(newErrors).length > 0 ? newErrors : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            await onSave(formData);
            handleClose();
            showNotification('Scuola aggiornata con successo', 'success');
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'aggiornamento della scuola';
            showNotification(errorMessage, 'error');
            
            if (error.response?.data?.error?.errors) {
                setErrors(error.response.data.error.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            schoolType: 'middle_school',
            institutionType: 'none',
            sections: [],
            numberOfYears: 3,
            region: '',
            province: '',
            address: '',
            isActive: true
        });
        setErrors({});
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
                Modifica Scuola
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {loading && (
                        <Box display="flex" justifyContent="center" my={2}>
                            <CircularProgress />
                        </Box>
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome Scuola"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                disabled={loading}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errors.schoolType}>
                                <InputLabel>Tipo Scuola</InputLabel>
                                <Select
                                    name="schoolType"
                                    value={formData.schoolType}
                                    onChange={handleChange}
                                    label="Tipo Scuola"
                                    disabled={loading}
                                    required
                                >
                                    <MenuItem value="middle_school">Scuola Media</MenuItem>
                                    <MenuItem value="high_school">Scuola Superiore</MenuItem>
                                </Select>
                                {errors.schoolType && (
                                    <FormHelperText>{errors.schoolType}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl 
                                fullWidth 
                                error={!!errors.institutionType}
                                disabled={formData.schoolType === 'middle_school' || loading}
                            >
                                <InputLabel>Tipo Istituto</InputLabel>
                                <Select
                                    name="institutionType"
                                    value={formData.institutionType}
                                    onChange={handleChange}
                                    label="Tipo Istituto"
                                >
                                    <MenuItem value="none">Nessuno</MenuItem>
                                    <MenuItem value="scientific">Scientifico</MenuItem>
                                    <MenuItem value="classical">Classico</MenuItem>
                                    <MenuItem value="artistic">Artistico</MenuItem>
                                </Select>
                                {errors.institutionType && (
                                    <FormHelperText>{errors.institutionType}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Autocomplete
                                multiple
                                options={SECTIONS}
                                getOptionLabel={(option) => option.label}
                                value={formData.sections.map(section => ({ label: section }))}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        sections: newValue.map(v => v.label)
                                    }));
                                }}
                                renderTags={(tagValue, getTagProps) =>
                                    tagValue.map((option, index) => (
                                        <Chip
                                            label={option.label}
                                            {...getTagProps({ index })}
                                            size="small"
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Sezioni"
                                        error={!!errors.sections}
                                        helperText={errors.sections}
                                    />
                                )}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Regione"
                                name="region"
                                value={formData.region}
                                onChange={handleChange}
                                error={!!errors.region}
                                helperText={errors.region}
                                disabled={loading}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Provincia"
                                name="province"
                                value={formData.province}
                                onChange={handleChange}
                                error={!!errors.province}
                                helperText={errors.province}
                                disabled={loading}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Numero Anni"
                                name="numberOfYears"
                                type="number"
                                value={formData.numberOfYears}
                                onChange={handleChange}
                                error={!!errors.numberOfYears}
                                helperText={errors.numberOfYears}
                                disabled={true}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Indirizzo"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                error={!!errors.address}
                                helperText={errors.address}
                                disabled={loading}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Annulla
                    </Button>
                    <Button 
                        type="submit"
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        Aggiorna
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SchoolEditForm;