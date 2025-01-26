import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    Box,
    Chip,
    Button,
    IconButton,
    Card,
    CardContent,
    ListItemAvatar,  // Aggiunto
    Avatar,          // Aggiunto
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Tabs, Tab } from '@mui/material';  // Aggiungi questo import
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonIcon from '@mui/icons-material/Person';    // Aggiunto
import StarIcon from '@mui/icons-material/Star';        // Aggiunto
import CloseIcon from '@mui/icons-material/Close';
import SchoolEditForm from './SchoolEditForm';
import SchoolUsersManagement from './schoolComponents/SchoolUsersManagement';
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
    const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('mainTeacher');  // Nuovo stato per i tabs

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

    const handleAddUser = async (userData) => {
        try {
            await updateSchoolUser(id, userData.email, {
                action: 'add',
                role: userData.role
            });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    const handleRemoveUser = async (userId) => {
        try {
            await updateSchoolUser(id, userId, {
                action: 'remove'
            });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    };

    const handleChangeManager = async (newManagerId) => {
        try {
            await updateSchool(id, { manager: newManagerId });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error changing manager:', error);
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
                    startIcon={<ListAltIcon />}
                    onClick={() => navigate(`/admin/schools/${id}/sections-management`)}
                    sx={{ mr: 1 }}
                >
                    Gestione Sezioni
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
                                            selectedSchool.sections.length > 0 ? 
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                                    {selectedSchool.sections.map((section) => (
                                                        <Chip
                                                            key={section.name}
                                                            label={`${section.name} (${section.maxStudents || 'N/D'} studenti)`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Box>
                                                : 'Nessuna sezione configurata'
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
                                                selectedSchool.academicYears[0].status === 'active' ? 
                                                    'Attivo' : 'Non attivo'
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
            {/* Nuova sezione Utenti con Tabs */}
            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Utenti della Scuola
                                        </Typography>
                                        <Tabs
                                            value={activeTab}
                                            onChange={(e, newValue) => setActiveTab(newValue)}
                                            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                                        >
                                            <Tab 
                                                label="Manager" 
                                                value="mainTeacher"
                                                sx={{ textTransform: 'none' }}
                                            />
                                            <Tab 
                                                label="Insegnanti" 
                                                value="teachers"
                                                sx={{ textTransform: 'none' }}
                                            />
                                        </Tabs>

                                        {activeTab === 'mainTeacher' && selectedSchool?.manager && (
                                            <Box sx={{ p: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 1 }}>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                            <StarIcon />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={`${selectedSchool.manager.firstName} ${selectedSchool.manager.lastName}`}
                                                        secondary={selectedSchool.manager.email}
                                                    />
                                                </ListItem>
                                            </Box>
                                        )}

                                        {activeTab === 'teachers' && (
                                            <List>
                                                {selectedSchool?.users?.filter(user => user.role === 'teacher').map((user) => (
                                                    <ListItem key={user._id}>
                                                        <ListItemAvatar>
                                                            <Avatar>
                                                                <PersonIcon />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={`${user.firstName} ${user.lastName}`}
                                                            secondary={user.email}
                                                        />
                                                    </ListItem>
                                                ))}
                                                {(!selectedSchool?.users || selectedSchool.users.filter(u => u.role === 'teacher').length === 0) && (
                                                    <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                                                        Nessun insegnante associato
                                                    </Typography>
                                                )}
                                            </List>
                                        )}
                                    </CardContent>
                                </Card>
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
                    <SchoolUsersManagement
                        manager={selectedSchool?.manager}
                        users={selectedSchool?.users || []}
                        onAddUser={handleAddUser}
                        onRemoveUser={handleRemoveUser}
                        onChangeManager={handleChangeManager}
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