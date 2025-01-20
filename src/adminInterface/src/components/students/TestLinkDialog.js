// src/components/students/TestLinkDialog.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNotification } from '../../context/NotificationContext';

const TestLinkDialog = ({ open, onClose, testLink }) => {
    const { showNotification } = useNotification();
    
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(testLink);
            showNotification('Link copiato negli appunti', 'success');
        } catch (error) {
            console.error('Errore nella copia:', error);
            showNotification('Errore nella copia del link', 'error');
        }
    };

    const handleSendEmail = () => {
        // TODO: Implementare invio email
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Link Test CSI</DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    Condividi questo link con lo studente per permettergli di svolgere il test:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <TextField
                        fullWidth
                        value={testLink}
                        variant="outlined"
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                    <Tooltip title="Copia link">
                        <IconButton onClick={handleCopyLink} color="primary">
                            <ContentCopyIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    Nota: questo link è valido per una sola sessione di test e scadrà tra 24 ore.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Chiudi</Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleCopyLink}
                    startIcon={<ContentCopyIcon />}
                >
                    Copia Link
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TestLinkDialog;