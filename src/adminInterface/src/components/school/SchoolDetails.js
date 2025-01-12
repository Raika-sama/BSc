import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Box,
    Chip,
    Button,
    IconButton,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import CloseIcon from '@mui/icons-material/Close';
import SchoolEditForm from './SchoolEditForm';
import UsersDialog from './schoolComponents/UserDialog';
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

    // States
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddUserMode, setIsAddUserMode] = useState(false);
    const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);

    useEffect(() => {
        getSchoolById(id);
    }, [id]);

    const handleUpdateSchool = async (updatedData) => {
        try {
            await updateSchool(id, updatedData);
            await getSchoolById(id);
            setIsEditMode(false);
        } catch (error) {
            console.error('Error updating school:', error);
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

    return (
        <Container maxWidth="lg">
            {/* Header con bottoni */}
            <Box display="flex" alignItems="center" mb={3} gap={2}>
                <IconButton onClick={() => navigate('/admin/schools')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" flex={1}>
                    {selectedSchool.name}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => setIsUsersDialogOpen(true)}
                    sx={{ mr: 1 }}
                >
                    Lista Utenti
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ManageAccountsIcon />}
                    onClick={() => navigate(`/admin/schools/${id}/users-management`)}
                    sx={{ mr: 1 }}
                >
                    Gestione Utenze
                </Button>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditMode(true)}
                >
                    Modifica
                </Button>
            </Box>

            {/* Contenuto principale */}
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
                                        primary="Sezioni"
                                        secondary={
                                            <Typography component="span" variant="body2">
                                                <Box
                                                    component="span"
                                                    sx={{ display: 'inline-flex', gap: 0.5, flexWrap: 'wrap' }}
                                                >
                                                    {selectedSchool.sections.map((section) => (
                                                        <Chip
                                                            key={section._id || section.name}
                                                            label={`${section.name} (${section.maxStudents || 'N/D'} studenti)`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Box>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText 
                                        primary="Indirizzo"
                                        secondary={selectedSchool.address}
                                    />
                                </ListItem>
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
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Anno Accademico Corrente */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Anno Accademico
                            </Typography>
                            {selectedSchool.academicYears && selectedSchool.academicYears.length > 0 ? (
                                <List>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Anno"
                                            secondary={selectedSchool.academicYears[0].year}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Stato"
                                            secondary={
                                                <Chip
                                                    label={selectedSchool.academicYears[0].status}
                                                    size="small"
                                                    color={selectedSchool.academicYears[0].status === 'active' ? 'success' : 'default'}
                                                />
                                            }
                                        />
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography color="textSecondary">
                                    Nessun anno accademico configurato
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog per la lista utenti */}
            <Dialog 
                open={isUsersDialogOpen}
                onClose={() => setIsUsersDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Utenti della Scuola</Typography>
                        <IconButton onClick={() => setIsUsersDialogOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <UsersDialog 
                        manager={selectedSchool?.manager}
                        users={selectedSchool?.users || []}
                    />
                </DialogContent>
            </Dialog>

            {/* Form Modifica */}
            <SchoolEditForm
                open={isEditMode}
                onClose={() => setIsEditMode(false)}
                onSave={handleUpdateSchool}
                school={selectedSchool}
            />
        </Container>
    );
};

export default SchoolDetails;