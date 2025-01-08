// src/adminInterface/src/components/classes/components/ClassForm.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';

const ClassForm = ({ open, onClose, initialValues, onSubmit }) => {
    const [formData, setFormData] = React.useState(initialValues || {
        year: '',
        section: '',
        academicYear: '',
        mainTeacher: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {initialValues ? 'Modifica Classe' : 'Nuova Classe'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Anno"
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleChange}
                                inputProps={{ min: 1, max: 5 }}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Sezione"
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                inputProps={{ 
                                    maxLength: 1,
                                    style: { textTransform: 'uppercase' }
                                }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Anno Accademico"
                                name="academicYear"
                                value={formData.academicYear}
                                onChange={handleChange}
                                placeholder="2024/2025"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Insegnante Principale</InputLabel>
                                <Select
                                    name="mainTeacher"
                                    value={formData.mainTeacher}
                                    onChange={handleChange}
                                    required
                                >
                                    {/* TODO: Populate with actual teachers */}
                                    <MenuItem value="">Seleziona un insegnante</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Annulla</Button>
                    <Button type="submit" variant="contained" color="primary">
                        {initialValues ? 'Salva Modifiche' : 'Crea Classe'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ClassForm;