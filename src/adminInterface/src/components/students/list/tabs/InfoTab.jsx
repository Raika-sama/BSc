import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Typography, 
    Paper,
    Grid,
    Button,
    Stack,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StudentEditForm from './StudentEditForm';
import { useStudent } from '../../../../context/StudentContext';
import { useNotification } from '../../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

// CredentialsDialog component
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
    const { generateCredentials, resetPassword, deleteStudent } = useStudent();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);
    const [lastCredentials, setLastCredentials] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Funzione per gestire l'apertura del dialog
    const handleOpenCredentialsDialog = (creds) => {
        if (!creds?.username || !creds?.temporaryPassword) {
            showNotification('Dati credenziali non validi o mancanti', 'error');
            return;
        }
        setCredentials(creds);
        setOpenCredentialsDialog(true);
    };

    // Debug per lastCredentials
    useEffect(() => {
        console.log('LastCredentials state:', lastCredentials);
    }, [lastCredentials]);

    const handleResetPassword = async () => {
        try {
            console.log('Starting password reset for student:', student.id);
            
            // Log pre-richiesta
            console.log('Sending request to:', `/student-auth/admin/reset-password/${student.id}`);
            
            // Esegui la richiesta
            const result = await resetPassword(student.id);
            
            // Log del risultato completo
            console.log('Reset password raw result:', result);
            console.log('Result type:', typeof result);
            console.log('Result structure:', Object.keys(result));
            
            // Analisi dettagliata della risposta
            if (result) {
                console.log('Detailed analysis of result:');
                console.log('- Has username?', !!result.username);
                console.log('- Has temporaryPassword?', !!result.temporaryPassword);
                
                // Se è un oggetto, esplora le proprietà interne
                if (typeof result === 'object') {
                    Object.keys(result).forEach(key => {
                        console.log(`- Property "${key}":`, result[key]);
                    });
                }
            } else {
                console.error('Result is falsy or undefined');
            }
            
            // Verifica delle credenziali
            if (!result?.username || !result?.temporaryPassword) {
                console.error('Invalid credentials format received:', result);
                throw new Error('Credenziali non valide ricevute dal server');
            }

            // Aggiorniamo esplicitamente lo state con le nuove credenziali
            const newCredentials = {
                username: result.username,
                temporaryPassword: result.temporaryPassword,
                generatedAt: new Date().toISOString()
            };
            
            console.log('Setting new credentials:', newCredentials);
            
            // Debug prima di settare lo state
            console.log('Current lastCredentials state:', lastCredentials);
            setLastCredentials(newCredentials);
            console.log('LastCredentials state should be updated to:', newCredentials);
            
            // Aggiorniamo anche lo student object
            setStudent(prev => {
                const updated = {
                    ...prev,
                    hasCredentials: true,
                    credentialsSentAt: new Date().toISOString()
                };
                console.log('Updating student from:', prev);
                console.log('Updating student to:', updated);
                return updated;
            });

            // IMPORTANTE: Prima settiamo le credenziali nel componente di dialog
            console.log('Setting credentials for dialog:', newCredentials);
            setCredentials(newCredentials);
            
            // Poi apriamo il dialog
            console.log('Opening credentials dialog');
            setOpenCredentialsDialog(true);
            
            return newCredentials;
        } catch (error) {
            console.error('Error in handleResetPassword:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            
            showNotification(
                error.message || 'Errore nel reset della password',
                'error'
            );
            throw error;
        }
    };

    const handleGenerateCredentials = async () => {
        try {
            console.log('Starting credentials generation for student:', student.id);
            const result = await generateCredentials(student.id);
            
            console.log('Generation result:', result);
            
            if (!result?.username || !result?.temporaryPassword) {
                console.error('Invalid credentials format received:', result);
                throw new Error('Credenziali non valide ricevute dal server');
            }

            // Aggiorniamo esplicitamente lo state con le nuove credenziali
            const newCredentials = {
                username: result.username,
                temporaryPassword: result.temporaryPassword,
                generatedAt: new Date().toISOString()
            };
            
            console.log('Setting new credentials:', newCredentials);
            setLastCredentials(newCredentials);
            
            // Aggiorniamo anche lo student object
            setStudent(prev => ({
                ...prev,
                hasCredentials: true,
                credentialsSentAt: new Date().toISOString()
            }));

            // IMPORTANTE: Prima settiamo le credenziali, poi apriamo il dialog
            setCredentials(newCredentials);
            setOpenCredentialsDialog(true);
            
            return newCredentials;
        } catch (error) {
            console.error('Error in handleGenerateCredentials:', error);
            showNotification(
                error.message || 'Errore nella generazione delle credenziali',
                'error'
            );
            throw error;
        }
    };

    // Debug per lastCredentials e credenziali studente
    useEffect(() => {
        console.log('LastCredentials state changed:', lastCredentials);
    }, [lastCredentials]);

    useEffect(() => {
        console.log('Student credentials status:', {
            hasCredentials: student.hasCredentials,
            credentialsSentAt: student.credentialsSentAt
        });
    }, [student.hasCredentials, student.credentialsSentAt]);

    // Funzione per gestire l'eliminazione dello studente
    const handleDeleteStudent = async () => {
        try {
            // Aggiungiamo il flag cascade=true per eliminare tutti i riferimenti
            await deleteStudent(student.id);
            showNotification("Studente e tutti i suoi riferimenti eliminati con successo", "success");
            // Naviga indietro alla lista studenti
            navigate("/admin/students");
        } catch (error) {
            console.error("Errore durante l'eliminazione dello studente:", error);
            showNotification("Errore durante l'eliminazione dello studente", "error");
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // Vista informativa - Corretta con keys
    const InfoView = () => {
        // Dati informativi in un array per evitare ripetizioni di codice
        const anagraphicData = [
            { id: "fullName", label: "Nome Completo", value: `${student.firstName} ${student.lastName}` },
            { id: "fiscalCode", label: "Codice Fiscale", value: student.fiscalCode || 'Non specificato', monospace: true },
            { id: "dateOfBirth", label: "Data di Nascita", value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('it-IT') : 'Non specificata' },
            { id: "gender", label: "Genere", value: student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'Non specificato' }
        ];

        const contactData = [
            { id: "email", label: "Email", value: student.email },
            { id: "parentEmail", label: "Email Genitore", value: student.parentEmail || 'Non specificata' }
        ];

        return (
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
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => setIsEditing(true)}
                            size="small"
                        >
                            Modifica
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialogOpen(true)}
                            size="small"
                        >
                            Elimina
                        </Button>
                    </Stack>
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
                                {anagraphicData.map(item => (
                                    <Box key={item.id}>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.label}
                                        </Typography>
                                        <Typography 
                                            variant="body1"
                                            sx={item.monospace ? { fontFamily: 'monospace' } : {}}
                                        >
                                            {item.value}
                                        </Typography>
                                    </Box>
                                ))}
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
                                {contactData.map(item => (
                                    <Box key={item.id}>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.label}
                                        </Typography>
                                        <Typography variant="body1">
                                            {item.value}
                                        </Typography>
                                    </Box>
                                ))}
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

                                        {/* Box di debug delle credenziali */}
                                        {lastCredentials && (
                                            <Box sx={{ 
                                                mt: 2, 
                                                p: 2, 
                                                bgcolor: 'warning.light', 
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'warning.main'
                                            }}>
                                                <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                                                    DEBUG - Ultime credenziali generate:
                                                </Typography>
                                                <Typography variant="body2" fontFamily="monospace">
                                                    Username: {lastCredentials.username}
                                                </Typography>
                                                <Typography variant="body2" fontFamily="monospace">
                                                    Password: {lastCredentials.temporaryPassword}
                                                </Typography>
                                            </Box>
                                        )}

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
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Debug Info
                                        </Typography>
                                        <Paper sx={{ 
                                            p: 2, 
                                            mt: 1,
                                            bgcolor: 'warning.light',
                                            border: '2px dashed',
                                            borderColor: 'warning.main'
                                        }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Stato LastCredentials:
                                            </Typography>
                                            <pre style={{ 
                                                whiteSpace: 'pre-wrap',
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem'
                                            }}>
                                                {JSON.stringify(lastCredentials, null, 2)}
                                            </pre>
                                            
                                            <Divider sx={{ my: 1 }} />
                                            
                                            <Typography variant="subtitle2" gutterBottom>
                                                Stato hasCredentials:
                                            </Typography>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {String(student.hasCredentials)}
                                            </Typography>
                                            
                                            {student.credentialsSentAt && (
                                                <>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Ultimo invio:
                                                    </Typography>
                                                    <Typography variant="body2" fontFamily="monospace">
                                                        {new Date(student.credentialsSentAt).toLocaleString()}
                                                    </Typography>
                                                </>
                                            )}
                                        </Paper>
                                    </Box>
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
                                                    <Typography key={teacher._id || `teacher-${teacher.firstName}-${teacher.lastName}`} variant="body1">
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
    };

    return (
        <>
            {/* Dialog di conferma eliminazione */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Conferma Eliminazione
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Sei sicuro di voler eliminare lo studente <strong>{student.firstName} {student.lastName}</strong>?
                    </DialogContentText>
                    <DialogContentText color="error">
                        Questa operazione eliminerà lo studente e tutti i riferimenti associati, inclusi i risultati dei test.
                        L'operazione non è reversibile.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleDeleteStudent}
                        color="error" 
                        variant="contained"
                    >
                        Elimina Definitivamente
                    </Button>
                </DialogActions>
            </Dialog>

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

// PropTypes per CredentialsDialog
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