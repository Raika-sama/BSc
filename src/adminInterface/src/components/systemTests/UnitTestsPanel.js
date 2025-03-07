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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Divider,
  Badge,
  ListItemText,
  ListItem,
  List
} from '@mui/material';
import { 
  PlayArrow as RunIcon, 
  CheckCircle as PassIcon, 
  Cancel as FailIcon, 
  Schedule as PendingIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  CheckCircle,
  Subject,
  AccessTime as TimeIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime
} from '@mui/icons-material';
import testSystemService from '../../services/testsSystemService';

// Componente per visualizzare la durata formattata
const DurationDisplay = ({ milliseconds }) => {
  if (!milliseconds && milliseconds !== 0) return <span>-</span>;
  
  // Format the duration in a readable way
  if (milliseconds < 1000) {
    return <span>{milliseconds} ms</span>;
  } else {
    const seconds = (milliseconds / 1000).toFixed(2);
    return <span>{seconds} s</span>;
  }
};

// Componente per visualizzare un output formattato
const TestOutput = ({ output }) => {
  if (!output) return <Typography color="text.secondary">Nessun output disponibile</Typography>;
  
  // Split the output by newlines and render each line
  const lines = output.split('\n');
  
  // Process console output to group and enhance visualization
  const processedOutput = lines.map((line, index) => {
    // Apply colors based on the content of the line
    let color = 'text.primary';
    let fontWeight = 'normal';
    let bgcolor = 'transparent';
    
    // Test results
    if (line.includes('PASS')) {
      color = 'success.main';
      bgcolor = 'success.lightest';
      fontWeight = 'bold';
    } else if (line.includes('FAIL')) {
      color = 'error.main';
      bgcolor = 'error.lightest';
      fontWeight = 'bold';
    }
    
    // Console messages
    if (line.includes('console.log')) {
      color = 'info.main';
    } else if (line.includes('console.error')) {
      color = 'error.main';
    } else if (line.includes('console.warn')) {
      color = 'warning.main';
    }
    
    // Error details
    if (line.includes('Error:') || line.includes('Exception:')) {
      color = 'error.main';
      fontWeight = 'bold';
    }
    
    return (
      <Typography 
        key={index} 
        color={color} 
        sx={{ 
          fontFamily: 'monospace', 
          fontSize: '0.85rem', 
          fontWeight, 
          bgcolor,
          px: bgcolor !== 'transparent' ? 1 : 0,
          py: bgcolor !== 'transparent' ? 0.5 : 0,
          lineHeight: 1.5,
          borderRadius: 1
        }}
      >
        {line || ' '}
      </Typography>
    );
  });
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        maxHeight: '500px', 
        overflowY: 'auto', 
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0'
      }}
    >
      {processedOutput}
    </Paper>
  );
};

