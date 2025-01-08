// src/components/UserForm.js
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
    CircularProgress,
    Box 
} from '@mui/material';
import { useUser } from '../../context/UserContext';

const INITIAL_FORM_STATE = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'teacher'
};

const UserForm = ({ open, onClose, onSave, initialData, isLoading }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const { validateUserData } = useUser();

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    firstName: initialData.firstName || '',
                    lastName: initialData.lastName || '',
                    email: initialData.email || '',
                    role: initialData.role || 'teacher',
                    password: '' // Password vuota in modalità modifica
                });
            } else {
                setFormData(INITIAL_FORM_STATE);
            }
            setErrors({});
        }
    }, [open, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Pulisci l'errore quando l'utente modifica il campo
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validazione usando la funzione del context
        const validationErrors = validateUserData(formData, !initialData);
        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }

        try {
            // Se in modalità modifica e la password è vuota, la rimuoviamo
            const dataToSubmit = { ...formData };
            if (initialData && !dataToSubmit.password) {
                delete dataToSubmit.password;
            }

            await onSave(dataToSubmit);
            handleClose();
        } catch (error) {
            console.error('Form submission error:', error);
            const serverErrors = error.response?.data?.error?.errors || {};
            setErrors(serverErrors);
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
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle>
                {initialData ? 'Modifica Utente' : 'Nuovo Utente'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {isLoading && (
                        <Box display="flex" justifyContent="center" my={2}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Nome"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        disabled={isLoading}
                        required
                        autoFocus
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Cognome"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        disabled={isLoading}
                        required
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={isLoading}
                        required
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password || (initialData ? 'Lascia vuoto per mantenere la password attuale' : 'Minimo 8 caratteri')}
                        disabled={isLoading}
                        required={!initialData}
                    />

                    <FormControl 
                        fullWidth 
                        margin="normal"
                        error={!!errors.role}
                        disabled={isLoading}
                    >
                        <InputLabel id="role-label">Ruolo</InputLabel>
                        <Select
                            labelId="role-label"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            label="Ruolo"
                            required
                        >
                            <MenuItem value="teacher">Insegnante</MenuItem>
                            <MenuItem value="admin">Amministratore</MenuItem>
                        </Select>
                        {errors.role && (
                            <FormHelperText>{errors.role}</FormHelperText>
                        )}
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button 
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Annulla
                    </Button>
                    <Button 
                        type="submit"
                        variant="contained" 
                        color="primary"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    >
                        {initialData ? 'Aggiorna' : 'Crea'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default UserForm;