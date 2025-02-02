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
    Info as InfoIcon
} from '@mui/icons-material';

const AdminDetailsTab = ({ school }) => {
    // Funzione per formattare le date con ora
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Grid container spacing={3}>
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
                                                    label={school.isActive ? "Attiva" : "Inattiva"}
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
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default AdminDetailsTab;