import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  alpha, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Mappa per tradurre i nomi delle dimensioni in italiano e i loro estremi
const DIMENSIONS_MAPPING = {
  'elaborazione': {
    name: 'Elaborazione',
    leftExtreme: 'Analitico',
    rightExtreme: 'Globale',
    description: 'Modalità di elaborazione delle informazioni',
    color: '#2196f3'
  },
  'creativita': {
    name: 'Creatività',
    leftExtreme: 'Sistematico',
    rightExtreme: 'Intuitivo',
    description: 'Approccio alla risoluzione dei problemi',
    color: '#4caf50'
  },
  'preferenzaVisiva': {
    name: 'Preferenza Visiva',
    leftExtreme: 'Verbale',
    rightExtreme: 'Visivo',
    description: 'Preferenza nella modalità di apprendimento',
    color: '#ff9800'
  },
  'decisione': {
    name: 'Decisione',
    leftExtreme: 'Impulsivo',
    rightExtreme: 'Riflessivo',
    description: 'Stile decisionale',
    color: '#9c27b0'
  },
  'autonomia': {
    name: 'Autonomia',
    leftExtreme: 'Dipendente',
    rightExtreme: 'Indipendente',
    description: 'Autonomia nell\'apprendimento',
    color: '#f44336'
  }
};

// Funzione per ottenere la descrizione della tendenza in base allo scostamento
const getTendencyDescription = (score) => {
  if (score === 50) return 'Equilibrato';
  
  const deviation = Math.abs(score - 50);
  let intensity;
  
  if (deviation < 10) intensity = 'Leggera tendenza';
  else if (deviation < 20) intensity = 'Moderata tendenza';
  else if (deviation < 35) intensity = 'Forte tendenza';
  else intensity = 'Marcata tendenza';
  
  return intensity;
};

// Componente per visualizzare lo scostamento come barra orizzontale
const DeviationBar = ({ score, leftExtreme, rightExtreme, color }) => {
  const theme = useTheme();
  const normalizedValue = Math.max(0, Math.min(100, score)); // Assicura che il valore sia tra 0 e 100
  
  // Calcola lo scostamento dal centro (50)
  const deviation = normalizedValue - 50;
  const isLeft = deviation < 0;
  const absDeviation = Math.abs(deviation);
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 35, my: 1 }}>
      {/* Linea di base */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: 0, 
          width: '100%', 
          height: 2, 
          bgcolor: 'divider', 
          transform: 'translateY(-50%)' 
        }} 
      />
      
      {/* Indicatore centrale */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          width: 2, 
          height: 15, 
          bgcolor: 'text.secondary', 
          transform: 'translate(-50%, -50%)' 
        }} 
      />
      
      {/* Barra di scostamento */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: isLeft ? `${50 - absDeviation}%` : '50%', 
          width: `${absDeviation}%`, 
          height: 12, 
          bgcolor: alpha(color, 0.7), 
          transform: 'translateY(-50%)',
          borderRadius: 1,
          transition: 'all 0.3s ease'
        }} 
      />
      
      {/* Indicatore di posizione */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: `${normalizedValue}%`, 
          width: 12, 
          height: 12, 
          bgcolor: color, 
          transform: 'translate(-50%, -50%)', 
          borderRadius: '50%',
          boxShadow: 2,
          zIndex: 1,
          transition: 'all 0.3s ease'
        }} 
      />
      
      {/* Etichette degli estremi */}
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'absolute', 
          bottom: -20, 
          left: '5%', 
          color: 'text.secondary',
          fontWeight: isLeft ? 600 : 400
        }}
      >
        {leftExtreme}
      </Typography>
      
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'absolute', 
          bottom: -20, 
          right: '5%', 
          color: 'text.secondary',
          fontWeight: !isLeft ? 600 : 400
        }}
      >
        {rightExtreme}
      </Typography>
    </Box>
  );
};