// Componente per visualizzare le statistiche di un test
// Componente TestStats completo da sostituire nel tuo file
const TestStats = ({ result }) => {
  if (!result) return null;
  
  console.log('TestStats riceve:', result);
  
  // Normalizzazione dei dati per garantire compatibilità
  const passed = result.passed !== undefined ? result.passed : result.passedTests || 0;
  const failed = result.failed !== undefined ? result.failed : result.failedTests || 0;
  const total = result.total !== undefined ? result.total : (result.totalTests || passed + failed || 0);
  
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  
  // Colors for the progress bar
  let progressColor = "error.main";
  if (passRate >= 90) progressColor = "success.main";
  else if (passRate >= 75) progressColor = "primary.main";
  else if (passRate >= 50) progressColor = "warning.main";
  
  console.log('Stats con dati normalizzati:', { passed, failed, total, passRate }); // Debug
  
  return (
    <Card sx={{ mb: 3 }} variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="h6" color="primary" gutterBottom>Dettagli Test</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary" 
                  sx={{ 
                    maxWidth: '300px', 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {result.file || result.testPath || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Durata: <DurationDisplay milliseconds={
                    result.duration && result.duration < 10 ? 
                      result.duration * 1000 : // Se in secondi, converti in ms
                      result.duration || 0
                  } />
                </Typography>
              </Box>

              {result.executedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="action" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Eseguito: {new Date(result.executedAt).toLocaleString('it-IT')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">Totali</Typography>
                    <Typography variant="h4">{total}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'success.lightest' }}>
                    <Typography variant="subtitle2" color="success.main">Passati</Typography>
                    <Typography variant="h4" color="success.main">{passed}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: failed > 0 ? 'error.lightest' : 'inherit' }}>
                    <Typography variant="subtitle2" color="error.main">Falliti</Typography>
                    <Typography variant="h4" color="error.main">{failed}</Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Percentuale di successo</Typography>
                      <Typography variant="body2" fontWeight="bold">{passRate.toFixed(1)}%</Typography>
                    </Box>
                    <Box sx={{ mt: 1, position: 'relative' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={passRate} 
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: progressColor,
                            borderRadius: 5
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Componente per visualizzare i risultati dettagliati di un test
const TestDetailsList = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Nessun risultato dettagliato disponibile
      </Alert>
    );
  }

  console.log('Dettaglio risultati test:', results); // Debug

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {results.map((result, index) => (
        <Paper
          key={index}
          elevation={0}
          variant="outlined"
          sx={{
            mb: 1,
            p: 1,
            bgcolor: result.status === 'failed' ? 'error.lightest' : 'success.lightest',
            borderColor: result.status === 'failed' ? 'error.light' : 'success.light'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              {result.status === 'passed' ? (
                <PassIcon color="success" fontSize="small" />
              ) : result.status === 'failed' ? (
                <FailIcon color="error" fontSize="small" />
              ) : (
                <PendingIcon color="warning" fontSize="small" />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'medium',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {result.name || 'Test senza nome'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {result.file && (
                <Tooltip title={`File: ${result.file}`}>
                  <Chip
                    label={result.file.split('/').pop()}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Tooltip>
              )}
              {result.duration !== undefined && (
                <Chip
                  label={`${result.duration} ms`}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              )}
            </Box>
          </Box>
          
          {result.message && (
            <Box sx={{ mt: 1, pl: 4 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: result.status === 'failed' ? 'error.main' : 'text.secondary',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  p: 1,
                  border: result.status === 'failed' ? '1px dashed' : 'none',
                  borderColor: 'error.light',
                  borderRadius: 1,
                  bgcolor: result.status === 'failed' ? 'rgba(255, 0, 0, 0.03)' : 'transparent'
                }}
              >
                {result.message}
              </Typography>
            </Box>
          )}
        </Paper>
      ))}
    </List>
  );
};

// Funzione helper per i log nel frontend
const DEBUG = true;
const logDebug = (message, ...data) => {
  if (DEBUG) {
    console.log(`[UnitTestsPanel] ${message}`, ...data);
  }
};

const UnitTestsPanel = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [runningTestId, setRunningTestId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [dialogTab, setDialogTab] = useState(0);
  const [testResults, setTestResults] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  // Carica i test unitari dal backend
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testSystemService.getUnitTests();
      
      // Semplifichiamo l'accesso ai dati rimuovendo le condizioni complesse
      let testData = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        testData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        testData = response.data;
      } else {
        console.warn('Struttura dati non riconosciuta:', response);
        // Fallback: se abbiamo un oggetto invece che un array
        testData = response.data && typeof response.data === 'object' ? [response.data] : [];
      }
      
      // Normalizziamo i dati per garantire consistenza
      const processedTests = testData.map(test => ({
        ...test,
        passedTests: test.passedTests || 0,
        failedTests: test.failedTests || 0,
        totalTests: test.totalTests || 0,
        status: test.status || 'pending',
        lastExecuted: test.lastExecuted || null,
        duration: test.duration || null,
        output: test.output || test.rawOutput || null,
        results: test.results || [] // Aggiungiamo questo campo per i risultati dettagliati
      }));
      
      setTests(processedTests);
    } catch (err) {
      console.error('Errore nel caricamento dei test unitari:', err);
      setError('Errore nel caricamento dei test unitari: ' + (err.message || 'Errore sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRunTest = async (test) => {
    setRunningTestId(test.id);
    setError(null);
    
    try {
      logDebug(`Avvio esecuzione test: ${test.file}`);
      const response = await testSystemService.runUnitTest(test.file);
      
      // Log dettagliato della risposta
      logDebug(`Risposta API completa:`, response);
      
      // Accesso ai dati dalla risposta
      const testData = response.data && response.data.data ? response.data.data : response.data;
      logDebug(`Dati testData:`, testData);
      
      // Garantisci valori validi
      const successValue = testData.success !== undefined ? testData.success : true;
      const passedTests = parseInt(testData.passedTests) || 0;
      const failedTests = parseInt(testData.failedTests) || 0;
      const totalTests = parseInt(testData.totalTests) || (passedTests + failedTests) || 1;
      const rawOutput = testData.rawOutput || testData.output || '';
      
      logDebug(`Valori normalizzati:`, {
        success: successValue,
        passedTests,
        failedTests,
        totalTests,
        hasRawOutput: Boolean(rawOutput),
        testResultsLength: testData.testResults ? testData.testResults.length : 0
      });
      
      // Preparazione dati coerenti per la visualizzazione dei risultati
      const formattedResults = {
        file: test.file,
        name: test.name,
        passedTests: passedTests,
        failedTests: failedTests,
        totalTests: totalTests,
        duration: testData.duration || 0,
        output: rawOutput,
        success: successValue,
        executedAt: new Date(),
        // Importante: assicurarsi che i risultati dettagliati siano accessibili e un array
        testResults: Array.isArray(testData.testResults) ? testData.testResults : []
      };
      
      logDebug(`Risultati formattati:`, formattedResults);
      
      // Imposta i risultati del test
      setTestResults(formattedResults);
      
      // Aggiorna il test selezionato
      setSelectedTest({
        ...test,
        lastExecuted: new Date(),
        status: successValue ? 'passed' : 'failed',
        passedTests: passedTests,
        failedTests: failedTests,
        totalTests: totalTests,
        output: rawOutput
      });
      
      // Aggiorniamo la lista dei test
      await fetchTests();
      
      // Apriamo il dialog con i risultati
      setDialogOpen(true);
    } catch (err) {
      logDebug(`Errore nell'esecuzione del test ${test.id}:`, err);
      setError(`Errore nell'esecuzione del test ${test.id}: ${err.message || 'Errore sconosciuto'}`);
    } finally {
      setRunningTestId(null);
    }
  };

  // Esegue tutti i test unitari
  const handleRunAllUnitTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await testSystemService.runAllUnitTests();
      
      // Verifica la risposta API - ora la risposta è in response.data e non in response.data.data
      const testData = response.data;
      
      await fetchTests();
      
      // Mostriamo i risultati nel dialog
      setTestResults({
        ...testData,
        file: "all unit tests",
        name: "Test Unitari",
        executedAt: new Date(),
        // Assicuriamoci di avere accesso ai risultati dettagliati
        testResults: testData.testResults || []
      });
      
    
      setSelectedTest({
        id: "all-unit-tests",
        name: "Test Unitari",
        description: "Esecuzione di tutti i test unitari",
        file: "all unit tests",
        lastExecuted: new Date(),
        status: testData.success ? 'passed' : 'failed',
        passedTests: testData.passedTests || 0,
        failedTests: testData.failedTests || 0,
        totalTests: testData.totalTests || 0
      });
      
      setDialogOpen(true);
    } catch (err) {
      console.error('Errore nell\'esecuzione di tutti i test unitari:', err);
      setError(`Errore nell'esecuzione di tutti i test unitari: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Visualizza i dettagli di un test
  const handleViewTest = async (test) => {
    setSelectedTest(test);
    setResultLoading(true);
    
    try {
      // Se il test ha già l'output e i dati aggiornati, usiamo quelli
      if (test.output) {
        setTestResults({
          file: test.file,
          name: test.name,
          passedTests: test.passedTests || 0,
          failedTests: test.failedTests || 0,
          totalTests: test.totalTests || 0,
          duration: test.duration || 0,
          output: test.output,
          success: test.status === 'passed',
          executedAt: test.lastExecuted,
          // Se ci sono eventuali risultati dettagliati nel test
          testResults: test.results || []
        });
      } else {
        // Altrimenti creiamo un oggetto di risultati di base
        setTestResults({
          file: test.file,
          name: test.name,
          passed: test.status === 'passed' ? 1 : 0,
          total: 1,
          duration: test.duration || 0,
          output: 'Nessun output disponibile per questo test',
          executedAt: test.lastExecuted
        });
      }
      
      setDialogOpen(true);
    } catch (err) {
      console.error(`Errore nel caricamento dei dettagli del test ${test.id}:`, err);
      setError(`Errore nel caricamento dei dettagli del test: ${err.message}`);
    } finally {
      setResultLoading(false);
    }
  };

  // Chiude il dialog dei risultati
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTest(null);
    setDialogTab(0);
    setTestResults(null);
  };

  // Cambia tab nel dialog
  const handleDialogTabChange = (event, newValue) => {
    setDialogTab(newValue);
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
        <Typography variant="h6">Test Unitari</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : null}
            onClick={fetchTests}
            disabled={loading}
          >
            {loading ? 'Caricamento...' : 'Aggiorna'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
            onClick={handleRunAllUnitTests}
            disabled={loading}
          >
            Esegui Test Unitari
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tabella test unitari">
          <TableHead>
            <TableRow>
              <TableCell>Nome Test</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Test Passati</TableCell>
              <TableCell>Ultima Esecuzione</TableCell>
              <TableCell>Durata</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nessun test unitario trovato
                </TableCell>
              </TableRow>
            ) : (
              (rowsPerPage > 0
                ? tests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : tests
              ).map((test) => (
                <TableRow 
                  key={test.id} 
                  hover
                  sx={test.status === 'failed' ? { bgcolor: 'rgba(255, 0, 0, 0.03)' } : {}}
                >
                  <TableCell component="th" scope="row">
                    {test.name}
                  </TableCell>
                  <TableCell>{test.description}</TableCell>
                  <TableCell>
                    <Tooltip title={test.file}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: '150px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        {test.file}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{renderStatus(test.status)}</TableCell>
                  <TableCell align="center">
                    {test.totalTests > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography>{`${test.passedTests || 0}/${test.totalTests || 0}`}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={((test.passedTests || 0) / (test.totalTests || 1)) * 100}
                          sx={{ width: 50, height: 6, borderRadius: 3 }}
                          color={test.status === 'passed' ? 'success' : 'error'}
                        />
                      </Box>
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(test.lastExecuted)}</TableCell>
                  <TableCell><DurationDisplay milliseconds={test.duration} /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleRunTest(test)}
                        disabled={runningTestId === test.id || loading}
                        title="Esegui test"
                      >
                        {runningTestId === test.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <RunIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton 
                        color="info"
                        size="small"
                        onClick={() => handleViewTest(test)}
                        title="Visualizza dettagli"
                        disabled={!test.lastExecuted}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>

      {/* Dialog per visualizzare i risultati dei test */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {testResults?.success !== undefined ? (
                testResults.success ? (
                  <PassIcon color="success" />
                ) : (
                  <FailIcon color="error" />
                )
              ) : selectedTest?.status === 'passed' ? (
                <PassIcon color="success" />
              ) : (
                <FailIcon color="error" />
              )}
              <Typography variant="h6">
                {selectedTest?.name || 'Dettagli Test'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {resultLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : testResults ? (
            <>
              <Tabs
                value={dialogTab}
                onChange={handleDialogTabChange}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab label="Riepilogo" icon={<CheckCircle />} />
                <Tab label="Risultati Dettagliati" icon={<ExpandMoreIcon />} />
                <Tab label="Output Completo" icon={<Subject />} />
              </Tabs>
              
              {dialogTab === 0 && <TestStats result={testResults} />}
              {dialogTab === 1 && (
                <TestDetailsList results={testResults.testResults || []} />
              )}
              {dialogTab === 2 && <TestOutput output={testResults.output || testResults.rawOutput} />}
            </>
          ) : (
            <Alert severity="info">
              Nessun risultato disponibile per questo test
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Chiudi</Button>
          {selectedTest && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleRunTest(selectedTest)}
              disabled={runningTestId === selectedTest.id}
              startIcon={runningTestId === selectedTest.id ? <CircularProgress size={16} /> : <RunIcon />}
            >
              Esegui di nuovo
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnitTestsPanel;