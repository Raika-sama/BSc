// src/adminInterface/src/components/school/wizard/steps/Step4Review.js
import React from 'react';
import {
    Grid,
    Typography,
    Paper,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert
} from '@mui/material';

const Step4Review = ({ formData }) => {
    const getSchoolTypeLabel = (type) => ({
        'middle_school': 'Scuola Media',
        'high_school': 'Scuola Superiore'
    }[type] || type);

    const getInstitutionTypeLabel = (type) => ({
        'none': 'Nessuno',
        'scientific': 'Scientifico',
        'classical': 'Classico',
        'artistic': 'Artistico'
    }[type] || type);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT');
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
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Informazioni Base
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Nome Scuola
                                </Typography>
                                <Typography variant="body1">
                                    {formData.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Tipo Scuola
                                </Typography>
                                <Typography variant="body1">
                                    {getSchoolTypeLabel(formData.schoolType)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Tipo Istituto
                                </Typography>
                                <Typography variant="body1">
                                    {getInstitutionTypeLabel(formData.institutionType)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Indirizzo
                                </Typography>
                                <Typography variant="body1">
                                    {formData.address}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Regione
                                </Typography>
                                <Typography variant="body1">
                                    {formData.region}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Provincia
                                </Typography>
                                <Typography variant="body1">
                                    {formData.province}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Grid>

            {/* Anno Accademico */}
            <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Anno Accademico
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Anno
                                </Typography>
                                <Typography variant="body1">
                                    {formData.academicYear}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Data Inizio
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(formData.startDate)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Data Fine
                                </Typography>
                                <Typography variant="body1">
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
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Sezioni Configurate
                    </Typography>
                    {formData.sections?.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sezione</TableCell>
                                        <TableCell align="right">Numero Massimo Studenti</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.sections.map((section) => (
                                        <TableRow key={section.name}>
                                            <TableCell>
                                                <Chip 
                                                    label={section.name} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {section.maxStudents}
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
                <Alert severity="info">
                    Verifica attentamente i dati inseriti prima di procedere con la creazione della scuola.
                    Una volta confermati, alcuni dati non potranno essere modificati.
                </Alert>
            </Grid>
        </Grid>
    );
};

export default Step4Review;