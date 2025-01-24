import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

const DeactivationDialog = ({
    open,
    onClose,
    onConfirm,
    section
}) => {
    if (!section) return null;

    const handleConfirm = () => {
        onConfirm(section);
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
                        Studenti nella sezione: <strong>{section.studentsCount || 0}</strong>
                    </Typography>
                </Box>

                {section.studentsCount > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Non è possibile disattivare una sezione con studenti assegnati.
                        Riassegna prima gli studenti ad altre sezioni.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirm}
                    color="warning"
                    variant="contained"
                    disabled={section.studentsCount > 0}
                >
                    Disattiva
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeactivationDialog;