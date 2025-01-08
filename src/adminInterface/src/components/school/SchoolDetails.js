// src/components/school/SchoolDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Divider,
    Box,
    Chip,
    Button,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemSecondary,
    CircularProgress,
    Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolEditForm from './SchoolEditForm';
import UsersList from './schoolComponents/UsersList';
import { useSchool } from '../../context/SchoolContext';

const SchoolDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        selectedSchool,
        loading,
        error,
        getSchoolById,
        updateSchool,
        updateSchoolUser
    } = useSchool();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddUserMode, setIsAddUserMode] = useState(false);

    console.log('School Data:', {
        selectedSchool,
        users: selectedSchool?.users
    });

    useEffect(() => {
        getSchoolById(id);
    }, [id]);

    const handleUpdateSchool = async (updatedData) => {
        try {
            // Rimuovi eventuali campi undefined o null
            const cleanedData = Object.entries(updatedData)
                .reduce((acc, [key, value]) => {
                    if (value != null) {
                        acc[key] = value;
                    }
                    return acc;
                }, {});

            await updateSchool(id, cleanedData);
            await getSchoolById(id);
            setIsEditMode(false); // Chiudi il form dopo il successo
        } catch (error) {
            console.error('Error updating school:', error);
            // Qui potresti aggiungere una notifica di errore
        }
    };

    const handleRemoveUser = async (userId) => {
        if (!userId) {
            console.error('Missing userId');
            return;
        }

        try {
            await updateSchoolUser(id, userId, {
                action: 'remove'
            });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/schools')}
                    sx={{ mt: 2 }}
                >
                    Torna alla lista
                </Button>
            </Container>
        );
    }

    if (!selectedSchool) {
        return (
            <Box textAlign="center" py={4}>
                <Typography variant="h6">Scuola non trovata</Typography>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/schools')}
                    sx={{ mt: 2 }}
                >
                    Torna alla lista
                </Button>
            </Box>
        );
    }




    console.log('Selected School Users:', selectedSchool.users);
    return (
        <Container maxWidth="lg">
            <Box display="flex" alignItems="center" mb={3} gap={2}>
                <IconButton onClick={() => navigate('/admin/schools')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" flex={1}>
                    {selectedSchool.name}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditMode(true)}
                >
                    Modifica
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Informazioni Base */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informazioni Generali
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Tipo Scuola"
                                        secondary={selectedSchool.schoolType === 'middle_school' ? 
                                                 'Scuola Media' : 'Scuola Superiore'}
                                    />
                                </ListItem>
                                {selectedSchool.schoolType === 'high_school' && (
                                    <ListItem>
                                        <ListItemText 
                                            primary="Tipo Istituto"
                                            secondary={selectedSchool.institutionType}
                                        />
                                    </ListItem>
                                )}
                                <ListItem>
                                    <ListItemText 
                                        primary="Numero Anni"
                                        secondary={selectedSchool.numberOfYears}
                                    />
                                </ListItem>
                                <ListItem>
                                <ListItemText 
                                    primary="Sezioni"
                                    secondary={
                                        <Typography
                                            component="span"  // Cambiamo da p a span
                                            variant="body2"
                                        >
                                            <Box
                                                component="span"  // Anche questo da div a span
                                                sx={{ display: 'inline-flex', gap: 0.5, flexWrap: 'wrap' }}
                                            >
                                                {/* Chips qui */}
                                            </Box>
                                        </Typography>
                                    }
                                />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Informazioni Localizzazione */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Localizzazione
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Regione"
                                        secondary={selectedSchool.region}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Provincia"
                                        secondary={selectedSchool.province}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Indirizzo"
                                        secondary={selectedSchool.address}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Lista Utenti */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Utenti Associati
                                </Typography>
                                <Button
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setIsAddUserMode(true)}
                                >
                                    Aggiungi Utente
                                </Button>
                            </Box>
                            <UsersList
                                users={selectedSchool?.users || []} 
                                onRemoveUser={handleRemoveUser}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Form Modifica */}
            <SchoolEditForm
                open={isEditMode}
                onClose={() => setIsEditMode(false)}
                onSave={handleUpdateSchool}
                school={selectedSchool}
            />

            {/* TODO: Implementare AddUserForm */}
        </Container>
    );
};

export default SchoolDetails;