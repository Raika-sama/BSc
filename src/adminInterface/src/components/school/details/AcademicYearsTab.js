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
    Alert,
    Paper
} from '@mui/material';
import {
    Event as EventIcon,
    School as SchoolIcon,
    Group as GroupIcon,
    AccessTime as AccessTimeIcon
} from '@mui/icons-material';

const AcademicYearsTab = ({ school }) => {
    const currentYear = school.academicYears?.find(year => year.status === 'active');
    const pastYears = school.academicYears?.filter(year => year.status !== 'active') || [];

    // Funzioni helper
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Card per l'anno corrente
    const CurrentYearCard = () => (
        <Card elevation={3} sx={{ mb: 3 }}>
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

                {currentYear ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Anno
                                    </Typography>
                                    <Typography variant="h5">
                                        {formatDate(currentYear.year)}
                                    </Typography>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Studenti Totali
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <GroupIcon color="primary" />
                                        <Typography variant="h5">
                                            {currentYear.totalStudents || 0}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Classi Attive
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <SchoolIcon color="primary" />
                                        <Typography variant="h5">
                                            {currentYear.activeClasses || 0}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                ) : (
                    <Alert severity="warning">
                        Nessun anno accademico attivo
                    </Alert>
                )}
            </CardContent>
        </Card>
    );

    // Card per lo storico anni
    const PastYearsCard = () => (
        <Card elevation={2}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <AccessTimeIcon color="primary" />
                    <Typography variant="h6">Storico Anni Accademici</Typography>
                </Stack>

                {pastYears.length > 0 ? (
                    <List>
                        {pastYears.map((year, index) => (
                            <React.Fragment key={year.year}>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle1" component="span">
                                                    {formatDate(year.year)}
                                                </Typography>
                                                <Box>
                                                    <Chip
                                                        label="Concluso"
                                                        size="small"
                                                        color="default"
                                                    />
                                                </Box>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Studenti Totali: {year.totalStudents || 0}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Classi: {year.activeClasses || 0}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < pastYears.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            Nessuno storico disponibile
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <CurrentYearCard />
            <PastYearsCard />
        </Box>
    );
};

export default AcademicYearsTab;