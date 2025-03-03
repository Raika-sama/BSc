import React, { useState, useEffect } from 'react';
import { Box, Paper, Tabs, Tab, Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompletedTestsList from '../../studentTests/components/CompletedTestsList';
import TestResultsView from '../../studentTests/components/TestResultsView';
import { useStudentTest } from '../../studentTests/hooks/useStudentTest';
import AssignedTestsList from '../../studentTests/components/AssignedTestsList';
import AssignTestDialog from '../../studentTests/components/AssignTestDialog';
import AssignedTestDetails from '../../studentTests/components/AssignedTestDetails';
import { useNotification } from '../../../../context/NotificationContext';
import { axiosInstance } from '../../../../services/axiosConfig';

const TestsTab = ({ student }) => {
    // Stati per gestire i test, le selezioni e il loading
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignedTests, setAssignedTests] = useState([]);
    const [selectedAssignedTest, setSelectedAssignedTest] = useState(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [testToRevoke, setTestToRevoke] = useState(null);
    
    const { showNotification } = useNotification();
    
    // Hook personalizzato per i test completati
    const {
        completedTests,
        selectedTest,
        handleTestSelect: handleCompletedTestSelect,
    } = useStudentTest(student?._id);
    
    // Carica i test assegnati all'apertura o quando cambia lo studente
    useEffect(() => {
        if (student && student._id) {
            fetchAssignedTests();
        }
    }, [student]);
    
    // Carica i test assegnati allo studente
    const fetchAssignedTests = async () => {
        if (!student || !student._id) return;
        
        setLoading(true);
        setError(null);
        
        try {
            console.debug('Fetching assigned tests for student:', {
                studentId: student._id
            });
            
            const response = await axiosInstance.get(`/tests/assigned/student/${student._id}`);
            console.debug('Server response:', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data,
                responseData: response.data
            });
            
            // Assicuriamoci che testsArray sia sempre un array
            let testsArray = [];
            if (response.data?.data) {
                testsArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            }
            
            console.debug('Extracted tests array:', {
                isArray: Array.isArray(testsArray),
                length: testsArray.length,
                firstTest: testsArray[0]
            });
            
            // Filtra i test che sono assegnati ma non completati
            const assignedNotCompleted = testsArray.filter(
                test => test.status !== 'completed'
            );
            
            console.debug('Filtered non-completed tests:', {
                total: testsArray.length,
                nonCompletati: assignedNotCompleted.length,
                firstTestNonCompletato: assignedNotCompleted[0]
            });
            
            setAssignedTests(assignedNotCompleted);
            
            // Seleziona il primo test se esiste e nessuno è già selezionato
            if (assignedNotCompleted.length > 0 && !selectedAssignedTest) {
                setSelectedAssignedTest(assignedNotCompleted[0]);
            }
        } catch (error) {
            console.error('Error fetching assigned tests:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            setError('Impossibile caricare i test assegnati.');
            showNotification(
                'Errore nel caricamento dei test assegnati: ' + 
                (error.response?.data?.error?.message || error.message),
                'error'
            );
        } finally {
            setLoading(false);
        }
    };
    
    // Gestisce il cambio di tab
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    // Gestisce la selezione di un test assegnato
    const handleAssignedTestSelect = (test) => {
        setSelectedAssignedTest(test);
    };
    
    // Gestisce l'apertura del dialogo di assegnazione
    const handleOpenAssignDialog = () => {
        setAssignDialogOpen(true);
    };
    
    // Gestisce l'assegnazione di un nuovo test
    const handleTestAssigned = (newTest) => {
        showNotification('Test assegnato con successo!', 'success');
        fetchAssignedTests(); // Ricarica i test assegnati
    };
    
    // Gestisce l'apertura del dialogo di revoca
    const handleRevokeTest = (testId) => {
        setTestToRevoke(testId);
        setRevokeDialogOpen(true);
    };
    
    // Conferma la revoca del test
    const confirmRevokeTest = async () => {
        if (!testToRevoke) return;
        
        setLoading(true);
        try {
            const response = await axiosInstance.post(`/tests/${testToRevoke}/revoke`);
            if (response.data && response.data.status === 'success') {
                showNotification('Test revocato con successo!', 'success');
                
                // Aggiorna la lista dei test
                fetchAssignedTests();
                
                // Reimposta il test selezionato se è stato revocato
                if (selectedAssignedTest && selectedAssignedTest._id === testToRevoke) {
                    setSelectedAssignedTest(null);
                }
            }
        } catch (error) {
            console.error('Errore nella revoca del test:', error);
            showNotification(
                'Errore nella revoca del test: ' + 
                (error.response?.data?.message || error.message),
                'error'
            );
        } finally {
            setLoading(false);
            setRevokeDialogOpen(false);
            setTestToRevoke(null);
        }
    };
    
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
            }}
        >
            {/* Tabs di navigazione */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    aria-label="test management tabs"
                >
                    <Tab 
                        icon={<AssignmentIcon />} 
                        label="Test Assegnati" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<CheckCircleIcon />} 
                        label="Test Completati" 
                        iconPosition="start"
                    />
                </Tabs>
            </Box>
            
            {/* Contenuto dei tab */}
            <Box sx={{ 
                flex: 1, 
                display: 'flex',
                gap: 3,
                overflow: 'hidden',
                pt: 2
            }}>
                {/* Tab dei test assegnati */}
                {tabValue === 0 && (
                    <>
                        {/* Lista dei test assegnati */}
                        <Paper 
                            sx={{ 
                                width: '250px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <AssignedTestsList 
                                tests={assignedTests}
                                selectedTest={selectedAssignedTest}
                                onTestSelect={handleAssignedTestSelect}
                                onAssignNewTest={handleOpenAssignDialog}
                                loading={loading}
                            />
                        </Paper>
                        
                        {/* Area dettagli test assegnato */}
                        <Paper 
                            sx={{ 
                                flex: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: 3
                            }}
                        >
                            {loading ? (
                                <CircularProgress />
                            ) : error ? (
                                <Alert severity="error">{error}</Alert>
                            ) : selectedAssignedTest ? (
                                <AssignedTestDetails 
                                    test={selectedAssignedTest}
                                    onRevokeTest={handleRevokeTest}
                                />
                            ) : (
                                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                    {assignedTests.length === 0 ? (
                                        <p>Nessun test assegnato. Clicca su "Assegna Nuovo Test" per iniziare.</p>
                                    ) : (
                                        <p>Seleziona un test dalla lista per visualizzarne i dettagli.</p>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </>
                )}
                
                {/* Tab dei test completati */}
                {tabValue === 1 && (
                    <>
                        {/* Lista dei test completati */}
                        <Paper 
                            sx={{ 
                                width: '250px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <CompletedTestsList 
                                tests={completedTests}
                                selectedTest={selectedTest}
                                onTestSelect={handleCompletedTestSelect}
                                onCreateTest={handleOpenAssignDialog}
                            />
                        </Paper>
                        
                        {/* Visualizzazione risultati */}
                        <Paper 
                            sx={{ 
                                flex: 1,
                                overflow: 'hidden'
                            }}
                        >
                            <TestResultsView 
                                test={selectedTest}
                            />
                        </Paper>
                    </>
                )}
            </Box>
            
            {/* Dialog per assegnare un nuovo test */}
            <AssignTestDialog 
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                studentId={student?._id}
                onTestAssigned={handleTestAssigned}
            />
            
            {/* Dialog per confermare la revoca del test */}
            <Dialog
                open={revokeDialogOpen}
                onClose={() => setRevokeDialogOpen(false)}
            >
                <DialogTitle>Conferma revoca test</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Sei sicuro di voler revocare questo test? Questa azione non può essere annullata.
                        Lo studente non potrà più accedere a questo test.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRevokeDialogOpen(false)}>Annulla</Button>
                    <Button 
                        onClick={confirmRevokeTest} 
                        color="error" 
                        variant="contained"
                    >
                        Conferma revoca
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TestsTab;