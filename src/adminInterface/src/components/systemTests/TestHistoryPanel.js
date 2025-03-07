import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  List,
  Paper as MuiPaper
} from '@mui/material';
import { 
  CheckCircle as PassIcon, 
  Cancel as FailIcon, 
  Visibility as ViewIcon,
  Close as CloseIcon,
  BarChart as ChartIcon,
  CheckCircle,
  Subject,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import testSystemService from '../../services/testsSystemService';

// Componente per visualizzare la durata formattata
const DurationDisplay = ({ milliseconds }) => {
  if (!milliseconds && milliseconds !== 0) return <Typography>-</Typography>;
  
  // Format the duration in a readable way
  if (milliseconds < 1000) {
    return <Typography>{milliseconds} ms</Typography>;
  } else {
    const seconds = (milliseconds / 1000).toFixed(2);
    return <Typography>{seconds} s</Typography>;
  }
};

// Componente per visualizzare lo stato del test con icona colorata
const TestStatusBadge = ({ status, showLabel = true }) => {
  if (status === 'passed') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PassIcon fontSize="small" color="success" />
        {showLabel && <Typography color="success.main" variant="body2">Passato</Typography>}
      </Box>
    );
  } else if (status === 'failed') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FailIcon fontSize="small" color="error" />
        {showLabel && <Typography color="error.main" variant="body2">Fallito</Typography>}
      </Box>
    );
  } else {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CircularProgress size={16} />
        {showLabel && <Typography variant="body2">In esecuzione</Typography>}
      </Box>
    );
  }
};

// Componente avanzato per visualizzare un output formattato
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

