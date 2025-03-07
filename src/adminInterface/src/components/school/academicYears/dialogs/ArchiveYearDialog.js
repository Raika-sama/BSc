import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Button
} from '@mui/material';

const ArchiveYearDialog = ({
    open,
    handleClose,
    yearToArchive,
    handleConfirmArchive,
    isLoading
}) => {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle>
                Conferma Archiviazione Anno Accademico
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography component="div">
                        NOTA: Questa operazione è riservata agli utenti Administrator e Developer.
                    </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <Typography component="div">
                        Stai per archiviare l'anno accademico {yearToArchive?.year}. Questa operazione:
                    </Typography>
                </Box>
                <ul>
                    <li>Archivierà tutte le classi dell'anno</li>
                    <li>Rimuoverà tutti i riferimenti agli insegnanti dalle classi</li>
                    <li>Disattiverà gli studenti delle classi coinvolte</li>
                    <li>Rimuoverà i riferimenti alle classi e agli studenti dai profili degli insegnanti</li>
                    {yearToArchive?.status === 'active' && (
                        <li>Attiverà automaticamente l'anno pianificato più recente (se presente)</li>
                    )}
                </ul>
                <Box sx={{ mt: 2 }}>
                    <Typography component="div" color="error">
                        Questa operazione non può essere annullata. Sei sicuro di voler procedere?
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirmArchive} 
                    color="warning"
                    variant="contained"
                    disabled={isLoading}
                >
                    {isLoading ? 'Archiviazione in corso...' : 'Conferma Archiviazione'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ArchiveYearDialog;