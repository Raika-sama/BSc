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
  Divider
} from '@mui/material';
import { 
  CheckCircle as PassIcon, 
  Cancel as FailIcon, 
  Visibility as ViewIcon,
  Close as CloseIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import testSystemService from '../../services/testsSystemService';

// Componente per visualizzare un output formattato
const TestOutput = ({ output }) => {
  if (!output) return <Typography color="text.secondary">Nessun output disponibile</Typography>;
  
  // Split the output by newlines and render each line
  const lines = output.split('\n');
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        maxHeight: '400px', 
        overflowY: 'auto', 
        backgroundColor: '#f5f5f5',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        whiteSpace: 'pre-wrap'
      }}
    >
      {lines.map((line, index) => {
        // Apply colors based on the content of the line
        let color = 'inherit';
        if (line.includes('PASS')) color = 'success.main';
        if (line.includes('FAIL') || line.includes('ERROR')) color = 'error.main';
        if (line.includes('WARN')) color = 'warning.main';
        
        return (
          <Typography key={index} color={color} component="div" sx={{ lineHeight: 1.5 }}>
            {line || ' '}
          </Typography>
        );
      })}
    </Paper>
  );
};

// Componente per visualizzare le statistiche riassuntive
const TestStats = ({ result }) => {
  if (!result) return null;
  
  const passRate = result.totalTests > 0 
    ? ((result.passedTests / result.totalTests) * 100).toFixed(1) 
    : 0;
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Typography variant="h6" color="primary">Riepilogo Test</Typography>
            <Typography variant="body2" color="text.secondary">
              Eseguito il {new Date(result.executedAt).toLocaleString('it-IT')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Totali</Typography>
                <Typography variant="h6">{result.totalTests}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="success.main">Passati</Typography>
                <Typography variant="h6" color="success.main">{result.passedTests}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="error.main">Falliti</Typography>
                <Typography variant="h6" color="error.main">{result.failedTests}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Percentuale di successo</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={parseFloat(passRate)} 
                      color={passRate === '100.0' ? "success" : passRate > 75 ? "primary" : "error"}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{passRate}%</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Importiamo LinearProgress per la barra di progresso
import { LinearProgress } from '@mui/material';

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
        
        {selectedTest.results && selectedTest.results.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome Test</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Messaggio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedTest.results.map((result, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{renderStatus(result.status === 'passed')}</TableCell>
                    <TableCell>{result.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>Nessun risultato dettagliato disponibile</Typography>
        )}
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
          >
            Aggiorna
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
              <TableCell>Passati/Totali</TableCell>
              <TableCell>Durata (s)</TableCell>
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
                <TableRow key={test._id} hover>
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
                  <TableCell>{test.testPath}</TableCell>
                  <TableCell>{formatDate(test.executedAt)}</TableCell>
                  <TableCell>{renderStatus(test.success)}</TableCell>
                  <TableCell>{`${test.passedTests}/${test.totalTests}`}</TableCell>
                  <TableCell>{test.duration ? test.duration.toFixed(2) : '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="info" 
                      onClick={() => handleOpenDialog(test)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
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
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Dettagli Test - {selectedTest?.testType === 'unit' ? 'Test Unitario' : 
                              selectedTest?.testType === 'integration' ? 'Test di Integrazione' : 
                              'Esecuzione Completa'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
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
                <Tab label="Risultati" icon={<CheckCircle />} />
                <Tab label="Output Completo" icon={<Subject />} />
                {/* Aggiungi questa tab quando implementi le statistiche/grafici */}
                {/* <Tab label="Statistiche" icon={<ChartIcon />} /> */}
              </Tabs>
              
              {dialogTab === 0 && renderTestResults()}
              {dialogTab === 1 && <TestOutput output={selectedTest.rawOutput} />}
              {/* {dialogTab === 2 && <TestStats results={selectedTest} />} */}
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

// Importiamo altri componenti necessari
import { CheckCircle, Subject } from '@mui/icons-material';

export default TestHistoryPanel;