// Componente per visualizzare le statistiche riassuntive con grafico migliorato
const TestStats = ({ result }) => {
  if (!result) return null;
  
  const passRate = result.totalTests > 0 
    ? ((result.passedTests / result.totalTests) * 100).toFixed(1) 
    : 0;
  
  // Colors for the chart
  let progressColor = "error.main";
  if (passRate >= 90) progressColor = "success.main";
  else if (passRate >= 75) progressColor = "primary.main";
  else if (passRate >= 50) progressColor = "warning.main";
  
  return (
    <Card sx={{ mb: 3, boxShadow: 3 }} variant="outlined">
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="h6" color="primary" gutterBottom>Riepilogo Test</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DateIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Eseguito il {new Date(result.executedAt).toLocaleString('it-IT')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Durata: {result.duration ? `${result.duration.toFixed(2)}s` : 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary" 
                  sx={{ 
                    maxWidth: '200px', 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  File: {result.testPath}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={8} md={9}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={4} md={4}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">Totali</Typography>
                    <Typography variant="h4">{result.totalTests}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4} md={4}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'success.lightest' }}>
                    <Typography variant="subtitle2" color="success.main">Passati</Typography>
                    <Typography variant="h4" color="success.main">{result.passedTests}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4} md={4}>
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: result.failedTests > 0 ? 'error.lightest' : 'inherit' }}>
                    <Typography variant="subtitle2" color="error.main">Falliti</Typography>
                    <Typography variant="h4" color="error.main">{result.failedTests}</Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Percentuale di successo</Typography>
                      <Typography variant="body2" fontWeight="bold">{passRate}%</Typography>
                    </Box>
                    <Box sx={{ mt: 1, mb: 1, position: 'relative' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={parseFloat(passRate)} 
                        sx={{ 
                          height: 12, 
                          borderRadius: 6,
                          backgroundColor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: progressColor,
                            borderRadius: 6
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

// Componente per visualizzare i dettagli di un singolo test
const TestDetails = ({ test }) => {
  return (
    <Accordion sx={{ mb: 1 }} defaultExpanded={test.status === 'failed'}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {test.status === 'passed' ? 
              <PassIcon fontSize="small" color="success" /> : 
              <FailIcon fontSize="small" color="error" />
            }
            <Typography>{test.name || 'Test senza nome'}</Typography>
          </Box>
          <Box>
            {test.duration && <Chip 
              size="small" 
              label={`${test.duration} ms`} 
              variant="outlined" 
              color="default" 
            />}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          {test.message && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {test.message}
              </Typography>
            </Paper>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
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

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {results.map((result, index) => (
        <MuiPaper
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {result.status === 'passed' ? (
                <PassIcon color="success" fontSize="small" />
              ) : (
                <FailIcon color="error" fontSize="small" />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'medium',
                  maxWidth: '500px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {result.name}
              </Typography>
            </Box>
            {result.duration !== undefined && (
              <Chip
                label={`${result.duration} ms`}
                size="small"
                variant="outlined"
                color="default"
              />
            )}
          </Box>
          
          {result.message && (
            <Box sx={{ mt: 1, pl: 4 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}
              >
                {result.message.split('\n').slice(0, 5).join('\n')}
                {result.message.split('\n').length > 5 && '...'}
              </Typography>
            </Box>
          )}
        </MuiPaper>
      ))}
    </List>
  );
};

const TestHistoryPanel = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testType, setTestType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, [testType]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await testSystemService.getTestHistory(testType);
      setHistory(response.data.data || []);
    } catch (err) {
      console.error('Errore nel caricamento dello storico test:', err);
      setError('Errore nel caricamento dello storico test');
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

  const handleOpenDialog = (test) => {
    setSelectedTest(test);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTest(null);
    setDialogTab(0);
  };

  const handleDialogTabChange = (event, newValue) => {
    setDialogTab(newValue);
  };

  const handleTypeChange = (event) => {
    setTestType(event.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT');
  };

  const renderStatus = (success) => {
    return success ? 
      <Chip icon={<PassIcon />} label="Passato" color="success" size="small" /> :
      <Chip icon={<FailIcon />} label="Fallito" color="error" size="small" />;
  };

  const renderTestResults = () => {
    if (!selectedTest) return null;

    return (
      <>
        <TestStats result={selectedTest} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dettagli dei Test
          </Typography>
          
          {selectedTest.results && selectedTest.results.length > 0 ? (
            <TestDetailsList results={selectedTest.results} />
          ) : (
            <Alert severity="info">
              Nessun risultato dettagliato disponibile per questo test
            </Alert>
          )}
        </Box>
      </>
    );
  };

  if (loading && history.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && history.length === 0) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Storico Esecuzioni Test</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="test-type-label">Tipo Test</InputLabel>
            <Select
              labelId="test-type-label"
              id="test-type-select"
              value={testType}
              label="Tipo Test"
              onChange={handleTypeChange}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="unit">Test Unitari</MenuItem>
              <MenuItem value="integration">Test di Integrazione</MenuItem>
              <MenuItem value="all">Esecuzioni Complete</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            onClick={fetchHistory}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Caricamento...' : 'Aggiorna'}
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table aria-label="tabella storico test">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Percorso</TableCell>
              <TableCell>Data Esecuzione</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Passati/Totali</TableCell>
              <TableCell>Durata</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nessuna esecuzione di test trovata
                </TableCell>
              </TableRow>
            ) : (
              (rowsPerPage > 0
                ? history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : history
              ).map((test) => (
                <TableRow 
                  key={test._id} 
                  hover
                  sx={test.success ? {} : { bgcolor: 'rgba(255, 0, 0, 0.03)' }}
                >
                  <TableCell>{test._id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={test.testType === 'unit' ? 'Unitario' : 
                             test.testType === 'integration' ? 'Integrazione' : 'Completo'} 
                      size="small" 
                      color={test.testType === 'unit' ? 'primary' : 
                             test.testType === 'integration' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={test.testPath}>
                      <Typography variant="body2">
                        {test.testPath}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatDate(test.executedAt)}</TableCell>
                  <TableCell>{renderStatus(test.success)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{`${test.passedTests || 0}/${test.totalTests || 0}`}</Typography>
                      {test.totalTests > 0 && (
                        <LinearProgress 
                          variant="determinate" 
                          value={((test.passedTests || 0) / (test.totalTests || 1)) * 100} 
                          sx={{ width: 50, ml: 1, height: 6, borderRadius: 3 }}
                          color={test.success ? 'success' : 'error'}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {test.duration ? (
                      <DurationDisplay milliseconds={test.duration * 1000} />
                    ) : (
                      <Typography>-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleOpenDialog(test)}
                    >
                      Dettagli
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={history.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>

      {/* Dialog per i dettagli del test */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedTest?.success ? 
                <PassIcon color="success" /> : 
                <FailIcon color="error" />
              }
              <Typography variant="h6">
                Dettagli Test - {selectedTest?.testType === 'unit' ? 'Test Unitario' : 
                                selectedTest?.testType === 'integration' ? 'Test di Integrazione' : 
                                'Esecuzione Completa'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTest && (
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
              
              {dialogTab === 0 && <TestStats result={selectedTest} />}
              {dialogTab === 1 && <TestDetailsList results={selectedTest.results || []} />}
              {dialogTab === 2 && <TestOutput output={selectedTest.rawOutput} />}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestHistoryPanel;