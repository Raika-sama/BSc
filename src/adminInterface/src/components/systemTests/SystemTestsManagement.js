import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  CircularProgress, 
  Alert, 
  Snackbar 
} from '@mui/material';
import { 
  PlayArrow as RunIcon, 
  Refresh as RefreshIcon,
  History as HistoryIcon 
} from '@mui/icons-material';
import UnitTestsPanel from './UnitTestsPanel';
import IntegrationTestsPanel from './IntegrationTestsPanel';
import E2ETestsPanel from './E2ETestsPanel';
import TestHistoryPanel from './TestHistoryPanel';
import testSystemService from '../../services/testsSystemService';

const SystemTestsManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRunAllTests = async () => {
    setIsLoading(true);
    setNotification({ open: true, message: 'Esecuzione di tutti i test in corso...', severity: 'info' });
    
    try {
      // Modifica: Usa POST invece di GET
      const response = await testSystemService.runAllTests();
      
      // Verifica il risultato dei test
      const results = response.data.data;
      if (results) {
        const successMessage = `Test completati: ${results.numPassedTests}/${results.numTotalTests} test passati`;
        setNotification({ 
          open: true, 
          message: successMessage, 
          severity: results.numFailedTests > 0 ? 'warning' : 'success' 
        });
      } else {
        setNotification({ open: true, message: 'Tutti i test sono stati completati!', severity: 'success' });
      }
    } catch (error) {
      console.error('Errore nell\'esecuzione dei test:', error);
      setNotification({ 
        open: true, 
        message: `Errore nell'esecuzione dei test: ${error.response?.data?.message || error.message}`, 
        severity: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const getTabPanel = (index) => {
    switch (index) {
      case 0:
        return <UnitTestsPanel />;
      case 1:
        return <IntegrationTestsPanel />;
      case 2:
        return <E2ETestsPanel />;
      case 3:
        return <TestHistoryPanel />;
      default:
        return <div>Contenuto non disponibile</div>;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Test di Sistema
        </Typography>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <RunIcon />}
            onClick={handleRunAllTests}
            disabled={isLoading}
            sx={{ mr: 1 }}
          >
            {isLoading ? 'Esecuzione in corso...' : 'Esegui Tutti i Test'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Ricarica
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Test Unitari" />
          <Tab label="Test di Integrazione" />
          <Tab label="Test End-to-End" />
          <Tab label="Storico Test" icon={<HistoryIcon />} />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {getTabPanel(tabValue)}
        </Box>
      </Paper>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemTestsManagement;