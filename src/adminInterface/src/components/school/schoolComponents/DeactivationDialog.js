import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

const DeactivationDialog = ({ open, onClose, onConfirm, section }) => {
    if (!section) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Conferma Disattivazione Sezione
            </DialogTitle>
            <DialogContent>
                <Typography gutterBottom>
                    Stai per disattivare la sezione <strong>{section.name}</strong>.
                </Typography>

                <Box sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon color="primary" />
                    <Typography>
                        {section.studentsCount > 0 
                            ? `${section.studentsCount} studenti verranno rimossi da questa sezione`
                            : 'Nessuno studente verrà influenzato da questa operazione.'}
                    </Typography>
                </Box>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    Questa operazione non può essere annullata.
                    {section.studentsCount > 0 && ' Gli studenti dovranno essere riassegnati manualmente.'}
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirm}
                    color="warning"
                    variant="contained"
                >
                    Conferma Disattivazione
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(DeactivationDialog);