const TestResultsView = ({ test }) => {
  const theme = useTheme();

  if (!test) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
          bgcolor: 'background.paper',
          p: 4,
          textAlign: 'center'
        }}
      >
        <AssignmentTurnedInIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Nessun test selezionato
        </Typography>
        <Typography variant="body2">
          Seleziona un test completato dalla lista per visualizzarne i risultati
        </Typography>
      </Box>
    );
  }

  // Debug dell'oggetto test
  console.debug('Test object in TestResultsView:', {
    id: test._id,
    hasPunteggi: !!test.punteggi,
    hasPunteggiDimensioni: !!test.punteggiDimensioni,
    keys: Object.keys(test)
  });
  
  // Se l'oggetto test contiene un riferimento a 'result', usiamo quello
  const resultData = test.result || test;
  
  // Cerchiamo i punteggi sia nella struttura vecchia che in quella nuova
  const punteggi = resultData.punteggi || 
                  (resultData.punteggiDimensioni ? {
                    analitico: resultData.punteggiDimensioni.elaborazione?.score,
                    sistematico: resultData.punteggiDimensioni.creativita?.score,
                    verbale: resultData.punteggiDimensioni.preferenzaVisiva?.score,
                    impulsivo: resultData.punteggiDimensioni.decisione?.score,
                    dipendente: resultData.punteggiDimensioni.autonomia?.score
                  } : null);

  // Cerca i punteggi nella struttura punteggiDimensioni
  const hasPunteggiDimensioni = resultData.punteggiDimensioni && 
                              Object.keys(resultData.punteggiDimensioni).length > 0;
  
  // Cerca i punteggi nella struttura punteggi
  const hasPunteggi = punteggi && Object.keys(punteggi).length > 0;

  // Verifica che abbiamo effettivamente punteggi da mostrare
  const noPunteggi = !hasPunteggi && !hasPunteggiDimensioni;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn('Error formatting date:', e);
      return 'Data non valida';
    }
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
          Risultati Test {test.nome || test.tipo}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Completato il {formatDate(test.dataCompletamento || test.updatedAt)}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          p: 3
        }}
      >
        {/* Dati generali */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2,
              color: 'text.primary',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SchoolIcon fontSize="small" color="primary" />
            Dati Test
          </Typography>

          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  ID Test
                </TableCell>
                <TableCell align="right">
                  {test._id || 'N/A'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  Tipo
                </TableCell>
                <TableCell align="right">
                  <Chip 
                    label={test.tipo || 'N/A'} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  Data Inizio
                </TableCell>
                <TableCell align="right">
                  {formatDate(test.dataInizio || test.createdAt)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  Data Completamento
                </TableCell>
                <TableCell align="right">
                  {formatDate(test.dataCompletamento || test.updatedAt)}
                </TableCell>
              </TableRow>
              {test.analytics?.tempoTotale && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                    Tempo Impiegato
                  </TableCell>
                  <TableCell align="right">
                    {Math.floor(test.analytics.tempoTotale / 60)} min {Math.round(test.analytics.tempoTotale % 60)} sec
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            color: 'text.primary',
            fontWeight: 600
          }}
        >
          Profilo Cognitivo
        </Typography>
        
        {noPunteggi ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Sto tentando di recuperare i punteggi per questo test...
            </Alert>
            <Box sx={{ 
              p: 3, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.light, 0.1)
            }}>
              <Typography variant="subtitle1" gutterBottom>
                Possibili cause per la mancanza di punteggi:
              </Typography>
              <ul>
                <li>I dati sono memorizzati in una struttura diversa nel database</li>
                <li>Il backend non sta restituendo tutti i dati necessari</li>
                <li>I punteggi sono memorizzati in un documento separato (risultato) non collegato correttamente al test</li>
              </ul>
              <Typography variant="body2" sx={{ mt: 2 }}>
                ID Test: {test._id}<br />
                Stato: {test.status}<br />
                Tipo: {test.tipo}
              </Typography>
            </Box>
          </>
        ) : (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: 3
            }}
          >
            <Box 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Dimensioni Cognitive
              </Typography>
              <Tooltip title="I punteggi indicano lo scostamento dal centro verso uno dei due estremi. Un punteggio di 50 rappresenta un equilibrio tra le due tendenze.">
                <InfoOutlinedIcon color="action" />
              </Tooltip>
            </Box>

            {/* Verifica se abbiamo la struttura punteggiDimensioni */}
            {hasPunteggiDimensioni && (
              <Box>
                {Object.entries(resultData.punteggiDimensioni).map(([key, value]) => {
                  if (!value || !value.score) return null;
                  
                  const dimensionInfo = DIMENSIONS_MAPPING[key] || { 
                    name: key.charAt(0).toUpperCase() + key.slice(1), 
                    leftExtreme: 'Estremo Sinistro',
                    rightExtreme: 'Estremo Destro',
                    description: 'Descrizione non disponibile', 
                    color: '#757575'
                  };
                  
                  // Calcola lo scostamento per determinare la tendenza
                  const deviation = value.score - 50;
                  const tendencyDirection = deviation === 0 ? 'Centro' : 
                                        deviation < 0 ? dimensionInfo.leftExtreme : 
                                        dimensionInfo.rightExtreme;
                  const tendencyIntensity = getTendencyDescription(value.score);
                  
                  return (
                    <Box key={key} sx={{ mb: 4 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 1
                      }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: dimensionInfo.color 
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {dimensionInfo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({dimensionInfo.description})
                        </Typography>
                      </Box>
                      
                      <DeviationBar 
                        score={value.score} 
                        leftExtreme={dimensionInfo.leftExtreme} 
                        rightExtreme={dimensionInfo.rightExtreme}
                        color={dimensionInfo.color}
                      />
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        mt: 2
                      }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {tendencyIntensity} verso {tendencyDirection}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Punteggio: {value.score}/100 | Livello: {value.level || 'N/A'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={tendencyDirection} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(dimensionInfo.color, 0.1),
                            color: dimensionInfo.color,
                            fontWeight: 500
                          }}
                        />
                      </Box>
                      
                      {value.interpretation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {value.interpretation}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
            
            {/* Supporto per la vecchia struttura punteggi */}
            {hasPunteggi && !hasPunteggiDimensioni && (
              <Box>
                {Object.entries(punteggi).map(([key, value]) => {
                  if (value === undefined || value === null) return null;
                  
                  // Mappa le vecchie chiavi alle nuove dimensioni
                  let dimensionKey;
                  switch (key) {
                    case 'analitico': dimensionKey = 'elaborazione'; break;
                    case 'sistematico': dimensionKey = 'creativita'; break;
                    case 'verbale': dimensionKey = 'preferenzaVisiva'; break;
                    case 'impulsivo': dimensionKey = 'decisione'; break;
                    case 'dipendente': dimensionKey = 'autonomia'; break;
                    default: dimensionKey = key;
                  }
                  
                  const dimensionInfo = DIMENSIONS_MAPPING[dimensionKey] || { 
                    name: key.charAt(0).toUpperCase() + key.slice(1), 
                    leftExtreme: 'Estremo Sinistro',
                    rightExtreme: 'Estremo Destro',
                    description: 'Descrizione non disponibile', 
                    color: '#757575'
                  };
                  
                  // Determina il livello in base al punteggio
                  let level = 'N/A';
                  if (value !== undefined && value !== null) {
                    if (value < 40) level = 'Basso';
                    else if (value < 60) level = 'Medio';
                    else if (value < 80) level = 'Alto';
                    else level = 'Molto Alto';
                  }
                  
                  // Calcola lo scostamento per determinare la tendenza
                  const deviation = value - 50;
                  const tendencyDirection = deviation === 0 ? 'Centro' : 
                                        deviation < 0 ? dimensionInfo.leftExtreme : 
                                        dimensionInfo.rightExtreme;
                  const tendencyIntensity = getTendencyDescription(value);
                  
                  return (
                    <Box key={key} sx={{ mb: 4 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 1
                      }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: dimensionInfo.color 
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {dimensionInfo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({dimensionInfo.description})
                        </Typography>
                      </Box>
                      
                      <DeviationBar 
                        score={value} 
                        leftExtreme={dimensionInfo.leftExtreme} 
                        rightExtreme={dimensionInfo.rightExtreme}
                        color={dimensionInfo.color}
                      />
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        mt: 2
                      }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {tendencyIntensity} verso {tendencyDirection}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Punteggio: {value}/100 | Livello: {level}
                          </Typography>
                        </Box>
                        <Chip 
                          label={tendencyDirection} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(dimensionInfo.color, 0.1),
                            color: dimensionInfo.color,
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        )}

        {/* Raccomandazioni */}
        {(test.metadata?.profile?.recommendations || test.metadataCSI?.profiloCognitivo?.raccomandazioni) && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: 'text.primary',
                fontWeight: 600
              }}
            >
              Raccomandazioni
            </Typography>
            
            {/* Supporto per entrambe le strutture di raccomandazioni */}
            {(test.metadata?.profile?.recommendations || [])
              .concat(test.metadataCSI?.profiloCognitivo?.raccomandazioni || [])
              .map((rec, index) => (
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
              ))
            }
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default TestResultsView;