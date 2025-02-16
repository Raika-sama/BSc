import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Typography, 
    Paper,
    Grid,
    Button,
    Stack,
    Divider,
    Dialog,            // Aggiungi questi
    DialogTitle,       // componenti
    DialogContent,     // per il
    DialogContentText, // Dialog
    DialogActions      // MUI
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StudentEditForm from './StudentEditForm';
import { useStudent } from '../../../../context/StudentContext';  // Aggiungi questo import
import { useNotification } from '../../../../context/NotificationContext';  // Aggiungi questo se non c'è già

// Modifica la definizione di CredentialsDialog
const CredentialsDialog = ({ open, onClose, credentials, showNotification }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyToClipboard = async () => {
        try {
            const text = `Username: ${credentials.username}\nPassword temporanea: ${credentials.temporaryPassword}`;
            await navigator.clipboard.writeText(text);
            setCopied(true);
            showNotification('Credenziali copiate negli appunti', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            showNotification('Errore nella copia delle credenziali', 'error');
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Credenziali Studente
            </DialogTitle>
            <DialogContent>
                <DialogContentText color="warning" sx={{ mb: 2 }}>
                    IMPORTANTE: Queste credenziali saranno visibili solo una volta.
                    Assicurati di salvarle o comunicarle allo studente.
                </DialogContentText>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Username
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {credentials?.username}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            Password Temporanea
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {credentials?.temporaryPassword}
                        </Typography>
                    </Box>
                </Paper>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleCopyToClipboard}
                    variant="contained"
                    color="primary"
                    disabled={copied}
                >
                    {copied ? 'Copiato!' : 'Copia Credenziali'}
                </Button>
                <Button onClick={onClose} color="inherit">
                    Chiudi
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const InfoTab = ({ student, setStudent }) => {
    const { generateCredentials, resetPassword } = useStudent(); // Aggiungi questa riga
    const { showNotification } = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);

 // Aggiungi questa funzione per gestire l'apertura del dialog
 const handleOpenCredentialsDialog = (creds) => {
    if (!creds?.username || !creds?.temporaryPassword) {
        showNotification('Dati credenziali non validi o mancanti', 'error');
        return;
    }
    setCredentials(creds);
    setOpenCredentialsDialog(true);
};

    const handleGenerateCredentials = async () => {
        try {
            const creds = await generateCredentials(student.id);
            if (!creds?.username || !creds?.temporaryPassword) {
                throw new Error('Credenziali non valide ricevute dal server');
            }
            setCredentials(creds);
            setOpenCredentialsDialog(true);
            setStudent(prev => ({
                ...prev,
                hasCredentials: true,
                credentialsSentAt: new Date()
            }));
        } catch (error) {
            console.error('Error generating credentials:', error);
            showNotification('Errore nella generazione delle credenziali', 'error');
        }
    };

    const handleResetPassword = async () => {
        try {
            console.log('Resetting password for student:', student.id);
            const result = await resetPassword(student.id);
            console.log('Reset password result:', result);
            
            if (!result?.username || !result?.temporaryPassword) {
                throw new Error('Credenziali incomplete ricevute dal server');
            }
            
            // Format credentials before setting state
            const formattedCreds = {
                username: result.username,
                temporaryPassword: result.temporaryPassword
            };
            
            setCredentials(formattedCreds);
            setOpenCredentialsDialog(true);
        } catch (error) {
            console.error('Error in handleResetPassword:', error);
            showNotification(
                error.message || 'Errore nel reset della password', 
                'error'
            );
        }
    };

    // Vista informativa
    const InfoView = () => (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3 
            }}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Dati Studente
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Informazioni complete dello studente
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    size="small"
                >
                    Modifica
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Informazioni Anagrafiche */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Anagrafica
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Nome Completo
                                </Typography>
                                <Typography variant="body1">
                                    {`${student.firstName} ${student.lastName}`}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Codice Fiscale
                                </Typography>
                                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                    {student.fiscalCode || 'Non specificato'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Data di Nascita
                                </Typography>
                                <Typography variant="body1">
                                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('it-IT') : 'Non specificata'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Genere
                                </Typography>
                                <Typography variant="body1">
                                    {student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'Non specificato'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Contatti */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Contatti
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {student.email}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Email Genitore
                                </Typography>
                                <Typography variant="body1">
                                    {student.parentEmail || 'Non specificata'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Informazioni Scolastiche e Tecniche */}
                <Grid item xs={12}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Informazioni Scolastiche e Tecniche
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                    ID Studente
                                </Typography>
                                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                    {student._id || student.id}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Scuola
                                </Typography>
                                <Typography variant="body1">
                                    {student.schoolId?.name || 'Non assegnata'}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                    ID: {student.schoolId?._id || 'N/D'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Classe
                                </Typography>
                                <Typography variant="body1">
                                    {student.classId ? 
                                        `${student.classId.year}${student.classId.section}` : 
                                        'Non assegnata'
                                    }
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                    ID: {student.classId?._id || 'N/D'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Credenziali di Accesso
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        {!student.hasCredentials ? (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleGenerateCredentials}
                                            >
                                                Genera Credenziali
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleResetPassword}
                                            >
                                                Reset Password
                                            </Button>
                                        )}

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                // Qui implementeremo il reinvio email
                                                showNotification('Funzionalità disponibile prossimamente', 'info');
                                            }}
                                        >
                                            Reinvia Credenziali
                                        </Button>
                                    </Stack>
                                </Box>
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Stato Credenziali
                                        </Typography>
                                        <Typography variant="body1">
                                            {student.hasCredentials ? 'Generate' : 'Non Generate'}
                                        </Typography>
                                    </Box>
                                    {student.hasCredentials && student.credentialsSentAt && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Generate il
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(student.credentialsSentAt).toLocaleString('it-IT')}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                            </Grid>

                            {/* Docenti con ID */}
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Docenti
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Docente Principale
                                    </Typography>
                                    <Typography variant="body1">
                                        {student.mainTeacher ? 
                                            `${student.mainTeacher.firstName} ${student.mainTeacher.lastName}` : 
                                            'Non assegnato'
                                        }
                                        <Typography 
                                            component="span" 
                                            sx={{ 
                                                fontFamily: 'monospace',
                                                ml: 1,
                                                color: 'text.secondary'
                                            }}
                                        >
                                            (ID: {student.mainTeacher?._id || 'N/D'})
                                        </Typography>
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Altri Docenti
                                    </Typography>
                                    {student.teachers?.length > 0 ? (
                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                            {student.teachers.map((teacher) => (
                                                <Typography key={teacher._id} variant="body1">
                                                    {`${teacher.firstName} ${teacher.lastName}`}
                                                    <Typography 
                                                        component="span" 
                                                        sx={{ 
                                                            fontFamily: 'monospace',
                                                            ml: 1,
                                                            color: 'text.secondary'
                                                        }}
                                                    >
                                                        (ID: {teacher._id})
                                                    </Typography>
                                                </Typography>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body1">Nessun docente aggiuntivo</Typography>
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                            </Grid>

                            {/* Status */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Stato
                                </Typography>
                                <Typography variant="body1">
                                    {student.status || 'N/D'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Attivo
                                </Typography>
                                <Typography variant="body1">
                                    {student.isActive ? 'Sì' : 'No'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                    Necessità Speciali
                                </Typography>
                                <Typography variant="body1">
                                    {student.specialNeeds ? 'Sì' : 'No'}
                                </Typography>
                            </Grid>

                            {/* Date */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Date
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Creato il:
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(student.createdAt).toLocaleString('it-IT')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Ultimo aggiornamento:
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(student.updatedAt).toLocaleString('it-IT')}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <>
            <CredentialsDialog 
                open={openCredentialsDialog}
                onClose={() => setOpenCredentialsDialog(false)}
                credentials={credentials}
                showNotification={showNotification}
            />
            {isEditing ? (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Modifica Dati Personali
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Modifica le informazioni personali dello studente
                </Typography>
            </Box>
            <StudentEditForm 
                student={student} 
                setStudent={setStudent}
                onCancel={() => setIsEditing(false)}
            />
            </Box>
        ) : (
            <InfoView />
        )}
        </>
    );
};

InfoTab.propTypes = {
    student: PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        fiscalCode: PropTypes.string,
        phone: PropTypes.string,
        address: PropTypes.string,
        city: PropTypes.string,
        schoolId: PropTypes.shape({
            _id: PropTypes.string,
            name: PropTypes.string
        }),
        classId: PropTypes.shape({
            _id: PropTypes.string,
            year: PropTypes.number,
            section: PropTypes.string
        }),
        mainTeacher: PropTypes.shape({
            _id: PropTypes.string,
            firstName: PropTypes.string,
            lastName: PropTypes.string
        }),
        teachers: PropTypes.arrayOf(PropTypes.shape({
            _id: PropTypes.string,
            firstName: PropTypes.string,
            lastName: PropTypes.string
        })),
        status: PropTypes.string,
        isActive: PropTypes.bool,
        specialNeeds: PropTypes.bool,
        createdAt: PropTypes.string,
        updatedAt: PropTypes.string
    }).isRequired,
    setStudent: PropTypes.func.isRequired,
};

// Aggiungi PropTypes per CredentialsDialog
CredentialsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    credentials: PropTypes.shape({
        username: PropTypes.string,
        temporaryPassword: PropTypes.string
    }),
    showNotification: PropTypes.func.isRequired
};

export default InfoTab;