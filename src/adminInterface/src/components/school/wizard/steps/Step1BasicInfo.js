import React, { useState } from 'react';
import {
    Grid,
    Typography,
    TextField,
    MenuItem,
    Alert,
    Box,
    Collapse,
    FormHelperText
} from '@mui/material';
import { REGIONS, PROVINCES } from '../utils/italianGeoData';

const SCHOOL_TYPES = [
    { value: 'middle_school', label: 'Scuola Media' },
    { value: 'high_school', label: 'Scuola Superiore' }
];

const INSTITUTION_TYPES = [
    { value: 'scientific', label: 'Scientifico' },
    { value: 'classical', label: 'Classico' },
    { value: 'artistic', label: 'Artistico' },
    { value: 'none', label: 'Nessuno' }
];

const Step1BasicInfo = ({ formData, onChange, errors }) => {
    const [showProvinceWarning, setShowProvinceWarning] = useState(false);

    const handleRegionChange = (value) => {
        onChange({
            region: value,
            // Reset provincia quando cambia regione
            province: ''
        });
        setShowProvinceWarning(false);
    };

    const handleSchoolTypeChange = (event) => {
        const newSchoolType = event.target.value;
        onChange({
            schoolType: newSchoolType,
            // Se è scuola media, imposta automaticamente 'none'
            institutionType: newSchoolType === 'middle_school' ? 'none' : formData.institutionType
        });
    };

    const getAvailableProvinces = () => {
        return PROVINCES[formData.region] || [];
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Informazioni Base
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Inserisci le informazioni di base della scuola. Questi dati saranno
                    utilizzati per identificare e configurare la scuola nel sistema.
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Nome Scuola"
                    value={formData.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    error={!!errors?.name}
                    helperText={errors?.name}
                    placeholder="es. Istituto Comprensivo Leonardo da Vinci"
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    fullWidth
                    label="Tipo Scuola"
                    value={formData.schoolType}
                    onChange={handleSchoolTypeChange}
                    error={!!errors?.schoolType}
                    helperText={
                        errors?.schoolType || 
                        'Questo valore non potrà essere modificato in seguito'
                    }
                >
                    {SCHOOL_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                            {type.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    fullWidth
                    label="Tipo Istituto"
                    value={formData.institutionType}
                    onChange={(e) => onChange({ institutionType: e.target.value })}
                    error={!!errors?.institutionType}
                    helperText={
                        errors?.institutionType ||
                        (formData.schoolType === 'middle_school' 
                            ? 'Le scuole medie non hanno un tipo di istituto specifico'
                            : 'Seleziona il tipo di istituto superiore')
                    }
                    disabled={formData.schoolType === 'middle_school'}
                >
                    {INSTITUTION_TYPES.filter(type => 
                        formData.schoolType === 'high_school' || type.value === 'none'
                    ).map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                            {type.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    fullWidth
                    label="Regione"
                    value={formData.region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    error={!!errors?.region}
                    helperText={errors?.region}
                >
                    {REGIONS.map((region) => (
                        <MenuItem key={region} value={region}>
                            {region}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    fullWidth
                    label="Provincia"
                    value={formData.province}
                    onChange={(e) => {
                        onChange({ province: e.target.value });
                        setShowProvinceWarning(false);
                    }}
                    error={!!errors?.province}
                    helperText={errors?.province}
                    disabled={!formData.region}
                >
                    {getAvailableProvinces().map((province) => (
                        <MenuItem key={province} value={province}>
                            {province}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Indirizzo"
                    value={formData.address}
                    onChange={(e) => onChange({ address: e.target.value })}
                    error={!!errors?.address}
                    helperText={errors?.address}
                    placeholder="es. Via Roma 1, 00100"
                />
            </Grid>

            <Grid item xs={12}>
                <Collapse in={showProvinceWarning}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Assicurati che l'indirizzo sia nella provincia selezionata
                    </Alert>
                </Collapse>

                <Alert severity="info">
                    I dati relativi al tipo di scuola e al tipo di istituto non potranno essere
                    modificati dopo la creazione. Verifica attentamente prima di procedere.
                </Alert>
            </Grid>
        </Grid>
    );
};

export default Step1BasicInfo;