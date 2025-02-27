import React, { useState } from 'react';
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack
} from '@mui/material';
import { useUser } from '../../../context/UserContext';
import { 
    LockOpen as LockOpenIcon, 
    Lock as LockIcon 
} from '@mui/icons-material';

const UserInfo = ({ userData, onUpdate }) => {
    const { updateUser, changeUserStatus } = useUser();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role
    });
    const [error, setError] = useState(null);

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    // Separata la logica di editing e salvataggio
    const enableEditing = () => {
        setEditing(true);
        // Reset del form data ai valori correnti
        setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role
        });
    };

    const handleSave = async () => {
        try {
            console.log('Saving user data:', formData, 'userId:', userData._id);
            
            // Controllo dati prima dell'invio
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
                setError('Tutti i campi sono obbligatori');
                return;
            }
            
            await updateUser(userData._id, formData);

            onUpdate(); // Notifica aggiornamento al componente padre
            setEditing(false);
            setError(null);
        } catch (err) {
            console.error('Errore nel salvataggio dei dati:', err);
            setError(err.message || 'Errore durante l\'aggiornamento dell\'utente');
        }
    };

    const handleCancel = () => {
        // Ripristina i dati originali e annulla la modifica
        setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role
        });
        setEditing(false);
        setError(null);
    };

    // Funzione per riattivare un utente
    const handleReactivateUser = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Riattivazione utente con ID:', userData._id);
            await changeUserStatus(userData._id, 'active');
            
            // Notifica al componente padre di aggiornare i dati
            onUpdate();
        } catch (err) {
            console.error('Errore durante la riattivazione dell\'utente:', err);
            setError(err.message || 'Errore durante la riattivazione dell\'utente');
        } finally {
            setLoading(false);
        }
    };

    // Funzione per disattivare un utente
    const handleDeactivateUser = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Conferma prima di disattivare
            if (!window.confirm(`Sei sicuro di voler disattivare l'utente ${userData.firstName} ${userData.lastName}?`)) {
                setLoading(false);
                return;
            }
            
            console.log('Disattivazione utente con ID:', userData._id);
            await changeUserStatus(userData._id, 'inactive');
            
            // Notifica al componente padre di aggiornare i dati
            onUpdate();
        } catch (err) {
            console.error('Errore durante la disattivazione dell\'utente:', err);
            setError(err.message || 'Errore durante la disattivazione dell\'utente');
        } finally {
            setLoading(false);
        }
    };

    // Lista dei ruoli disponibili
    const validRoles = [
        { value: 'admin', label: 'Amministratore' },
        { value: 'developer', label: 'Sviluppatore' },
        { value: 'manager', label: 'Referente Scolastico' },
        { value: 'pcto', label: 'Responsabile PCTO' },
        { value: 'teacher', label: 'Insegnante' },
        { value: 'tutor', label: 'Tutor' },
        { value: 'researcher', label: 'Ricercatore' },
        { value: 'health', label: 'Professionista Sanitario' },
        { value: 'student', label: 'Studente' }
    ];

    // Determina quali pulsanti mostrare in base allo stato
    const showReactivateButton = userData.status === 'inactive';
    const showDeactivateButton = userData.status === 'active';

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Stato utente con pulsante di riattivazione/disattivazione */}
            <Box 
                sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Stack 
                    direction="row" 
                    spacing={2} 
                    alignItems="center" 
                    justifyContent="space-between"
                >
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                            Stato Utente
                        </Typography>
                        <Box
                            sx={{
                                display: 'inline-block',
                                px: 2,
                                py: 0.5,
                                borderRadius: 1,
                                mt: 1,
                                bgcolor: userData.status === 'active' ? 'success.light' :
                                        userData.status === 'inactive' ? 'warning.light' :
                                        'error.light',
                                color: userData.status === 'active' ? 'success.dark' :
                                        userData.status === 'inactive' ? 'warning.dark' :
                                        'error.dark'
                            }}
                        >
                            {userData.status === 'active' ? 'Attivo' :
                             userData.status === 'inactive' ? 'Inattivo' :
                             'Sospeso'}
                        </Box>
                    </Box>
                    
                    {showReactivateButton && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<LockOpenIcon />}
                            onClick={handleReactivateUser}
                            disabled={loading}
                        >
                            Riattiva Utente
                        </Button>
                    )}
                    
                    {showDeactivateButton && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LockIcon />}
                            onClick={handleDeactivateUser}
                            disabled={loading}
                        >
                            Disattiva Utente
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Rimuoviamo il form per evitare submitta automatica */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Nome"
                        value={editing ? formData.firstName : userData.firstName}
                        onChange={handleChange('firstName')}
                        disabled={!editing}
                        required
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Cognome"
                        value={editing ? formData.lastName : userData.lastName}
                        onChange={handleChange('lastName')}
                        disabled={!editing}
                        required
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Email"
                        value={editing ? formData.email : userData.email}
                        onChange={handleChange('email')}
                        disabled={!editing}
                        required
                        type="email"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth disabled={!editing}>
                        <InputLabel id="role-label">Ruolo</InputLabel>
                        <Select
                            labelId="role-label"
                            value={editing ? formData.role : userData.role}
                            onChange={handleChange('role')}
                            label="Ruolo"
                            required
                        >
                            {validRoles.map(role => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                        {editing ? (
                            <>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    sx={{ mr: 1 }}
                                >
                                    Salva
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancel}
                                >
                                    Annulla
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={enableEditing}
                            >
                                Modifica
                            </Button>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* Informazioni Aggiuntive */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Informazioni Aggiuntive
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Data Creazione
                        </Typography>
                        <Box>
                            {new Date(userData.createdAt).toLocaleDateString()}
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Ultimo Accesso
                        </Typography>
                        <Box>
                            {userData.lastLogin ? 
                                new Date(userData.lastLogin).toLocaleDateString() : 
                                'Mai'}
                        </Box>
                    </Grid>
                    {/* Sezione scuola */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Scuola Associata
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            {userData.schoolId ? (
                                <Chip 
                                    label={userData.schoolId.name || 'Scuola non trovata'}
                                    color="primary"
                                    size="small"
                                />
                            ) : (
                                <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    Nessuna scuola associata
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default UserInfo;