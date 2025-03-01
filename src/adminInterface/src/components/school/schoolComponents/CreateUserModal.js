import React, { useState } from 'react';
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
    IconButton,
    Typography,
    Box,
    CircularProgress,
    Grid,
    FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSchool } from '../../../context/SchoolContext';

const CreateUserModal = ({ open, onClose, schoolId }) => {
    const { createAndAssociateUser } = useSchool();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'teacher',  // Ruolo globale nel sistema
        schoolRole: 'teacher'  // Ruolo nella scuola (teacher o admin)
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Resetta l'errore per questo campo
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Validazione lato client
            const validationErrors = {};
            if (!userData.firstName.trim()) validationErrors.firstName = 'Nome richiesto';
            if (!userData.lastName.trim()) validationErrors.lastName = 'Cognome richiesto';
            if (!userData.email.trim()) validationErrors.email = 'Email richiesta';
            if (!userData.password || userData.password.length < 8) {
                validationErrors.password = 'Password deve essere di almeno 8 caratteri';
            }

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }
            
            // Crea l'utente e associalo alla scuola
            await createAndAssociateUser(schoolId, userData);
            
            // Chiudi il modale e resetta il form
            handleClose();
            
        } catch (error) {
            console.error('Error creating user:', error);
            
            // Gestisci errori di validazione dal server
            if (error.response?.data?.error?.errors) {
                setErrors(error.response.data.error.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setUserData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'teacher',
            schoolRole: 'teacher'
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Crea Nuovo Utente</Typography>
                    <IconButton onClick={handleClose} size="small" disabled={loading}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Nome"
                            name="firstName"
                            value={userData.firstName}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            disabled={loading}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Cognome"
                            name="lastName"
                            value={userData.lastName}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            disabled={loading}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            error={!!errors.email}
                            helperText={errors.email}
                            disabled={loading}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Password"
                            name="password"
                            type="password"
                            value={userData.password}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            error={!!errors.password}
                            helperText={errors.password || "Minimo 8 caratteri"}
                            disabled={loading}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" error={!!errors.role}>
                            <InputLabel id="role-label">Ruolo nel Sistema</InputLabel>
                            <Select
                                labelId="role-label"
                                name="role"
                                value={userData.role}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <MenuItem value="teacher">Insegnante</MenuItem>
                                <MenuItem value="tutor">Tutor</MenuItem>
                                <MenuItem value="pcto">PCTO</MenuItem>
                                <MenuItem value="researcher">Ricercatore</MenuItem>
                            </Select>
                            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" error={!!errors.schoolRole}>
                            <InputLabel id="school-role-label">Ruolo nella Scuola</InputLabel>
                            <Select
                                labelId="school-role-label"
                                name="schoolRole"
                                value={userData.schoolRole}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <MenuItem value="teacher">Insegnante</MenuItem>
                                <MenuItem value="admin">Amministratore</MenuItem>
                            </Select>
                            {errors.schoolRole && <FormHelperText>{errors.schoolRole}</FormHelperText>}
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {loading ? 'Creazione in corso...' : 'Crea Utente'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateUserModal;