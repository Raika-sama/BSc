import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button, 
  Fade,
  Typography,
  Zoom
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompletedTestsList from '../../studentTests/components/CompletedTestsList';
import TestResultsView from '../../studentTests/components/TestResultsView';
import { useStudentTest } from '../../studentTests/hooks/useStudentTest';
import AssignedTestsList from '../../studentTests/components/AssignedTestsList';
import AssignTestDialog from '../../studentTests/components/AssignTestDialog';
import AssignedTestDetails from '../../studentTests/components/AssignedTestDetails';
import { useNotification } from '../../../../context/NotificationContext';
import { useAssignedTests } from '../../studentTests/hooks/useAssignedTests';

/**
 * Componente per la gestione dei test di uno studente
 * @param {Object} props - Props del componente
 * @param {Object} props.student - Dati dello studente
 */
const TestsTab = ({ student }) => {
    // Stati per gestire la navigazione tra tab
    const [tabValue, setTabValue] = useState(0);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [testToRevoke, setTestToRevoke] = useState(null);
    
    const { showNotification } = useNotification();
    
    // Utilizziamo il custom hook per gestire i test assegnati
    const {
        loading: assignedLoading,
        error: assignedError,
        assignedTests,
        selectedTest: selectedAssignedTest,
        handleTestSelect: handleAssignedTestSelect,
        revokeTest,
        refreshTests: refreshAssignedTests
    } = useAssignedTests(student?._id);
    
    // Hook personalizzato per i test completati
    const {
        loading: completedLoading,
        error: completedError,
        completedTests,
        selectedTest: selectedCompletedTest,
        handleTestSelect: handleCompletedTestSelect,
    } = useStudentTest(student?._id);
    
    // Gestisce il cambio di tab
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    // Gestisce l'apertura del dialogo di assegnazione
    const handleOpenAssignDialog = () => {
        setAssignDialogOpen(true);
    };
    
    // Gestisce l'assegnazione di un nuovo test
    const handleTestAssigned = (newTest) => {
        showNotification('Test assegnato con successo!', 'success');
        refreshAssignedTests(); // Ricarica i test assegnati
        setTabValue(0); // Torna al tab dei test assegnati
    };
    
    // Gestisce l'apertura del dialogo di revoca
    const handleRevokeTest = (testId) => {
        setTestToRevoke(testId);
        setRevokeDialogOpen(true);
    };
    
    // Conferma la revoca del test
    const confirmRevokeTest = async () => {
        if (!testToRevoke) return;
        
        const success = await revokeTest(testToRevoke);
        if (success) {
            // Chiudi il dialogo di revoca
            setRevokeDialogOpen(false);
            setTestToRevoke(null);
        }
    };
    
    // Calcola lo stato totale dei test per il badge
    const getTestsStats = () => {
        return {
            pending: assignedTests.filter(t => t.status === 'pending').length,
            inProgress: assignedTests.filter(t => t.status === 'in_progress').length,
            completed: completedTests.length
        };
    };
    
    const stats = getTestsStats();
    
    if (!student) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
                <Typography variant="h6" color="text.secondary">
                    Seleziona uno studente per visualizzare i test
                </Typography>
            </Box>
        );
    }
    
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
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab 
                        icon={<AssignmentIcon />} 
                        label={`Test Assegnati${stats.pending + stats.inProgress > 0 ? ` (${stats.pending + stats.inProgress})` : ''}`}
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<CheckCircleIcon />} 
                        label={`Test Completati${stats.completed > 0 ? ` (${stats.completed})` : ''}`}
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
                    <Fade in={tabValue === 0} timeout={300}>
                        <Box sx={{ 
                            display: 'flex', 
                            width: '100%', 
                            gap: 3,
                            height: '100%'
                        }}>
                            {/* Lista dei test assegnati */}
                            <Paper 
                                sx={{ 
                                    width: '320px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2
                                }}
                                elevation={2}
                            >
                                <AssignedTestsList 
                                    tests={assignedTests}
                                    selectedTest={selectedAssignedTest}
                                    onTestSelect={handleAssignedTestSelect}
                                    onAssignNewTest={handleOpenAssignDialog}
                                    loading={assignedLoading}
                                />
                            </Paper>
                            
                            {/* Area dettagli test assegnato */}
                            <Paper 
                                sx={{ 
                                    flex: 1,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2
                                }}
                                elevation={2}
                            >
                                <AssignedTestDetails 
                                    test={selectedAssignedTest}
                                    onRevokeTest={handleRevokeTest}
                                    loading={assignedLoading}
                                />
                            </Paper>
                        </Box>
                    </Fade>
                )}
                
                {/* Tab dei test completati */}
                {tabValue === 1 && (
                    <Fade in={tabValue === 1} timeout={300}>
                        <Box sx={{ 
                            display: 'flex', 
                            width: '100%', 
                            gap: 3,
                            height: '100%'
                        }}>
                            {/* Lista dei test completati */}
                            <Paper 
                                sx={{ 
                                    width: '320px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2
                                }}
                                elevation={2}
                            >
                                <CompletedTestsList 
                                    tests={completedTests}
                                    selectedTest={selectedCompletedTest}
                                    onTestSelect={handleCompletedTestSelect}
                                    onCreateTest={handleOpenAssignDialog}
                                    loading={completedLoading}
                                />
                            </Paper>
                            
                            {/* Visualizzazione risultati */}
                            <Paper 
                                sx={{ 
                                    flex: 1,
                                    overflow: 'hidden',
                                    borderRadius: 2
                                }}
                                elevation={2}
                            >
                                {completedLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : completedError ? (
                                    <Alert severity="error" sx={{ m: 3 }}>{completedError}</Alert>
                                ) : selectedCompletedTest ? (
                                    <TestResultsView 
                                        test={selectedCompletedTest}
                                    />
                                ) : (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        justifyContent: 'center', 
                                        alignItems: 'center', 
                                        height: '100%', 
                                        p: 3, 
                                        textAlign: 'center' 
                                    }}>
                                        <Zoom in={true} timeout={500}>
                                            <CheckCircleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                        </Zoom>
                                        <Typography variant="h6" gutterBottom>
                                            Nessun test selezionato
                                        </Typography>
                                        <Typography variant="body2">
                                            Seleziona un test completato dalla lista per visualizzarne i risultati.
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    </Fade>
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