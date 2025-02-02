// src/components/users/details/UserInfo.jsx
import React, { useState } from 'react';
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    Alert
} from '@mui/material';
import { useUser } from '../../../context/UserContext';

const UserInfo = ({ userData, onUpdate }) => {
    const { updateUser } = useUser();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
    });
    const [error, setError] = useState(null);

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(userData._id, formData);
            onUpdate();
            setEditing(false);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nome"
                            value={editing ? formData.firstName : userData.firstName}
                            onChange={handleChange('firstName')}
                            disabled={!editing}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Cognome"
                            value={editing ? formData.lastName : userData.lastName}
                            onChange={handleChange('lastName')}
                            disabled={!editing}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Email"
                            value={editing ? formData.email : userData.email}
                            onChange={handleChange('email')}
                            disabled={!editing}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ mt: 2 }}>
                            {editing ? (
                                <>
                                    <Button
                                        variant="contained"
                                        type="submit"
                                        sx={{ mr: 1 }}
                                    >
                                        Salva
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({
                                                firstName: userData.firstName,
                                                lastName: userData.lastName,
                                                email: userData.email
                                            });
                                        }}
                                    >
                                        Annulla
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={() => setEditing(true)}
                                >
                                    Modifica
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </form>

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
                        <Typography>
                            {new Date(userData.createdAt).toLocaleDateString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Ultimo Accesso
                        </Typography>
                        <Typography>
                            {userData.lastLogin ? 
                                new Date(userData.lastLogin).toLocaleDateString() : 
                                'Mai'}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default UserInfo;