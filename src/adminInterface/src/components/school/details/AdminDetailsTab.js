import React from 'react';
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
    Paper,
    Alert
} from '@mui/material';
import {
    Settings as SettingsIcon,
    History as HistoryIcon,
    Group as GroupIcon,
    Info as InfoIcon,
    Block as BlockIcon
} from '@mui/icons-material';
import SchoolActivationStatus from '../schoolComponents/SchoolActivationStatus';

const AdminDetailsTab = ({ school }) => {
    // Funzione per formattare le date con ora
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Funzione semplice per formattare solo la data
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleStatusChange = (updatedSchool) => {
        // Qui potremmo gestire l'aggiornamento dello stato se necessario
        // In questo caso, l'aggiornamento avviene già nel context
    };

    return (
        <Grid container spacing={3}>
            {/* Componente di attivazione/disattivazione */}
            <Grid item xs={12}>
                <SchoolActivationStatus 
                    school={school} 
                    onStatusChange={handleStatusChange} 
                />
            </Grid>

            {/* Info Amministrative */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <SettingsIcon color="primary" />
                            <Typography variant="h6">Dettagli Amministrativi</Typography>
                        </Stack>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary="Stato Scuola"
                                    secondary={
                                        <Typography component="div" variant="body2">
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip 
                                                    icon={school.isActive ? null : <BlockIcon />}
                                                    label={school.isActive ? "Attiva" : "Disattivata"}
                                                    color={school.isActive ? "success" : "error"}
                                                    size="small"
                                                />
                                            </Box>
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
    
                            <ListItem>
                                <ListItemText 
                                    primary="Numero Massimo Studenti per Classe"
                                    secondary={
                                        <Typography variant="body2" color="text.secondary">
                                            {school.defaultMaxStudentsPerClass} studenti
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
    
                            <ListItem>
                                <ListItemText 
                                    primary="Numero Sezioni Attive"
                                    secondary={
                                        <Typography variant="body2" color="text.secondary">
                                            {school.sections?.filter(s => s.isActive)?.length || 0} sezioni
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Grid>
    
            {/* Timeline Modifiche */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <HistoryIcon color="primary" />
                            <Typography variant="h6">Timeline Modifiche</Typography>
                        </Stack>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary="Data Creazione"
                                    secondary={formatDateTime(school.createdAt)}
                                />
                            </ListItem>
                            <Divider component="li" />
    
                            <ListItem>
                                <ListItemText 
                                    primary="Ultima Modifica"
                                    secondary={formatDateTime(school.updatedAt)}
                                />
                            </ListItem>
                            
                            {!school.isActive && (
                                <>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemText 
                                            primary="Disattivata il"
                                            secondary={formatDateTime(school.deactivatedAt)}
                                        />
                                    </ListItem>
                                </>
                            )}
                            
                            {school.reactivatedAt && (
                                <>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemText 
                                            primary="Ultima Riattivazione"
                                            secondary={formatDateTime(school.reactivatedAt)}
                                        />
                                    </ListItem>
                                </>
                            )}
                        </List>
                    </CardContent>
                </Card>
            </Grid>
    
            {/* Info Utenti */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <GroupIcon color="primary" />
                            <Typography variant="h6">Gestione Utenti</Typography>
                        </Stack>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary="Utenti Associati"
                                    secondary={
                                        <Typography component="div" variant="body2">
                                            <Box sx={{ mt: 1 }}>
                                                <Stack direction="row" spacing={1}>
                                                    <Chip 
                                                        label={`${school.users?.length || 0} totali`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <Chip 
                                                        label={`${school.users?.filter(u => u.role === 'admin')?.length || 0} admin`}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                </Stack>
                                            </Box>
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
    
                            <ListItem>
                                <ListItemText 
                                    primary="Manager"
                                    secondary={
                                        school.manager ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {`${school.manager.firstName} ${school.manager.lastName} (${school.manager.email})`}
                                            </Typography>
                                        ) : (
                                            <Alert severity="warning" sx={{ mt: 1 }}>
                                                Nessun manager assegnato
                                            </Alert>
                                        )
                                    }
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Grid>
    
            {/* Note e Configurazioni */}
            <Grid item xs={12} md={6}>
                <Card elevation={2}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <InfoIcon color="primary" />
                            <Typography variant="h6">Configurazioni</Typography>
                        </Stack>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Tipo Scuola
                                    </Typography>
                                    <Typography variant="body1">
                                        {school.schoolType === 'middle_school' ? 'Scuola Media' : 'Scuola Superiore'}
                                    </Typography>
                                </Box>
                                
                                {school.schoolType === 'high_school' && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Tipo Istituto
                                        </Typography>
                                        <Typography variant="body1">
                                            {school.institutionType === 'none' ? 'Nessuno' : 
                                             school.institutionType.charAt(0).toUpperCase() + school.institutionType.slice(1)}
                                        </Typography>
                                    </Box>
                                )}
    
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Versione
                                    </Typography>
                                    <Typography variant="body1">
                                        {school.__v || 0}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Mostra informazioni sulla disattivazione se la scuola è disattivata */}
                        {!school.isActive && school.deactivationReason && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" color="error" gutterBottom>
                                    Informazioni sulla disattivazione:
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Motivo:
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        {school.deactivationReason}
                                    </Typography>
                                    
                                    {school.deactivationNotes && (
                                        <>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Note aggiuntive:
                                            </Typography>
                                            <Typography variant="body2">
                                                {school.deactivationNotes}
                                            </Typography>
                                        </>
                                    )}
                                </Paper>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default AdminDetailsTab;