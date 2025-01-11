// src/adminInterface/src/components/school/wizard/steps/Step1BasicInfo.js
import React from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText
} from '@mui/material';

const Step1BasicInfo = ({ formData, onChange, errors = {} }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({
            ...formData,
            [name]: value,
            // Reset institutionType when switching to middle school
            ...(name === 'schoolType' && value === 'middle_school' 
                ? { institutionType: 'none' } 
                : {})
        });
    };

    return (
        <Grid container spacing={3}>
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

            <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.schoolType} required>
                    <InputLabel>Tipo Scuola</InputLabel>
                    <Select
                        name="schoolType"
                        value={formData.schoolType}
                        onChange={handleChange}
                        label="Tipo Scuola"
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
                    disabled={formData.schoolType === 'middle_school'}
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

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
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
        </Grid>
    );
};

export default Step1BasicInfo;