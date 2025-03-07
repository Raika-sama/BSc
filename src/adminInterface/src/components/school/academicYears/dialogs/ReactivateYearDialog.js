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

const ReactivateYearDialog = ({
    open,
    handleClose,
    yearToReactivate,
    handleConfirmReactivate,
    isLoading
}) => {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle>
                Conferma Riattivazione Anno Accademico
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography component="div">
                        Stai per riattivare l'anno accademico {yearToReactivate?.year}.
                    </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <Typography component="div">
                        Questa operazione:
                    </Typography>
                    <ul>
                        <li>Ripristinerà l'anno accademico in stato "pianificato"</li>
                        <li>Permetterà di attivare nuovamente l'anno</li>
                        <li>Non ripristinerà automaticamente le classi e gli studenti archiviati</li>
                    </ul>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography component="div">
                        Vuoi procedere con la riattivazione dell'anno accademico?
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirmReactivate} 
                    color="primary"
                    variant="contained"
                    disabled={isLoading}
                >
                    {isLoading ? 'Riattivazione in corso...' : 'Conferma Riattivazione'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReactivateYearDialog;