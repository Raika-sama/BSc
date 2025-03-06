import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    Box,
    Chip,
    Button
} from '@mui/material';
import Loading from '../../../common/Loading';

const ClassesDialog = ({
    open,
    handleClose,
    selectedYear,
    yearClasses,
    loadingClasses,
    formatYearDisplay
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                Classi - Anno Accademico {selectedYear ? formatYearDisplay(selectedYear.year) : ''}
            </DialogTitle>
            <DialogContent>
                {loadingClasses ? (
                    <Loading message="Caricamento classi in corso..." />
                ) : yearClasses.length > 0 ? (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {yearClasses.map((classItem) => (
                            <Grid item xs={12} sm={6} md={4} key={classItem._id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography component="div" variant="h6" gutterBottom>
                                            {classItem.year}ª {classItem.section}
                                        </Typography>
                                        <Stack spacing={1}>
                                            <Typography component="div" variant="body2">
                                                Studenti: {classItem.activeStudentsCount || 0} / {classItem.capacity || '-'}
                                            </Typography>
                                            <Chip 
                                                label={classItem.status} 
                                                color={
                                                    classItem.status === 'active' ? 'success' : 
                                                    classItem.status === 'planned' ? 'info' : 'default'
                                                }
                                                size="small"
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography component="div" color="text.secondary">
                            Nessuna classe trovata per questo anno accademico
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Chiudi</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClassesDialog;