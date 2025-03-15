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
    TableRow,
    Grid,
    Tab,
    Tabs
} from '@mui/material';
import {
    Quiz as QuizIcon,
    Construction as ConstructionIcon,
    Info as InfoIcon,
    Assignment as AssignmentIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    ViewList as ViewListIcon
} from '@mui/icons-material';
import { useTest } from '../../../../context/TestContext';
import { axiosInstance } from '../../../../services/axiosConfig';
import ClassTestAggregateView from './ClassTestAggregateView';

// Componente TabPanel per gestire i contenuti delle tab
const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`class-test-tabpanel-${index}`}
        aria-labelledby={`class-test-tab-${index}`}
        {...other}
    >
        {value === index && (
            <Box sx={{ pt: 2 }}>
                {children}
            </Box>
        )}
    </div>
);

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
    const [activeTab, setActiveTab] = useState(0);
    const [aggregatedResults, setAggregatedResults] = useState(null);
    const [isLoadingAggregated, setIsLoadingAggregated] = useState(false);

    // Accedi al contesto dei test
    const { getTests } = useTest();

    // DEBUG: Logghiamo le props di classData per verificare la struttura
    useEffect(() => {
        console.log('ClassData props:', classData);
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

    // Funzione per caricare i risultati aggregati dei test
    const loadAggregatedResults = async () => {
        const classId = classData?._id || classData?.id;
        if (!classId) return;

        setIsLoadingAggregated(true);
        try {
            // Richiesta per ottenere i dati aggregati dei test
            const response = await axiosInstance.get(`/classes/${classId}/tests-aggregation`, {
                params: { 
                    testType: testType
                }
            });
            console.log('Aggregated results:', response.data);
            
            if (response.data && response.data.data) {
                // Verifica se ci sono test completati o se c'è un messaggio di errore
                if (response.data.data.totalCompletedTests > 0) {
                    // Abbiamo dati validi da visualizzare
                    setAggregatedResults(response.data.data);
                } else {
                    // Non ci sono test completati, impostiamo aggregatedResults a null
                    setAggregatedResults(null);
                    // Facoltativamente, possiamo mostrare un messaggio di notifica
                    if (response.data.data.message) {
                        setNotification({
                            open: true,
                            message: response.data.data.message,
                            severity: 'info'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Errore nel caricamento dei risultati aggregati:', error);
            setAggregatedResults(null);
            setNotification({
                open: true,
                message: 'Errore nel caricamento dei risultati aggregati: ' + 
                    (error.response?.data?.error?.message || error.message),
                severity: 'error'
            });
        } finally {
            setIsLoadingAggregated(false);
        }
    };

    // Carica i test della classe al caricamento del componente
    useEffect(() => {
        if (classData?._id || classData?.id) {
            loadClassTests();
            loadAggregatedResults();
        }
    }, [classData]);

    // Gestione apertura e chiusura del dialog
    const handleOpenDialog = () => setOpenDialog(true);
    const handleCloseDialog = () => setOpenDialog(false);

    // Gestione cambiamento tipo di test
    const handleTestTypeChange = (event) => {
        setTestType(event.target.value);
    };

    // Gestione cambio tab
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
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
                await loadAggregatedResults();
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

    // Calcolo statistica completamento test
    const calculateCompletionStats = () => {
        if (!testsByStudent.length) return { total: 0, completed: 0, pending: 0, inProgress: 0 };
        
        const stats = { total: 0, completed: 0, pending: 0, inProgress: 0 };
        
        testsByStudent.forEach(student => {
            student.tests.forEach(test => {
                stats.total++;
                if (test.status === 'completed') stats.completed++;
                else if (test.status === 'in_progress') stats.inProgress++;
                else stats.pending++;
            });
        });
        
        return stats;
    };

    // Ottieni l'identificativo della classe per visualizzazione
    const classIdentifier = classData ? `${classData.year || ''}${classData.section || ''}` : '';
    const completionStats = calculateCompletionStats();

    // Determina se dovrebbe mostrare un avviso sulla tab di analisi
    const showCompletedTestsWarning = activeTab === 1 && completionStats.completed === 0;

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
                
                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ my: 2 }}>
                    <Grid item xs={12} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2, 
                                bgcolor: 'background.default',
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Totale Test
                            </Typography>
                            <Typography variant="h5" color="primary.main" gutterBottom>
                                {completionStats.total}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Test assegnati alla classe
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2, 
                                bgcolor: 'background.default',
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Test Completati
                            </Typography>
                            <Typography variant="h5" color="success.main" gutterBottom>
                                {completionStats.completed}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {completionStats.total ? 
                                  `${Math.round((completionStats.completed / completionStats.total) * 100)}% del totale` : 
                                  'Nessun test assegnato'}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2, 
                                bgcolor: 'background.default',
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                In Corso
                            </Typography>
                            <Typography variant="h5" color="warning.main" gutterBottom>
                                {completionStats.inProgress}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Test non completati
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2, 
                                bgcolor: 'background.default',
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                In Attesa
                            </Typography>
                            <Typography variant="h5" color="text.secondary" gutterBottom>
                                {completionStats.pending}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Test non ancora iniziati
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
                
               
            </Paper>

            {/* Tab Navigation */}
            <Paper 
                elevation={0} 
                sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider'
                    }}
                >
                    <Tab 
                        icon={<ViewListIcon />} 
                        label="Dettaglio Test" 
                        iconPosition="start" 
                    />
                    <Tab 
                        icon={<BarChartIcon />} 
                        label="Analisi Classe" 
                        iconPosition="start" 
                    />
                </Tabs>

                {/* Tab Panels */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ p: 2 }}>
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
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    {isLoadingAggregated ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : aggregatedResults && aggregatedResults.totalCompletedTests > 0 ? (
                        <ClassTestAggregateView 
                            data={aggregatedResults}
                            classData={classData}
                        />
                    ) : (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Alert 
                                severity="info" 
                                variant="outlined"
                                sx={{ 
                                    width: '100%', 
                                    mb: 3,
                                    '& .MuiAlert-message': { width: '100%' }
                                }}
                            >
                                <Typography variant="h6" gutterBottom align="center">
                                    Non ci sono dati di analisi disponibili
                                </Typography>
                                <Typography variant="body1" paragraph align="center">
                                    {aggregatedResults?.message || 'Non ci sono ancora test completati per questa classe.'}
                                </Typography>
                                <Typography variant="body2" align="center">
                                    L'analisi sarà disponibile quando almeno uno studente completerà un test.
                                </Typography>
                            </Alert>
                            
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleOpenDialog}
                                startIcon={<AssignmentIcon />}
                                sx={{ mt: 2 }}
                            >
                                Assegna test agli studenti
                            </Button>
                        </Box>
                    )}
                </TabPanel>
            </Paper>

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