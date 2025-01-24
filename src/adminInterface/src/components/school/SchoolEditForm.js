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
    Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { useNotification } from '../../context/NotificationContext';

const SchoolEditForm = ({ open, onClose, onSave, school }) => {
    const navigate = useNavigate();
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
            console.log('### SchoolEditForm - Dati iniziali:', school);
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
        console.log('### SchoolEditForm - Campo modificato:', { name, value });
        
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            
            if (name === 'schoolType') {
                if (value === 'middle_school') {
                    newData.institutionType = 'none';
                    newData.numberOfYears = 3;
                } else {
                    newData.numberOfYears = 5;
                    if (!['scientific', 'classical', 'artistic', 'none'].includes(newData.institutionType)) {
                        newData.institutionType = 'none';
                    }
                }
            }
            
            return newData;
        });
        
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
    
        if (formData.schoolType === 'middle_school') {
            if (formData.institutionType !== 'none') {
                newErrors.institutionType = 'Le scuole medie devono avere tipo istituto impostato come "nessuno"';
            }
            if (formData.numberOfYears !== 3) {
                newErrors.numberOfYears = 'Le scuole medie devono avere 3 anni';
            }
        } else if (formData.schoolType === 'high_school') {
            if (!['scientific', 'classical', 'artistic', 'none'].includes(formData.institutionType)) {
                newErrors.institutionType = 'Tipo istituto non valido per scuola superiore';
            }
            if (formData.numberOfYears !== 5) {
                newErrors.numberOfYears = 'Le scuole superiori devono avere 5 anni';
            }
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
            const dataToSend = { ...formData };
            
            if (dataToSend.schoolType === 'middle_school') {
                dataToSend.institutionType = 'none';
                dataToSend.numberOfYears = 3;
            } else {
                dataToSend.numberOfYears = 5;
            }
            console.log('### SchoolEditForm - Dati prima del submit:', dataToSend);
            await onSave(dataToSend);
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

    const handleManageSections = () => {
        console.log('### SchoolEditForm - Navigazione alla gestione sezioni');
        navigate(`/admin/schools/${school._id}/sections-management`);
        handleClose();
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
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Sezioni
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {formData.sections.map((section) => (
                                        <Chip
                                            key={section._id || section.name}
                                            label={`${section.name} (${section.maxStudents || 'N/D'} studenti)`}
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Button
                                variant="outlined"
                                onClick={handleManageSections}
                                fullWidth
                            >
                                Gestione Sezioni
                            </Button>
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