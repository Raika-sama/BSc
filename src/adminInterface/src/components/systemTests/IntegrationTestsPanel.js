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
  Tooltip
} from '@mui/material';
import { 
  PlayArrow as RunIcon, 
  CheckCircle as PassIcon, 
  Cancel as FailIcon, 
  Schedule as PendingIcon,
  Visibility as ViewIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import testSystemService from '../../services/testsSystemService';

const IntegrationTestsPanel = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [runningTestId, setRunningTestId] = useState(null);
  const [selectedModule, setSelectedModule] = useState('Tutti');

  // Carica i test di integrazione dal backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await testSystemService.getIntegrationTests();
        setTests(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Errore nel caricamento dei test di integrazione:', err);
        setError('Errore nel caricamento dei test di integrazione');
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

// Esegue un singolo test di integrazione
const handleRunTest = async (test) => {
  setRunningTestId(test.id);
  
  try {
    // Modifica: Usa POST invece di GET e passa testFile nel corpo
    await testSystemService.runIntegrationTest(test.file);
    
    // Ricarica i test per avere i dati aggiornati
    const response = await testSystemService.getIntegrationTests();
    setTests(response.data.data || []);
  } catch (err) {
    console.error(`Errore nell'esecuzione del test ${test.id}:`, err);
    setError(`Errore nell'esecuzione del test ${test.id}`);
  } finally {
    setRunningTestId(null);
  }
};

// Esegue tutti i test di integrazione
const handleRunAllIntegrationTests = async () => {
  setLoading(true);
  
  try {
    // Modifica: Usa POST invece di GET
    await testSystemService.runAllIntegrationTests();
    
    // Ricarica i test per avere i dati aggiornati
    const response = await testSystemService.getIntegrationTests();
    setTests(response.data.data || []);
  } catch (err) {
    console.error('Errore nell\'esecuzione di tutti i test di integrazione:', err);
    setError('Errore nell\'esecuzione di tutti i test di integrazione');
  } finally {
    setLoading(false);
  }
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

  // Filtra i test in base al modulo selezionato
  const filteredTests = selectedModule === 'Tutti' 
    ? tests 
    : tests.filter(test => test.module === selectedModule);

  // Calcola la lista di tutti i moduli disponibili
  const modules = ['Tutti', ...Array.from(new Set(tests.map(test => test.module)))];

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
        <Typography variant="h6">Test di Integrazione</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
          onClick={handleRunAllIntegrationTests}
          disabled={loading}
        >
          Esegui Test di Integrazione
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {modules.map(module => (
          <Chip
            key={module}
            label={module}
            color={selectedModule === module ? 'primary' : 'default'}
            onClick={() => setSelectedModule(module)}
            clickable
          />
        ))}
      </Box>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tabella test di integrazione">
          <TableHead>
            <TableRow>
              <TableCell>Nome Test</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>Modulo</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Ultima Esecuzione</TableCell>
              <TableCell>Durata (ms)</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nessun test di integrazione trovato
                </TableCell>
              </TableRow>
            ) : (
              (rowsPerPage > 0
                ? filteredTests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredTests
              ).map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell component="th" scope="row">
                    {test.name}
                  </TableCell>
                  <TableCell>{test.description}</TableCell>
                  <TableCell>
                    <Chip label={test.module} size="small" />
                  </TableCell>
                  <TableCell>{renderStatus(test.status)}</TableCell>
                  <TableCell>{formatDate(test.lastExecuted)}</TableCell>
                  <TableCell>{test.duration || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleRunTest(test)}
                      disabled={runningTestId === test.id || loading}
                    >
                      {runningTestId === test.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <RunIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton color="info">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title={`File: ${test.file}`}>
                      <IconButton color="default">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
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
    </Box>
  );
};

export default IntegrationTestsPanel;