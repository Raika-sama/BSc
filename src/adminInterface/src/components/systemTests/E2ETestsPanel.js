import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { 
  PlayArrow as RunIcon, 
  CheckCircle as PassIcon, 
  Cancel as FailIcon, 
  Schedule as PendingIcon,
  Visibility as ViewIcon,
  Videocam as VideoIcon
} from '@mui/icons-material';

// Dati di esempio per i test E2E
const generateMockTests = () => {
  const flows = ['Login', 'Registrazione', 'Creazione Test', 'Inserimento Studenti', 'Gestione Classi', 'Reportistica'];
  const environments = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `e2e-test-${i + 1}`,
    name: `Test E2E ${i + 1}`,
    description: `Test end-to-end del flusso di ${flows[i % flows.length]}`,
    flow: flows[i % flows.length],
    browser: environments[Math.floor(Math.random() * environments.length)],
    status: ['passed', 'failed', 'pending'][Math.floor(Math.random() * 3)],
    lastExecuted: i % 3 === 0 ? null : new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    duration: Math.floor(Math.random() * 5000) + 1000,
    steps: Math.floor(Math.random() * 10) + 5,
    hasVideo: Math.random() > 0.3,
    hasScreenshots: Math.random() > 0.2
  }));
};

const E2ETestsPanel = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [runningTestId, setRunningTestId] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('Tutti');
  const [isVideoDialogOpen, setVideoDialogOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);

  // Simula il caricamento dei dati
  useEffect(() => {
    const fetchTests = async () => {
      try {
        // In produzione, questo sarà sostituito con una vera chiamata API
        // const response = await api.getE2ETests();
        // setTests(response.data);
        setTimeout(() => {
          setTests(generateMockTests());
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Errore nel caricamento dei test end-to-end');
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Simula l'avanzamento del test quando un test è in esecuzione
  useEffect(() => {
    let progressTimer;
    let logTimer;
    const logMessages = [
      'Avvio del browser...',
      'Browser avviato',
      'Navigazione alla pagina di test...',
      'Compilazione form di login...',
      'Invio credenziali...',
      'Verifica redirezione...',
      'Controllo elementi della dashboard...',
      'Navigazione alla sezione target...',
      'Esecuzione azioni test...',
      'Validazione risultati...',
      'Test completato',
      'Chiusura browser'
    ];

    if (runningTestId) {
      setTestProgress(0);
      setTestLogs([]);
      
      // Simula l'avanzamento progressivo
      progressTimer = setInterval(() => {
        setTestProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + Math.floor(Math.random() * 10) + 3;
        });
      }, 500);

      // Simula i log del test
      let logIndex = 0;
      logTimer = setInterval(() => {
        if (logIndex < logMessages.length) {
          setTestLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            message: logMessages[logIndex]
          }]);
          logIndex++;
        } else {
          clearInterval(logTimer);
        }
      }, 1000);
    }

    return () => {
      clearInterval(progressTimer);
      clearInterval(logTimer);
    };
  }, [runningTestId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRunTest = async (testId) => {
    setRunningTestId(testId);
    setCurrentTest(tests.find(test => test.id === testId));
    setVideoDialogOpen(true);
    
    try {
      // Modifica: Usa POST invece di GET
      // In produzione: await api.runE2ETest(testId);
      // Simula l'esecuzione di un test E2E
      await new Promise(resolve => setTimeout(resolve, 10000)); // Più lungo per simulare un test E2E
      
      // Aggiorna lo stato del test nella lista
      setTests(prevTests => prevTests.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: Math.random() > 0.2 ? 'passed' : 'failed',
              lastExecuted: new Date().toISOString(),
              duration: Math.floor(Math.random() * 5000) + 1000,
              hasVideo: true
            } 
          : test
      ));
    } catch (err) {
      setError(`Errore nell'esecuzione del test ${testId}`);
    } finally {
      setRunningTestId(null);
      // Non chiudiamo automaticamente la dialog per permettere all'utente di visualizzare il risultato
    }
  };
  
  const handleRunAllE2ETests = async () => {
    setLoading(true);
    
    try {
      // Modifica: Usa POST invece di GET
      // In produzione: await api.runAllE2ETests();
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Aggiorna tutti i test con nuovi stati
      setTests(prevTests => prevTests.map(test => ({
        ...test,
        status: Math.random() > 0.15 ? 'passed' : 'failed',
        lastExecuted: new Date().toISOString(),
        duration: Math.floor(Math.random() * 5000) + 1000,
        hasVideo: true
      })));
    } catch (err) {
      setError('Errore nell\'esecuzione di tutti i test end-to-end');
    } finally {
      setLoading(false);
    }
  };



  const handleShowVideo = (test) => {
    setCurrentTest(test);
    setVideoDialogOpen(true);
  };

  const handleCloseVideoDialog = () => {
    setVideoDialogOpen(false);
    setCurrentTest(null);
    setTestProgress(0);
    setTestLogs([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Mai eseguito';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT');
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'passed':
        return <Chip icon={<PassIcon />} label="Passato" color="success" size="small" />;
      case 'failed':
        return <Chip icon={<FailIcon />} label="Fallito" color="error" size="small" />;
      case 'pending':
        return <Chip icon={<PendingIcon />} label="In attesa" color="warning" size="small" />;
      default:
        return <Chip label="Sconosciuto" color="default" size="small" />;
    }
  };

  // Filtra i test in base al browser selezionato
  const filteredTests = selectedEnvironment === 'Tutti' 
    ? tests 
    : tests.filter(test => test.browser === selectedEnvironment);

  // Calcola la lista di tutti i browser disponibili
  const environments = ['Tutti', ...Array.from(new Set(tests.map(test => test.browser)))];

  if (loading && tests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && tests.length === 0) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Test End-to-End</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
          onClick={handleRunAllE2ETests}
          disabled={loading}
        >
          Esegui Tutti i Test E2E
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {environments.map(env => (
          <Chip
            key={env}
            label={env}
            color={selectedEnvironment === env ? 'primary' : 'default'}
            onClick={() => setSelectedEnvironment(env)}
            clickable
          />
        ))}
      </Box>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tabella test end-to-end">
          <TableHead>
            <TableRow>
              <TableCell>Nome Test</TableCell>
              <TableCell>Flusso</TableCell>
              <TableCell>Browser</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Ultima Esecuzione</TableCell>
              <TableCell>Durata (ms)</TableCell>
              <TableCell>Steps</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? filteredTests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : filteredTests
            ).map((test) => (
              <TableRow key={test.id} hover>
                <TableCell component="th" scope="row">
                  {test.name}
                </TableCell>
                <TableCell>{test.flow}</TableCell>
                <TableCell>
                  <Chip label={test.browser} size="small" />
                </TableCell>
                <TableCell>{renderStatus(test.status)}</TableCell>
                <TableCell>{formatDate(test.lastExecuted)}</TableCell>
                <TableCell>{test.lastExecuted ? test.duration : '-'}</TableCell>
                <TableCell>{test.steps}</TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="primary" 
                    onClick={() => handleRunTest(test.id)}
                    disabled={!!runningTestId}
                  >
                    {runningTestId === test.id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <RunIcon fontSize="small" />
                    )}
                  </IconButton>
                  {test.hasVideo && (
                    <Tooltip title="Visualizza registrazione">
                      <IconButton 
                        color="secondary" 
                        onClick={() => handleShowVideo(test)}
                      >
                        <VideoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton color="info">
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>

      {/* Dialog per mostrare video del test e avanzamento */}
      <Dialog
        open={isVideoDialogOpen}
        onClose={handleCloseVideoDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentTest ? (
            runningTestId ? `Esecuzione di ${currentTest.name}` : `Test: ${currentTest.name}`
          ) : 'Dettaglio Test'}
        </DialogTitle>
        <DialogContent>
          {currentTest && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {currentTest.description}
              </Typography>
              
              {runningTestId && (
                <Box sx={{ mt: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress variant="determinate" value={testProgress} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">{`${Math.round(testProgress)}%`}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {testProgress < 100 ? 'Esecuzione in corso...' : 'Completato'}
                  </Typography>
                </Box>
              )}

              {/* Area di visualizzazione del video o screenshot */}
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  bgcolor: 'black',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                {runningTestId ? (
                  <Typography color="white">
                    {testProgress < 100 ? 'Test in esecuzione...' : 'Test completato'}
                  </Typography>
                ) : (
                  <Typography color="white">
                    {currentTest.hasVideo ? 'Registrazione disponibile' : 'Nessuna registrazione disponibile'}
                  </Typography>
                )}
              </Box>

              {/* Log del test */}
              <Typography variant="subtitle2" gutterBottom>Log del test:</Typography>
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  bgcolor: '#f5f5f5',
                  fontFamily: 'monospace'
                }}
              >
                {testLogs.map((log, index) => (
                  <Box key={index} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      [{log.time}]
                    </Typography>
                    <Typography variant="body2" component="span">
                      {log.message}
                    </Typography>
                  </Box>
                ))}
                {testLogs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Nessun log disponibile
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVideoDialog} color="primary">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default E2ETestsPanel;