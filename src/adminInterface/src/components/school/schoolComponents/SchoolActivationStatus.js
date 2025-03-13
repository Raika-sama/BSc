// src/components/school/schoolComponents/SchoolActivationStatus.js
import React, { useState } from 'react';
import { 
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Typography,
    Alert,
    Divider
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    Warning as WarningIcon,
    Replay as ReplayIcon
} from '@mui/icons-material';
import { useSchool } from '../../../context/SchoolContext';

/**
 * Componente che mostra lo stato di attivazione di una scuola e permette di disattivarla/riattivarla
 * @param {Object} props - Props del componente
 * @param {Object} props.school - Dati della scuola
 * @param {Function} props.onStatusChange - Callback chiamata quando lo stato cambia
 */
const SchoolActivationStatus = ({ school, onStatusChange }) => {
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    
    const { deactivateSchool, reactivateSchool, loading } = useSchool();

    // Gestori eventi per dialog di disattivazione
    const handleOpenDeactivateDialog = () => {
        setDeactivateDialogOpen(true);
    };

    const handleCloseDeactivateDialog = () => {
        setDeactivateDialogOpen(false);
        setReason('');
        setNotes('');
    };

    const handleDeactivate = async () => {
        try {
            const result = await deactivateSchool(school._id, { reason, notes });
            handleCloseDeactivateDialog();
            if (onStatusChange) onStatusChange(result.school);
        } catch (error) {
            console.error('Error deactivating school:', error);
        }
    };

    // Gestori eventi per dialog di riattivazione
    const handleOpenReactivateDialog = () => {
        setReactivateDialogOpen(true);
    };

    const handleCloseReactivateDialog = () => {
        setReactivateDialogOpen(false);
    };

    const handleReactivate = async () => {
        try {
            const result = await reactivateSchool(school._id);
            handleCloseReactivateDialog();
            if (onStatusChange) onStatusChange(result.school);
        } catch (error) {
            console.error('Error reactivating school:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

    return (
        <>
            <Box sx={{ mb: 3, p: 2, border: 1, borderRadius: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                    Stato di Attivazione
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip 
                        icon={school.isActive ? <CheckIcon /> : <CloseIcon />}
                        label={school.isActive ? "Attiva" : "Disattivata"}
                        color={school.isActive ? "success" : "error"}
                        variant="outlined"
                        sx={{ mr: 2 }}
                    />
                    
                    {school.isActive ? (
                        <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={handleOpenDeactivateDialog}
                            disabled={loading}
                            startIcon={<CloseIcon />}
                        >
                            Disattiva Scuola
                        </Button>
                    ) : (
                        <Button 
                            variant="outlined" 
                            color="success" 
                            onClick={handleOpenReactivateDialog}
                            disabled={loading}
                            startIcon={<ReplayIcon />}
                        >
                            Riattiva Scuola
                        </Button>
                    )}
                </Box>
                
                {!school.isActive && (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Questa scuola è attualmente disattivata. Gli utenti associati non possono accedere ai servizi.
                        </Alert>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Informazioni sulla disattivazione:
                        </Typography>
                        
                        <Box sx={{ ml: 2 }}>
                            {school.deactivatedAt && (
                                <Typography variant="body2" gutterBottom>
                                    <strong>Data disattivazione:</strong> {formatDate(school.deactivatedAt)}
                                </Typography>
                            )}
                            
                            {school.deactivationReason && (
                                <Typography variant="body2" gutterBottom>
                                    <strong>Motivo:</strong> {school.deactivationReason}
                                </Typography>
                            )}
                            
                            {school.deactivationNotes && (
                                <Typography variant="body2" gutterBottom>
                                    <strong>Note:</strong> {school.deactivationNotes}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Dialog per la disattivazione */}
            <Dialog
                open={deactivateDialogOpen}
                onClose={handleCloseDeactivateDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    Disattiva Scuola
                </DialogTitle>
                <DialogContent>
                    <DialogContentText paragraph>
                        Stai per disattivare la scuola <strong>{school.name}</strong>. 
                        Questa operazione disattiverà anche tutte le classi associate.
                    </DialogContentText>
                    
                    <DialogContentText paragraph>
                        Gli utenti e gli studenti manterranno le loro associazioni, ma non potranno più accedere 
                        ai servizi finché la scuola non sarà riattivata.
                    </DialogContentText>
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        id="reason"
                        label="Motivo della disattivazione"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                    />
                    
                    <TextField
                        margin="dense"
                        id="notes"
                        label="Note aggiuntive"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeactivateDialog} color="inherit">
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleDeactivate} 
                        color="error" 
                        disabled={!reason.trim() || loading}
                    >
                        Disattiva
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog per la riattivazione */}
            <Dialog
                open={reactivateDialogOpen}
                onClose={handleCloseReactivateDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReplayIcon color="success" sx={{ mr: 1 }} />
                    Riattiva Scuola
                </DialogTitle>
                <DialogContent>
                    <DialogContentText paragraph>
                        Stai per riattivare la scuola <strong>{school.name}</strong>. 
                        Questa operazione riabiliterà anche tutte le classi associate 
                        che erano state disattivate durante la disattivazione della scuola.
                    </DialogContentText>
                    
                    <DialogContentText>
                        Gli utenti potranno nuovamente accedere a tutti i servizi.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReactivateDialog} color="inherit">
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleReactivate} 
                        color="success" 
                        disabled={loading}
                    >
                        Riattiva
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SchoolActivationStatus;