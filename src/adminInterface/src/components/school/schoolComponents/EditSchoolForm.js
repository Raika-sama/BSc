// src/components/school/EditSchoolForm.js
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Grid,
    Paper,
    Typography,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useSchool } from '../../../context/SchoolContext';

const EditSchoolForm = ({ school, onCancel }) => {
    const { updateSchool, loading } = useSchool();
    const [formData, setFormData] = useState({
        name: school.name || '',
        address: school.address || '',
        region: school.region || '',
        province: school.province || ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome scuola richiesto';
        if (!formData.address.trim()) newErrors.address = 'Indirizzo richiesto';
        if (!formData.region.trim()) newErrors.region = 'Regione richiesta';
        if (!formData.province.trim()) newErrors.province = 'Provincia richiesta';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        try {
            // Manteniamo intatti i campi critici che non stiamo modificando
            await updateSchool(school._id, {
                ...formData,
                schoolType: school.schoolType,
                institutionType: school.institutionType
            });
            
            onCancel(); // Torniamo alla visualizzazione
        } catch (error) {
            console.error('Error updating school:', error);
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
                Modifica Informazioni Scuola
            </Typography>
            
            <form onSubmit={handleSubmit}>
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
                            required
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
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Regione"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            error={!!errors.region}
                            helperText={errors.region}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Provincia"
                            name="province"
                            value={formData.province}
                            onChange={handleChange}
                            error={!!errors.province}
                            helperText={errors.province}
                            required
                        />
                    </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<CancelIcon />}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Annulla
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={loading}
                    >
                        {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
};

export default EditSchoolForm;