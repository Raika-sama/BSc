import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { axiosInstance } from '../../../../services/axiosConfig';

const AssignTestDialog = ({ open, onClose, studentId, onTestAssigned }) => {
  const [testTypes, setTestTypes] = useState([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Carica i tipi di test disponibili
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setSelectedTestType('');

      // Ottieni i tipi di test disponibili (per ora hardcoded, in futuro da API)
      setTestTypes([
        { 
          id: 'CSI', 
          name: 'Test CSI', 
          description: 'Cognitive Style Inventory - Valuta gli stili cognitivi dello studente'
        }
      ]);
      setLoading(false);
      
      // In futuro, quando ci saranno più test, usare questa chiamata API
      // axiosInstance.get('/tests/available-types')
      //   .then(response => {
      //     setTestTypes(response.data.data);
      //     setLoading(false);
      //   })
      //   .catch(error => {
      //     console.error('Errore nel caricamento dei tipi di test:', error);
      //     setError('Impossibile caricare i tipi di test disponibili.');
      //     setLoading(false);
      //   });
    }
  }, [open]);

  // Gestisce la selezione del tipo di test
  const handleTestTypeChange = (event) => {
    setSelectedTestType(event.target.value);
    setError(null);
  };

// Gestisce l'assegnazione del test - migliorata
const handleAssignTest = async () => {
  if (!selectedTestType) {
      setError('Seleziona un tipo di test da assegnare.');
      return;
  }

  setLoading(true);
  setError(null);

  try {
      const response = await axiosInstance.post('/tests/assign', {
          testType: selectedTestType,
          studentId,
          // Configurazione di default, in futuro potrebbe essere personalizzabile dall'interfaccia
          config: {
              tempoLimite: 30, // 30 minuti
              tentativiMax: 1,
              randomizzaDomande: true,
              mostraRisultatiImmediati: false
          }
      });

      if (response.data && response.data.status === 'success') {
          setSuccess(true);
          
          // Notifica il componente padre che il test è stato assegnato con successo
          if (onTestAssigned && response.data.data && response.data.data.test) {
              onTestAssigned(response.data.data.test);
          } else {
              console.warn('Test assigned but no test data returned or onTestAssigned not provided', {
                  hasTestData: !!response.data.data?.test,
                  hasCallback: !!onTestAssigned
              });
          }
          
          // Chiudi il dialogo dopo 1.5 secondi
          setTimeout(() => {
              onClose();
          }, 1500);
      }
  } catch (error) {
      console.error('Errore nell\'assegnazione del test:', error);
      setError(
          error.response?.data?.error?.message || 
          'Si è verificato un errore durante l\'assegnazione del test.'
      );
  } finally {
      setLoading(false);
  }
};

  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assegna nuovo test</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Test assegnato con successo!
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Seleziona il tipo di test da assegnare allo studente. Il test assegnato sarà disponibile 
          nella dashboard personale dello studente per essere completato.
        </Typography>
        
        <FormControl fullWidth variant="outlined" sx={{ mt: 2 }} disabled={loading || success}>
          <InputLabel id="test-type-label">Tipo di test</InputLabel>
          <Select
            labelId="test-type-label"
            value={selectedTestType}
            onChange={handleTestTypeChange}
            label="Tipo di test"
          >
            {testTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {selectedTestType ? 
              testTypes.find(t => t.id === selectedTestType)?.description || '' 
              : 'Seleziona il tipo di test da assegnare'
            }
          </FormHelperText>
        </FormControl>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Note: Il test verrà assegnato immediatamente e lo studente potrà accedervi 
          dopo l'accesso alla piattaforma. L'assegnazione non può essere annullata, ma
          può essere revocata in qualsiasi momento.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annulla
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAssignTest}
          disabled={!selectedTestType || loading || success}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Assegnazione in corso...' : 'Assegna Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignTestDialog;