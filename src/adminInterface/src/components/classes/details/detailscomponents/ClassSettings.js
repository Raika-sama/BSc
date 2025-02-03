// src/components/classes/details/detailscomponents/ClassSettings.js
import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Divider,
    Switch,
    FormControlLabel,
    Grid
} from '@mui/material';
import { useClass } from '../../../../context/ClassContext';
import { useNotification } from '../../../../context/NotificationContext';

const ClassSettings = ({ classData, onUpdate }) => {
    const { updateClass } = useClass();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        year: classData.year,
        section: classData.section,
        capacity: classData.capacity,
        academicYear: classData.academicYear,
        status: classData.status,
        isActive: classData.isActive
    });

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'isActive' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await updateClass(classData._id, formData);
            showNotification('Impostazioni classe aggiornate con successo', 'success');
            onUpdate(); // Aggiorna i dati della classe
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante l\'aggiornamento delle impostazioni');
            showNotification('Errore durante l\'aggiornamento delle impostazioni', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Impostazioni Classe
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Anno"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Sezione"
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Anno Accademico"
                                name="academicYear"
                                value={formData.academicYear}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Capacità"
                                name="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Stato</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Stato"
                                >
                                    <MenuItem value="planned">Pianificata</MenuItem>
                                    <MenuItem value="active">Attiva</MenuItem>
                                    <MenuItem value="completed">Completata</MenuItem>
                                    <MenuItem value="archived">Archiviata</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        name="isActive"
                                    />
                                }
                                label="Classe Attiva"
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setFormData({
                                year: classData.year,
                                section: classData.section,
                                capacity: classData.capacity,
                                academicYear: classData.academicYear,
                                status: classData.status,
                                isActive: classData.isActive
                            })}
                            disabled={loading}
                        >
                            Ripristina
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading && <CircularProgress size={20} />}
                        >
                            Salva Modifiche
                        </Button>
                    </Box>
                </form>
            </Paper>

            <Paper 
                elevation={0}
                sx={{ 
                    mt: 3, 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'error.light',
                    borderRadius: 2
                }}
            >
                <Typography variant="h6" color="error" gutterBottom>
                    Zona Pericolosa
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Le azioni in questa sezione sono irreversibili.
                </Typography>
                <Button 
                    variant="outlined" 
                    color="error"
                    disabled={classData.students?.length > 0}
                >
                    Elimina Classe
                </Button>
            </Paper>
        </Box>
    );
};

export default ClassSettings;