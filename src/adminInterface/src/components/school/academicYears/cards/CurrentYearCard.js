import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Paper,
    Stack,
    Alert,
    Button,
    Chip
} from '@mui/material';
import {
    Event as EventIcon,
    ViewList as ViewListIcon, // Sostituito ClassesIcon con ViewListIcon
    Edit as EditIcon,
    Archive as ArchiveIcon,
    Add as AddIcon
} from '@mui/icons-material';
import YearTransitionButton from '../../yearManagement/YearTransitionButton';

const CurrentYearCard = ({ 
    currentYear, 
    formatYearDisplay, 
    formatDate, 
    handleOpenClassesDialog, 
    handleOpenEditYearDialog, 
    handleArchiveYear,
    handleOpenNewYearDialog,
    school,
    getSchoolById
}) => {
    return (
        <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <EventIcon color="primary" fontSize="large" />
                    <Typography variant="h6">Anno Accademico Corrente</Typography>
                    {currentYear && (
                        <Chip 
                            label="Attivo"
                            color="success"
                            size="small"
                        />
                    )}
                </Box>

                {currentYear ? (
                    <>
                        <Grid container spacing={3} mb={3}>
                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Anno
                                        </Typography>
                                        <Typography variant="h5">
                                            {formatYearDisplay(currentYear.year)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Data Inizio
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(currentYear.startDate)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Data Fine
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(currentYear.endDate)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<ViewListIcon />} // Sostituito ClassesIcon con ViewListIcon
                                    onClick={() => handleOpenClassesDialog(currentYear)}
                                    sx={{ mr: 1 }}
                                >
                                    Visualizza Classi
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleOpenEditYearDialog(currentYear)}
                                >
                                    Modifica
                                </Button>
                            </Box>
                            
                            <Box>
                                <YearTransitionButton 
                                    school={school} 
                                    onTransitionComplete={() => getSchoolById(school._id)}
                                />
                                
                                <Button 
                                    variant="outlined" 
                                    color="warning"
                                    startIcon={<ArchiveIcon />}
                                    onClick={() => handleArchiveYear(currentYear._id)}
                                    sx={{ ml: 1 }}
                                >
                                    Archivia Anno
                                </Button>
                            </Box>
                        </Box>
                    </>
                ) : (
                    <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Nessun anno accademico attivo. Attiva un anno pianificato o crea un nuovo anno accademico.
                        </Alert>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />}
                            onClick={handleOpenNewYearDialog}
                        >
                            Crea Nuovo Anno Accademico
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default CurrentYearCard;