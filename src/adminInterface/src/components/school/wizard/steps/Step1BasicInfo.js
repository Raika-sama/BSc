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
import { italianRegions, provincesData } from '../../../../utils/italianGeoData';  

const Step1BasicInfo = ({ formData, onChange, errors = {} }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        const updates = { [name]: value };

            // Reset provincia quando cambia regione
            if (name === 'region') {
                updates.province = '';
            }

        onChange({
            ...formData,
            ...updates,
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
                <FormControl 
                    fullWidth 
                    error={!!errors.region}
                    required
                >
                    <InputLabel>Regione</InputLabel>
                    <Select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        label="Regione"
                    >
                        {italianRegions.map((region) => (
                            <MenuItem key={region} value={region}>
                                {region}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.region && (
                        <FormHelperText>{errors.region}</FormHelperText>
                    )}
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
                <FormControl 
                    fullWidth 
                    error={!!errors.province}
                    required
                    disabled={!formData.region}
                >
                    <InputLabel>Provincia</InputLabel>
                    <Select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        label="Provincia"
                    >
                        {formData.region && provincesData[formData.region]?.map((province) => (
                            <MenuItem key={province} value={province}>
                                {province}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.province && (
                        <FormHelperText>{errors.province}</FormHelperText>
                    )}
                </FormControl>
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