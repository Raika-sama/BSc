import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import CognitiveGauge from './CognitiveGauge';

// Mapping dimensioni cognitive con relativi colori e descrizioni
const DIMENSION_MAPPING = {
  'analitico': { 
    left: 'Analitico', 
    right: 'Globale', 
    color: '#2196f3',
    description: 'Modalità di elaborazione delle informazioni'
  },
  'sistematico': { 
    left: 'Sistematico', 
    right: 'Intuitivo', 
    color: '#4caf50',
    description: 'Approccio alla risoluzione dei problemi'
  },
  'verbale': { 
    left: 'Verbale', 
    right: 'Visivo', 
    color: '#ff9800',
    description: 'Preferenza nella modalità di apprendimento'
  },
  'impulsivo': { 
    left: 'Impulsivo', 
    right: 'Riflessivo', 
    color: '#9c27b0',
    description: 'Stile decisionale'
  },
  'dipendente': { 
    left: 'Dipendente', 
    right: 'Indipendente', 
    color: '#f44336',
    description: 'Autonomia nell\'apprendimento'
  }
};

const TestResultsView = ({ test }) => {
  // Se non c'è nessun test selezionato, mostra un messaggio
  if (!test) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          p: 3
        }}
      >
        <Typography color="text.secondary">
          Seleziona un test per visualizzarne i dettagli
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}
      >
        <Typography variant="h6" color="primary" gutterBottom>
          Risultati Test {test.test?.tipo || test.tipo}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completato il {formatDate(test.dataCompletamento)}
        </Typography>
      </Paper>

      {/* Profilo Cognitivo */}
      <Box sx={{ p: 3, flex: 1 }}>
        <Typography variant="h6" gutterBottom>
          Profilo Cognitivo
        </Typography>
        
        {/* Grid di Gauge */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr'
            },
            gap: 4,
            mt: 3
          }}
        >
          {test.punteggi && Object.entries(test.punteggi).map(([dimension, value]) => {
            const mapping = DIMENSION_MAPPING[dimension];
            if (!mapping) return null;

            return (
              <Box key={dimension} sx={{ mb: 2 }}>
                <CognitiveGauge
                  value={value}
                  leftLabel={mapping.left}
                  rightLabel={mapping.right}
                  color={mapping.color}
                  description={mapping.description}
                />
              </Box>
            );
          })}
        </Box>

        {/* Raccomandazioni */}
        {test.metadata?.profile?.recommendations && (
          <>
            <Divider sx={{ my: 4 }} />
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Raccomandazioni
              </Typography>
              <Box 
                sx={{ 
                  display: 'grid',
                  gap: 2,
                  mt: 2,
                  p: 3,
                  backgroundColor: 'background.default',
                  borderRadius: 1
                }}
              >
                {test.metadata.profile.recommendations.map((rec, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        mt: 1
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      {rec}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default TestResultsView;