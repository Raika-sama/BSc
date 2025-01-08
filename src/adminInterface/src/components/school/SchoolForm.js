// src/components/school/SchoolForm.js
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
    Typography,
    CircularProgress,
    Autocomplete,
    Chip,
    FormHelperText
} from '@mui/material';
import PropTypes from 'prop-types';
import { useSchool } from '../../context/SchoolContext';
import { useNotification } from '../../context/NotificationContext';

const INITIAL_FORM_STATE = {
    name: '',
    schoolType: 'middle_school',
    institutionType: 'none',
    sections: [],
    numberOfYears: 3,
    region: '',
    province: '',
    address: '',
    isActive: true
};

const SECTIONS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => ({ label: letter }));

const SchoolForm = ({ open, onClose, onSubmit }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const { showNotification } = useNotification();
    const { validateSchoolData } = useSchool();

    useEffect(() => {
        if (open) {
            setFormData(INITIAL_FORM_STATE);
            setErrors({});
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            
            if (name === 'schoolType') {
                newData.numberOfYears = value === 'middle_school' ? 3 : 5;
                if (value === 'middle_school') {
                    newData.institutionType = 'none';
                }
            }
            
            return newData;
        });
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateSchoolData(formData);
        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            await onSubmit(formData);
            handleClose();
            showNotification('Scuola creata con successo', 'success');
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nella creazione della scuola';
            showNotification(errorMessage, 'error');
            
            if (error.response?.data?.error?.errors) {
                setErrors(error.response.data.error.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(INITIAL_FORM_STATE);
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
                Aggiungi Nuova Scuola
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
                                value={(formData.sections || []).map(section => ({ label: section }))}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        sections: newValue.map(v => v.label)
                                    }));
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            key={index}
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
                        Crea
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

SchoolForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default SchoolForm;0