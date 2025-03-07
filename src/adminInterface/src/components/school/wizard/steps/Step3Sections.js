import React from 'react';
import {
    Grid,
    Typography,
    TextField,
    Divider,
    Box,
    Alert
} from '@mui/material';
import SectionManager from '../components/SectionManager';

const Step3Sections = ({ formData, onChange, errors }) => {
    const handleDefaultMaxStudentsChange = (value) => {
        // Aggiorna il valore di default
        onChange({
            defaultMaxStudentsPerClass: value,
            // Aggiorna anche i valori delle sezioni esistenti se non sono stati personalizzati
            sections: formData.sections.map(section => ({
                ...section,
                maxStudents: section.maxStudents === formData.defaultMaxStudentsPerClass ? value : section.maxStudents
            }))
        });
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Configurazione Sezioni
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Configura le sezioni della scuola e il numero massimo di studenti per classe.
                    Per le scuole medie il limite è 30 studenti, per le superiori 35.
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth
                    type="number"
                    label="Numero massimo studenti per classe (default)"
                    value={formData.defaultMaxStudentsPerClass}
                    onChange={(e) => handleDefaultMaxStudentsChange(parseInt(e.target.value))}
                    error={!!errors?.defaultMaxStudentsPerClass}
                    helperText={errors?.defaultMaxStudentsPerClass || 'Questo valore verrà usato come default per tutte le sezioni'}
                    InputProps={{
                        inputProps: { 
                            min: 15, 
                            max: formData.schoolType === 'middle_school' ? 30 : 35 
                        }
                    }}
                />
            </Grid>

            <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
                <SectionManager
                    sections={formData.sections}
                    onSectionsChange={(sections) => onChange({ sections })}
                    defaultMaxStudents={formData.defaultMaxStudentsPerClass}
                    schoolType={formData.schoolType}
                    errors={errors}
                />
            </Grid>

            <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                    <Alert severity="info">
                        Le sezioni possono avere un numero di studenti che si discosta dal valore di default,
                        ma deve rimanere entro il 50% in meno e il 20% in più.
                    </Alert>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Step3Sections;