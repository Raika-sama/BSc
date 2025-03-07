import React, { useEffect } from 'react';
import {
    Grid,
    Typography,
    TextField,
    Alert,
    Box,
    Chip
} from '@mui/material';

const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 
        ? `${year}/${year + 1}`
        : `${year - 1}/${year}`;
};

const getDefaultDates = (academicYear) => {
    if (!academicYear) return { startDate: '', endDate: '' };
    
    const [startYear] = academicYear.split('/');
    return {
        startDate: `${startYear}-09-01`,
        endDate: `${parseInt(startYear) + 1}-06-30`
    };
};

const Step2AcademicYear = ({ formData, onChange, errors }) => {
    useEffect(() => {
        // Se non c'è un anno impostato, suggerisci quello corrente
        if (!formData.academicYear) {
            const suggestedYear = getCurrentAcademicYear();
            const { startDate, endDate } = getDefaultDates(suggestedYear);
            onChange({
                academicYear: suggestedYear,
                startDate,
                endDate
            });
        }
    }, []);

    const handleYearChange = (value) => {
        if (/^\d{4}\/\d{4}$/.test(value)) {
            const { startDate, endDate } = getDefaultDates(value);
            onChange({
                academicYear: value,
                startDate,
                endDate
            });
        } else {
            onChange({ academicYear: value });
        }
    };

    const formatDatePreview = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Configurazione Anno Accademico
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Configura l'anno accademico iniziale della scuola.
                    L'anno scolastico inizia tipicamente a settembre e termina a giugno dell'anno successivo.
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Anno Accademico"
                    value={formData.academicYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    error={!!errors?.academicYear}
                    helperText={errors?.academicYear || "Formato: YYYY/YYYY (es. 2024/2025)"}
                    placeholder="2024/2025"
                />
                {formData.academicYear === getCurrentAcademicYear() && (
                    <Box sx={{ mt: 1 }}>
                        <Chip 
                            label="Anno corrente" 
                            color="primary" 
                            size="small" 
                            variant="outlined"
                        />
                    </Box>
                )}
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Data Inizio"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => onChange({ startDate: e.target.value })}
                    error={!!errors?.startDate}
                    helperText={errors?.startDate}
                    InputLabelProps={{ shrink: true }}
                />
                {formData.startDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatDatePreview(formData.startDate)}
                    </Typography>
                )}
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Data Fine"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => onChange({ endDate: e.target.value })}
                    error={!!errors?.endDate}
                    helperText={errors?.endDate}
                    InputLabelProps={{ shrink: true }}
                />
                {formData.endDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatDatePreview(formData.endDate)}
                    </Typography>
                )}
            </Grid>

            <Grid item xs={12}>
                <Alert severity="info">
                    L'anno scolastico inizia tipicamente il 1° settembre e termina il 30 giugno dell'anno successivo.
                    Le date suggerite sono state preimpostate automaticamente in base all'anno accademico selezionato.
                </Alert>
            </Grid>
        </Grid>
    );
};

export default Step2AcademicYear;