import React from 'react';
import { Box, Typography, Paper, Divider, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CognitiveGauge from './CognitiveGauge';

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
  const theme = useTheme();

  if (!test) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="body1">
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
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2.5, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600,
            mb: 0.5
          }}
        >
          Risultati Test {test.test?.tipo || test.tipo}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completato il {formatDate(test.dataCompletamento)}
        </Typography>
      </Box>

      {/* Content */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          p: 3
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            color: 'text.primary',
            fontWeight: 600
          }}
        >
          Profilo Cognitivo
        </Typography>
        
        {/* Gauges Grid */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr'
            },
            gap: 4
          }}
        >
          {test.punteggi && Object.entries(test.punteggi).map(([dimension, value]) => {
            const mapping = DIMENSION_MAPPING[dimension];
            if (!mapping) return null;

            return (
              <Paper
                key={dimension}
                elevation={0}
                sx={{ 
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <CognitiveGauge
                  value={value}
                  leftLabel={mapping.left}
                  rightLabel={mapping.right}
                  color={mapping.color}
                  description={mapping.description}
                />
              </Paper>
            );
          })}
        </Box>

        {/* Recommendations */}
        {test.metadata?.profile?.recommendations && (
          <Box sx={{ mt: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                color: 'text.primary',
                fontWeight: 600
              }}
            >
              Raccomandazioni
            </Typography>
            <Paper
              elevation={0}
              sx={{ 
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              {test.metadata.profile.recommendations.map((rec, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    '&:not(:last-child)': {
                      mb: 2
                    }
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
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TestResultsView;