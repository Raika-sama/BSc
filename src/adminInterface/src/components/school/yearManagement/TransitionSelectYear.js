// src/components/school/yearManagement/TransitionSelectYear.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { 
  Event as EventIcon,
  CompareArrows as CompareArrowsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const TransitionSelectYear = ({ 
  school, 
  fromYear, 
  toYear, 
  onFromYearChange, 
  onToYearChange 
}) => {
  const [activeYear, setActiveYear] = useState(null);
  const [plannedYears, setPlannedYears] = useState([]);
  
  useEffect(() => {
    if (school && school.academicYears) {
      // Ordina gli anni accademici per anno (più recente prima)
      const sortedYears = [...school.academicYears].sort((a, b) => {
        const yearA = parseInt(a.year.split('/')[0]);
        const yearB = parseInt(b.year.split('/')[0]);
        return yearB - yearA;
      });
      
      const active = sortedYears.find(year => year.status === 'active');
      const planned = sortedYears.filter(year => year.status === 'planned');
      
      setActiveYear(active);
      setPlannedYears(planned);
      
      // Se non è stato selezionato nessun anno di partenza, imposta l'anno attivo
      if (!fromYear && active) {
        onFromYearChange(active);
      }
      
      // Se non è stato selezionato nessun anno di destinazione e c'è un anno pianificato
      if (!toYear && planned.length > 0) {
        onToYearChange(planned[0]);
      }
    }
  }, [school, fromYear, toYear, onFromYearChange, onToYearChange]);
  
  const handleFromYearChange = (event) => {
    const selectedYearId = event.target.value;
    const selectedYear = school.academicYears.find(year => year._id === selectedYearId);
    onFromYearChange(selectedYear);
  };
  
  const handleToYearChange = (event) => {
    const selectedYearId = event.target.value;
    const selectedYear = school.academicYears.find(year => year._id === selectedYearId);
    onToYearChange(selectedYear);
  };
  
  // Funzione helper per formattare la visualizzazione dell'anno
  const formatYearDisplay = (yearString) => {
    if (!yearString) return '';
    return yearString; // Mostra l'anno nel formato originale (es. "2023/2024")
  };
  
  // Verifica se la transizione è valida
  const isValidTransition = () => {
    if (!fromYear || !toYear) return false;
    
    // Estrai gli anni come numeri
    const fromYearStart = parseInt(fromYear.year.split('/')[0]);
    const toYearStart = parseInt(toYear.year.split('/')[0]);
    
    // Verifica che l'anno di destinazione sia successivo all'anno di partenza
    return toYearStart > fromYearStart;
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Seleziona gli anni accademici per la transizione
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={5}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Anno di Partenza
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="from-year-label">Anno Accademico</InputLabel>
              <Select
                labelId="from-year-label"
                id="from-year-select"
                value={fromYear?._id || ''}
                label="Anno Accademico"
                onChange={handleFromYearChange}
              >
                {activeYear && (
                  <MenuItem value={activeYear._id}>
                    {formatYearDisplay(activeYear.year)} (Attivo)
                  </MenuItem>
                )}
                {school.academicYears
                  .filter(year => year.status !== 'active' && year.status !== 'planned')
                  .map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {formatYearDisplay(year.year)} ({year.status})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            
            {fromYear && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {formatYearDisplay(fromYear.year)}
                    </Typography>
                    <Chip 
                      label={fromYear.status === 'active' ? 'Attivo' : fromYear.status} 
                      color={fromYear.status === 'active' ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Stato: {fromYear.status}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CompareArrowsIcon fontSize="large" color="action" sx={{ transform: 'rotate(90deg)' }} />
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Anno di Destinazione
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="to-year-label">Anno Accademico</InputLabel>
              <Select
                labelId="to-year-label"
                id="to-year-select"
                value={toYear?._id || ''}
                label="Anno Accademico"
                onChange={handleToYearChange}
              >
                {plannedYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {formatYearDisplay(year.year)} (Pianificato)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {toYear && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {formatYearDisplay(toYear.year)}
                    </Typography>
                    <Chip 
                      label="Pianificato"
                      color="info"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Stato: {toYear.status}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {fromYear && toYear && !isValidTransition() && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1 }} />
            <Typography>
              L'anno di destinazione deve essere successivo all'anno di partenza.
            </Typography>
          </Box>
        </Alert>
      )}
      
      {plannedYears.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Non ci sono anni accademici pianificati. Per eseguire una transizione, 
          prima è necessario creare un nuovo anno accademico pianificato.
        </Alert>
      )}
      
      {!activeYear && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Non c'è nessun anno accademico attivo. Per eseguire una transizione, 
          prima è necessario attivare un anno accademico.
        </Alert>
      )}
    </Box>
  );
};

export default TransitionSelectYear;