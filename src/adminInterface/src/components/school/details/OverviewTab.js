// src/components/school/OverviewTab.js (modificato)
import React, { useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Stack,
    Chip,
    Box,
    Divider,
    Button
} from '@mui/material';
import {
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Group as GroupIcon,
    Event as EventIcon,
    Edit as EditIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import EditSchoolForm from '../schoolComponents/EditSchoolForm'; // Importa il nuovo componente
import SchoolTypeChangeModal from '../schoolComponents/SchoolTypeChangeModal'; // Importa il nuovo componente

const OverviewTab = ({ school }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [typeChangeModalOpen, setTypeChangeModalOpen] = useState(false);

    // Funzione per formattare il tipo di scuola
    const getSchoolTypeLabel = (type) => ({
        'middle_school': 'Scuola Media',
        'high_school': 'Scuola Superiore'
    }[type] || type);

    // Funzione per formattare il tipo di istituto
    const getInstitutionTypeLabel = (type) => ({
        'none': 'Nessuno',
        'scientific': 'Scientifico',
        'classical': 'Classico',
        'artistic': 'Artistico'
    }[type] || type);

    // Funzione per formattare la data
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Se in modalità modifica, mostra il form
    if (isEditing) {
        return <EditSchoolForm school={school} onCancel={() => setIsEditing(false)} />;
    }

    return (
        <>
        <Grid container spacing={3}>
            {/* Info Principali */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <SchoolIcon color="primary" />
                            <Typography variant="h6">Informazioni Principali</Typography>
                            {/* Bottoni di modifica */}  
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                                    <Button 
                                        startIcon={<SettingsIcon />}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        onClick={() => setTypeChangeModalOpen(true)}
                                    >
                                        Cambia Tipo
                                    </Button>
                                    <Button 
                                        startIcon={<EditIcon />}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Modifica
                                    </Button>
                                </Box>
                        </Stack>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary="Nome Scuola"
                                    secondary={school.name}
                                />
                            </ListItem>
                            <Divider component="li" />
                            
                            <ListItem>
                                <ListItemText 
                                    primary="Tipo Scuola"
                                    secondary={getSchoolTypeLabel(school.schoolType)}
                                />
                            </ListItem>
                            <Divider component="li" />
                            
                            {school.schoolType === 'high_school' && (
                                <>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Tipo Istituto"
                                            secondary={getInstitutionTypeLabel(school.institutionType)}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </>
                            )}
                            
                            <ListItem>
                                <ListItemText 
                                    primary="Numero Massimo Studenti per Classe"
                                    secondary={school.defaultMaxStudentsPerClass}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Grid>
    
                {/* Info Location */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                <LocationIcon color="primary" />
                                <Typography variant="h6">Ubicazione</Typography>
                            </Stack>
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Indirizzo"
                                        secondary={school.address}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                
                                <ListItem>
                                    <ListItemText 
                                        primary="Regione"
                                        secondary={school.region}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                
                                <ListItem>
                                    <ListItemText 
                                        primary="Provincia"
                                        secondary={school.province}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
    
            {/* Info Manager */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <GroupIcon color="primary" />
                            <Typography variant="h6">Manager</Typography>
                        </Stack>
                        {school.manager ? (
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Nome Completo"
                                        secondary={`${school.manager.firstName} ${school.manager.lastName}`}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                
                                <ListItem>
                                    <ListItemText 
                                        primary="Email"
                                        secondary={school.manager.email}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                
                                <ListItem>
                                    <ListItemText 
                                        primary="Ruolo"
                                        secondary={
                                            <Typography component="div" variant="body2">
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Chip 
                                                        label={school.manager.role}
                                                        color="primary"
                                                        size="small"
                                                    />
                                                </Box>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            </List>
                        ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    Nessun manager assegnato
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
    
            {/* Anno Accademico Corrente */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <EventIcon color="primary" fontSize="large" />
                            <Typography variant="h6">Anno Accademico Corrente</Typography>
                            <Box>
                                <Chip 
                                    label="Attivo"
                                    color="success"
                                    size="small"
                                />
                            </Box>
                        </Box>
                        {school.academicYears?.[0] ? (
                            <List>
                                <ListItem>
                                    <ListItemText 
                                        primary="Anno"
                                        secondary={formatDate(school.academicYears[0].year)}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                
                                <ListItem>
                                    <ListItemText 
                                        primary="Stato"
                                        secondary={
                                            <Typography component="div" variant="body2">
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Chip 
                                                        label={school.academicYears[0].status === 'active' ? 'Attivo' : 'Non Attivo'}
                                                        color={school.academicYears[0].status === 'active' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </Box>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            </List>
                        ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    Nessun anno accademico configurato
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
        {/* Modale per il cambio tipo scuola */}
        <SchoolTypeChangeModal 
        open={typeChangeModalOpen} 
        onClose={() => setTypeChangeModalOpen(false)} 
        school={school} 
    />
    </>
    );
};

export default OverviewTab;