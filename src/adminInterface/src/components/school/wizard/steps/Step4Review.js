import React from 'react';
import {
    Grid,
    Typography,
    Paper,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import {
    School as SchoolIcon,
    Event as EventIcon,
    Person as PersonIcon,
    Class as ClassIcon
} from '@mui/icons-material';

const Step4Review = ({ formData }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Non specificata';
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getSchoolTypeLabel = (type) => {
        const types = {
            'middle_school': 'Scuola Media',
            'high_school': 'Scuola Superiore'
        };
        return types[type] || type;
    };

    const getInstitutionTypeLabel = (type) => {
        const types = {
            'scientific': 'Scientifico',
            'classical': 'Classico',
            'artistic': 'Artistico',
            'none': 'Nessuno'
        };
        return types[type] || type;
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Riepilogo Configurazione
                </Typography>
            </Grid>

            {/* Informazioni Base */}
            <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <SchoolIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                            Informazioni Base
                        </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Nome Scuola
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formData.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Tipo Scuola
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {getSchoolTypeLabel(formData.schoolType)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Tipo Istituto
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {getInstitutionTypeLabel(formData.institutionType)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Indirizzo
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formData.address}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Regione
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formData.region}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Provincia
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formData.province}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Numero massimo studenti per classe (default)
                                </Typography>
                                <Typography variant="body1">
                                    {formData.defaultMaxStudentsPerClass}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Grid>

            {/* Anno Accademico */}
            <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <EventIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                            Anno Accademico
                        </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Anno
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    {formData.academicYear}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Data Inizio
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formatDate(formData.startDate)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Data Fine
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formatDate(formData.endDate)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Grid>

            {/* Sezioni */}
            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <ClassIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                            Sezioni Configurate
                        </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    {formData.sections?.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sezione</TableCell>
                                        <TableCell align="right">Numero Massimo Studenti</TableCell>
                                        <TableCell align="right">Differenza dal Default</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.sections.map((section) => (
                                        <TableRow key={section.name}>
                                            <TableCell>
                                                <Chip 
                                                    label={section.name} 
                                                    size="small" 
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {section.maxStudents}
                                            </TableCell>
                                            <TableCell align="right">
                                                {section.maxStudents !== formData.defaultMaxStudentsPerClass && (
                                                    <Chip
                                                        label={`${section.maxStudents > formData.defaultMaxStudentsPerClass ? '+' : ''}${section.maxStudents - formData.defaultMaxStudentsPerClass}`}
                                                        size="small"
                                                        color={section.maxStudents > formData.defaultMaxStudentsPerClass ? "warning" : "info"}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="warning">
                            Nessuna sezione configurata
                        </Alert>
                    )}
                </Paper>
            </Grid>

            <Grid item xs={12}>
                <Alert severity="info" variant="outlined">
                    Verifica attentamente i dati inseriti prima di procedere con la creazione della scuola.
                    Una volta confermati, alcuni dati come il tipo di scuola e il tipo di istituto non potranno essere modificati.
                </Alert>
            </Grid>
        </Grid>
    );
};

export default Step4Review;