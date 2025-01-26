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
    ListItemAvatar,
    Avatar,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ClassIcon from '@mui/icons-material/Class';

import SchoolEditForm from './SchoolEditForm';
import SectionManagement from './schoolComponents/SectionManagement';
import { useSchool } from '../../context/SchoolContext';

const SchoolDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);

    const { 
        selectedSchool,
        loading,
        error,
        getSchoolById,
        updateSchool
    } = useSchool();

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

    if (loading) {
        return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={30} />
        </Box>;
    }

    if (error || !selectedSchool) {
        return <Alert severity="error" sx={{ m: 2 }}>{error || 'Scuola non trovata'}</Alert>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={2}>
                <IconButton onClick={() => navigate('/admin/schools')} size="small">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ ml: 2, flex: 1 }}>
                    {selectedSchool.name}
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditMode(true)}
                >
                    Modifica
                </Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Informazioni" />
                    <Tab label="Sezioni" />
                    <Tab label="Utenti" />
                </Tabs>
            </Box>

            {/* Tab Panels */}
            {activeTab === 0 && (
                <Grid container spacing={2}>
                    {/* Info Card */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={1}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                        Informazioni Generali
                                    </Typography>
                                </Box>
                                <List dense>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Tipo Scuola"
                                            secondary={selectedSchool.schoolType === 'middle_school' ? 
                                                'Scuola Media' : 'Scuola Superiore'}
                                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                                            secondaryTypographyProps={{ fontSize: '0.875rem' }}
                                        />
                                    </ListItem>
                                    {selectedSchool.schoolType === 'high_school' && (
                                        <ListItem>
                                            <ListItemText 
                                                primary="Tipo Istituto"
                                                secondary={selectedSchool.institutionType}
                                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.875rem' }}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Location Card */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={1}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                        Ubicazione
                                    </Typography>
                                </Box>
                                <List dense>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Indirizzo"
                                            secondary={selectedSchool.address}
                                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                                            secondaryTypographyProps={{ fontSize: '0.875rem' }}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary={`${selectedSchool.region} - ${selectedSchool.province}`}
                                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Academic Year Card */}
                    <Grid item xs={12}>
                        <Card elevation={1}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <ClassIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                        Anno Accademico Corrente
                                    </Typography>
                                </Box>
                                {selectedSchool.academicYears?.[0] ? (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Chip 
                                            label={`Anno: ${selectedSchool.academicYears[0].year}`}
                                            size="small"
                                        />
                                        <Chip 
                                            label={selectedSchool.academicYears[0].status === 'active' ? 'Attivo' : 'Non attivo'}
                                            color={selectedSchool.academicYears[0].status === 'active' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Nessun anno accademico configurato
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Box sx={{ mt: -3 }}> {/* Negativo margin per compensare il padding del container di SectionManagement */}
                    <SectionManagement />
                </Box>
            )}

            {activeTab === 2 && (
                <UsersTab school={selectedSchool} />
            )}

            {/* Edit Form Dialog */}
            <SchoolEditForm
                open={isEditMode}
                onClose={() => setIsEditMode(false)}
                onSave={handleUpdateSchool}
                school={selectedSchool}
            />
        </Container>
    );
};

// Componente separato per il tab degli utenti
const UsersTab = ({ school }) => {
    return (
        <Card elevation={1}>
            <CardContent>
                <List dense>
                    {/* Manager */}
                    {school.manager && (
                        <ListItem>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <StarIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={`${school.manager.firstName} ${school.manager.lastName}`}
                                secondary={`Manager - ${school.manager.email}`}
                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                        </ListItem>
                    )}
                    
                    {/* Teachers */}
                    {school.users?.filter(user => user.role === 'teacher').map((user) => (
                        <ListItem key={user._id}>
                            <ListItemAvatar>
                                <Avatar>
                                    <PersonIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={`${user.firstName} ${user.lastName}`}
                                secondary={`Insegnante - ${user.email}`}
                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

export default SchoolDetails;