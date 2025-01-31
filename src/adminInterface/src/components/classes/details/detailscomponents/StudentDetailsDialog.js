import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Box,
    Chip
} from '@mui/material';

const DetailField = ({ label, value }) => (
    <Box mb={2}>
        <Typography variant="caption" color="textSecondary" display="block">
            {label}
        </Typography>
        <Typography variant="body1">
            {value || 'N/D'}
        </Typography>
    </Box>
);

const StudentDetailsDialog = ({ open, onClose, student }) => {
    if (!student) return null;

    const getStatusChip = (status) => {
        const statusConfig = {
            active: { color: 'success', label: 'Attivo' },
            pending: { color: 'warning', label: 'In Attesa' },
            inactive: { color: 'error', label: 'Inattivo' },
            transferred: { color: 'info', label: 'Trasferito' },
            graduated: { color: 'default', label: 'Diplomato' }
        };

        const config = statusConfig[status] || { color: 'default', label: status };
        return (
            <Chip
                label={config.label}
                color={config.color}
                size="small"
                sx={{ mt: 1 }}
            />
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle 
                sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    pb: 2
                }}
            >
                <Typography variant="h6">
                    Dettagli Studente
                </Typography>
                {student.status && getStatusChip(student.status)}
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <DetailField 
                            label="Nome Completo" 
                            value={`${student.firstName} ${student.lastName}`}
                        />
                        <DetailField 
                            label="Email" 
                            value={student.email}
                        />
                        <DetailField 
                            label="Genere" 
                            value={student.gender === 'M' ? 'Maschio' : 'Femmina'}
                        />
                        <DetailField 
                            label="Data di Nascita" 
                            value={student.dateOfBirth && new Date(student.dateOfBirth).toLocaleDateString()}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <DetailField 
                            label="Codice Fiscale" 
                            value={student.fiscalCode}
                        />
                        <DetailField 
                            label="Email Genitore" 
                            value={student.parentEmail}
                        />
                        <DetailField 
                            label="Necessità Speciali" 
                            value={student.specialNeeds ? 'Sì' : 'No'}
                        />
                        <DetailField 
                            label="Data Iscrizione" 
                            value={student.joinedAt && new Date(student.joinedAt).toLocaleString()}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose}>
                    Chiudi
                </Button>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onClose}
                    disabled
                >
                    Visualizza Test
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentDetailsDialog;