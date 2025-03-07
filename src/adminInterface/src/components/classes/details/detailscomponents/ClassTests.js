// src/components/classes/details/detailscomponents/ClassTests.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Chip,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    Quiz as QuizIcon,
    Construction as ConstructionIcon,
    Info as InfoIcon,
    Assignment as AssignmentIcon,
    Check as CheckIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useTest } from '../../../../context/TestContext';

// Importa l'istanza axios condivisa dall'applicazione
import { axiosInstance } from '../../../../services/axiosConfig';

// Usa la configurazione dell'API URL dall'axiosInstance
const API_URL = 'http://localhost:5000/api/v1';

const ClassTests = ({ classData }) => {
    // Stati locali
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [testType, setTestType] = useState('CSI');
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [testsByStudent, setTestsByStudent] = useState([]);
    const [isLoadingTests, setIsLoadingTests] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Accedi al contesto dei test
    const { getTests } = useTest();

    // DEBUG: Logghiamo le props di classData per verificare la struttura
    useEffect(() => {
        console.log('ClassData props:', classData);
        console.log('API URL:', API_URL);
    }, [classData]);

    // Funzione per caricare i test assegnati alla classe
    const loadClassTests = async () => {
        // Verifichiamo che classData._id sia presente (potrebbe essere questo invece di classData.id)
        const classId = classData?._id || classData?.id;
        if (!classId) {
            console.error('ID classe non disponibile:', classData);
            setNotification({
                open: true,
                message: 'ID classe non disponibile',
                severity: 'error'
            });
            return;
        }
        
        setIsLoadingTests(true);
        try {
            // Log di debug
            console.log('Fetching tests for class:', classId);
            
            // Eseguiamo la richiesta
            const response = await axiosInstance.get(`/tests/assigned/class/${classId}`);
            console.log('API Response:', response.data);
            
            if (response.data && response.data.data && response.data.data.studentsWithTests) {
                setTestsByStudent(response.data.data.studentsWithTests);
            }
        } catch (error) {
            console.error('Errore nel caricamento dei test della classe:', error);
            setApiError(error);
            setNotification({
                open: true,
                message: 'Errore nel caricamento dei test della classe: ' + 
                    (error.response?.data?.error?.message || error.message),
                severity: 'error'
            });
        } finally {
            setIsLoadingTests(false);
        }
    };

    // Carica i test della classe al caricamento del componente
    useEffect(() => {
        if (classData?._id || classData?.id) {
            loadClassTests();
        }
    }, [classData]);

    // Gestione apertura e chiusura del dialog
    const handleOpenDialog = () => setOpenDialog(true);
    const handleCloseDialog = () => setOpenDialog(false);

    // Gestione cambiamento tipo di test
    const handleTestTypeChange = (event) => {
        setTestType(event.target.value);
    };

    // Assegnazione del test alla classe
    const handleAssignTest = async () => {
        // Otteniamo l'ID corretto
        const classId = classData?._id || classData?.id;
        if (!classId) {
            setNotification({
                open: true,
                message: 'ID classe non disponibile',
                severity: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // Debug: mostriamo cosa stiamo inviando
            console.log('Sending test assignment request:', {
                testType,
                classId
            });
            
            // Usa l'istanza axios condivisa
            const response = await axiosInstance.post('/tests/assign-to-class', {
                testType,
                classId
            });

            console.log('Response received:', response.data);

            if (response.data && response.data.data) {
                setNotification({
                    open: true,
                    message: response.data.data.message || 
                        `Test assegnato con successo a ${response.data.data.testsAssigned || 'N'} studenti`,
                    severity: 'success'
                });
                
                // Ricarica i test della classe
                await loadClassTests();
            }
            handleCloseDialog();
        } catch (error) {
            console.error('Errore nell\'assegnazione del test:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            setApiError(error);
            setNotification({
                open: true,
                message: error.response?.data?.error?.message || 
                    `Errore nell'assegnazione del test (${error.message})`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Gestione chiusura notifica
    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    // Revoca tutti i test di una classe
    const handleRevokeAllTests = async () => {
        if (!confirm('Sei sicuro di voler revocare tutti i test assegnati a questa classe?')) {
            return;
        }

        const classId = classData?._id || classData?.id;
        if (!classId) {
            setNotification({
                open: true,
                message: 'ID classe non disponibile',
                severity: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post(`/tests/class/${classId}/revoke`, {
                testType // Se vuoi revocare solo un tipo specifico di test
            });

            console.log('Response received:', response.data);

            if (response.data && response.data.data) {
                setNotification({
                    open: true,
                    message: response.data.data.message || 
                        `${response.data.data.modifiedCount} test revocati con successo`,
                    severity: 'success'
                });
                
                // Ricarica i test della classe
                await loadClassTests();
            }
        } catch (error) {
            console.error('Errore nella revoca dei test:', error);
            setApiError(error);
            setNotification({
                open: true,
                message: error.response?.data?.error?.message || 
                    `Errore nella revoca dei test (${error.message})`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Ottieni l'identificativo della classe per visualizzazione
    const classIdentifier = classData ? `${classData.year || ''}${classData.section || ''}` : '';

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <QuizIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h6">
                            Gestione Test
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AssignmentIcon />}
                            onClick={handleOpenDialog}
                            sx={{ mr: 1 }}
                        >
                            Assegna Test
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleRevokeAllTests}
                            disabled={loading}
                        >
                            Revoca Tutti
                        </Button>
                    </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    sx={{ 
                        backgroundColor: 'background.default',
                        '& .MuiAlert-message': { 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Gestione dei test per la classe {classIdentifier}
                    </Typography>
                    <Typography variant="body2">
                        Da questa sezione puoi:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        <li>Assegnare test a tutti gli studenti della classe</li>
                        <li>Visualizzare i test assegnati agli studenti</li>
                        <li>Revocare test non ancora completati</li>
                        <li>Visualizzare i risultati dei test completati</li>
                    </Box>
                </Alert>
            </Paper>

            {/* Test assegnati */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Test Assegnati
                </Typography>

                {isLoadingTests ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : testsByStudent.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Studente</TableCell>
                                    <TableCell>Test Assegnati</TableCell>
                                    <TableCell>Stato</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {testsByStudent.map((item) => (
                                    <TableRow key={item.student.id}>
                                        <TableCell>{item.student.firstName} {item.student.lastName}</TableCell>
                                        <TableCell>{item.tests.length}</TableCell>
                                        <TableCell>
                                            {item.tests.map(test => (
                                                <Chip
                                                    key={test._id}
                                                    size="small"
                                                    label={test.status}
                                                    color={
                                                        test.status === 'completed' ? 'success' :
                                                        test.status === 'in_progress' ? 'warning' :
                                                        'default'
                                                    }
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info">
                        Nessun test assegnato agli studenti di questa classe.
                    </Alert>
                )}
                
                {/* Mostra info sull'errore API se presente */}
                {apiError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Dettagli errore API:</Typography>
                        <Box component="pre" sx={{ 
                            fontSize: '0.8rem', 
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            p: 1,
                            maxHeight: '200px',
                            overflow: 'auto'
                        }}>
                            Status: {apiError.response?.status || 'N/A'}<br/>
                            URL: {apiError.config?.url || 'N/A'}<br/>
                            Message: {apiError.message || 'N/A'}<br/>
                            Response: {JSON.stringify(apiError.response?.data, null, 2) || 'N/A'}
                        </Box>
                    </Alert>
                )}
            </Paper>

            {/* Dialog per assegnare un test */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Assegna Test alla Classe</DialogTitle>
                <DialogContent sx={{ minWidth: '400px' }}>
                    <Box sx={{ my: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="test-type-label">Tipo di Test</InputLabel>
                            <Select
                                labelId="test-type-label"
                                value={testType}
                                onChange={handleTestTypeChange}
                                label="Tipo di Test"
                            >
                                <MenuItem value="CSI">CSI - Test Stili Cognitivi</MenuItem>
                                {/* Aggiungi altri tipi di test quando saranno disponibili */}
                            </Select>
                        </FormControl>

                        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                            Il test verrà assegnato a tutti gli studenti attivi della classe {classIdentifier}.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={loading}>
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleAssignTest} 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Assegna'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifica */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ClassTests;