import React, { useState, useEffect } from 'react';
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
  Zoom,
  Backdrop
} from '@mui/material';
import { AnimatePresence } from "framer-motion"; // Importiamo AnimatePresence
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
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isTabTransitioning, setIsTabTransitioning] = useState(false);
    
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
    
    // Effetto per gestire lo stato di caricamento iniziale
    useEffect(() => {
        // Consideriamo l'app come "in caricamento" se uno dei due hook sta caricando dati
        if (!assignedLoading && !completedLoading) {
            // Aggiungiamo un piccolo ritardo prima di rimuovere il loader per garantire
            // che tutto sia ben renderizzato
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
            }, 600);
            
            // Pulizia del timer
            return () => clearTimeout(timer);
        }
    }, [assignedLoading, completedLoading]);
    
    // Gestisce il cambio di tab
    const handleTabChange = (event, newValue) => {
        // Attiva lo stato di transizione quando si cambia tab
        setIsTabTransitioning(true);
        setTabValue(newValue);
        
        // Disattiva lo stato di transizione dopo un breve ritardo
        setTimeout(() => {
            setIsTabTransitioning(false);
        }, 500); // Il tempo dovrebbe corrispondere alla durata dell'animazione di transizione
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
    
    // Mostra l'indicatore di caricamento durante il caricamento iniziale
    if (isInitialLoading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                p: 3
            }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Caricamento dati in corso...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Stiamo recuperando i test associati allo studente.
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
            
            {/* Backdrop per le transizioni tra tab */}
            <Backdrop
                sx={{ 
                    color: '#fff', 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    position: 'absolute',
                    background: 'rgba(255, 255, 255, 0.7)'
                }}
                open={isTabTransitioning}
            >
                <CircularProgress color="primary" />
            </Backdrop>
            
            {/* Contenuto dei tab */}
            <Box sx={{ 
                flex: 1, 
                display: 'flex',
                gap: 3,
                overflow: 'hidden',
                pt: 2,
                position: 'relative' // Necessario per il posizionamento assoluto del Backdrop
            }}>
                {/* Utilizziamo AnimatePresence con mode="sync" */}
                <AnimatePresence mode="sync">
                    {/* Tab dei test assegnati */}
                    {tabValue === 0 && (
                        <Fade key="assigned-tab" in={tabValue === 0} timeout={300}>
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
                        <Fade key="completed-tab" in={tabValue === 1} timeout={300}>
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
                                            <AnimatePresence mode="wait">
                                                <Zoom key="zoom-icon" in={true} timeout={500}>
                                                    <CheckCircleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                                </Zoom>
                                            </AnimatePresence>
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
                </AnimatePresence>
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
                disableRestoreFocus  // Evita problemi di focus dopo la chiusura
                keepMounted={false}  // Assicura lo smontaggio completo del Dialog quando chiuso
                TransitionProps={{   // Migliora la gestione delle transizioni
                    onExited: () => {
                        // Reset dello stato dopo che la transizione di uscita è completata
                        if (!revokeDialogOpen) {
                            setTestToRevoke(null);
                        }
                    }
                }}
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