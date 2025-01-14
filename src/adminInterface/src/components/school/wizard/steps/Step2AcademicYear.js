import React, { useEffect } from 'react';
import {
    Grid,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box
} from '@mui/material';

const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 
        ? `${year}/${year + 1}`
        : `${year - 1}/${year}`;
};

const getAcademicYearOptions = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
    
    return [0, 1, 2].map(offset => {
        const year = startYear + offset;
        return {
            value: `${year}/${year + 1}`,
            label: `${year}/${year + 1}`
        };
    });
};

const Step2AcademicYear = ({ formData, onChange, errors = {} }) => {
    
    // Aggiungiamo useEffect per inizializzare il valore di default
    useEffect(() => {
        if (!formData.academicYear) {
            const defaultYear = getCurrentAcademicYear();
            handleChange(defaultYear);
        }
    }, []);  // Esegui solo al mount

    const handleChange = (value) => {
        const [startYear] = value.split('/');
        
        onChange({
            ...formData,
            academicYear: value,
            startDate: `${startYear}-09-01`,
            endDate: `${Number(startYear) + 1}-06-30`
        });
    };

    const currentValue = formData.academicYear || getCurrentAcademicYear();


    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Configurazione Anno Accademico
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.academicYear} required>
                    <InputLabel>Anno Accademico</InputLabel>
                    <Select
                        name="academicYear"
                        value={currentValue}
                        onChange={(e) => handleChange(e.target.value)}
                        label="Anno Accademico"
                    >
                        {getAcademicYearOptions().map((option) => (
                            <MenuItem 
                                key={option.value} 
                                value={option.value}
                            >
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.academicYear && (
                        <FormHelperText>{errors.academicYear}</FormHelperText>
                    )}
                </FormControl>
            </Grid>

            <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                        L'anno scolastico inizierà automaticamente il 1° Settembre e terminerà il 30 Giugno dell'anno successivo
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Step2AcademicYear;