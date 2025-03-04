import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Grid,
  Alert,
  Card,
  CardContent,
  Stack,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { axiosInstance } from '../../../../services/axiosConfig';

const AssignedTestDetails = ({ test, onRevokeTest, loading = false }) => {
  const theme = useTheme();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showTestId, setShowTestId] = useState(false);
  const [fullTestData, setFullTestData] = useState(null);
  const [loadingFullData, setLoadingFullData] = useState(false);
  
  // Effetto per caricare dati completi del test se necessario
  useEffect(() => {
    if (test && test._id && !fullTestData) {
      fetchFullTestData(test._id);
    } else if (!test) {
      setFullTestData(null);
    }
  }, [test]);
  
  // Funzione per caricare i dati completi del test
  const fetchFullTestData = async (testId) => {
    // Se abbiamo già tutti i dati necessari, non carichiamo nuovamente
    if (
      test && 
      test.assignedBy && 
      test.assignedAt && 
      test.configurazione && 
      typeof test.attempts !== 'undefined'
    ) {
      setFullTestData(test);
      return;
    }
    
    setLoadingFullData(true);
    try {
      const response = await axiosInstance.get(`/tests/${testId}`);
      if (response.data && response.data.data && response.data.data.test) {
        console.debug('Loaded full test data:', response.data.data.test);
        setFullTestData({...test, ...response.data.data.test});
      } else {
        // Se non riusciamo a caricare i dati completi, usiamo quelli che abbiamo
        setFullTestData(test);
      }
    } catch (error) {
      console.error('Error loading full test data:', error);
      // In caso di errore, usiamo i dati parziali che abbiamo
      setFullTestData(test);
    } finally {
      setLoadingFullData(false);
    }
  };
  
  // Usa i dati completi o quelli parziali
  const displayTest = fullTestData || test;
  const isLoading = loading || loadingFullData;
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!displayTest) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
          p: 4,
          textAlign: 'center'
        }}
      >
        <AssignmentTurnedInIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Nessun test selezionato
        </Typography>
        <Typography variant="body2">
          Seleziona un test dalla lista per visualizzarne i dettagli
        </Typography>
      </Box>
    );
  }

  // Formatta la data
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

  // Ottiene info sullo stato
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'warning', 
          label: 'In attesa', 
          icon: <HourglassTopIcon />,
          description: 'Il test è stato assegnato ma non è ancora stato iniziato dallo studente.',
          progress: 0
        };
      case 'in_progress':
        return { 
          color: 'info', 
          label: 'In corso', 
          icon: <AccessTimeIcon />,
          description: 'Lo studente ha iniziato il test ma non l\'ha ancora completato.',
          progress: 50
        };
      case 'completed':
        return { 
          color: 'success', 
          label: 'Completato', 
          icon: <AssignmentTurnedInIcon />,
          description: 'Il test è stato completato dallo studente ed è possibile visualizzare i risultati.',
          progress: 100
        };
      default:
        return { 
          color: 'default', 
          label: 'Sconosciuto', 
          icon: <InfoOutlinedIcon />,
          description: 'Stato del test sconosciuto.',
          progress: 0
        };
    }
  };

  const statusInfo = getStatusInfo(displayTest.status);
  
  // Gestisce la copia dell'ID negli appunti
  const handleCopyId = () => {
    navigator.clipboard.writeText(displayTest._id)
      .then(() => {
        setShowTestId(true);
        setTimeout(() => setShowTestId(false), 2000);
      })
      .catch(err => console.error('Errore durante la copia: ', err));
  };
  
  // Gestisce l'apertura del dialogo di revoca
  const handleOpenRevokeDialog = () => {
    setShowRevokeDialog(true);
  };
  
  // Gestisce la chiusura del dialogo di revoca
  const handleCloseRevokeDialog = () => {
    setShowRevokeDialog(false);
  };
  
  // Gestisce la conferma della revoca
  const handleConfirmRevoke = () => {
    onRevokeTest(displayTest._id);
    setShowRevokeDialog(false);
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        p: 3
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3
        }}
      >
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              mb: 1
            }}
          >
            {displayTest.nome || `Test ${displayTest.tipo}`}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={statusInfo.label}
              color={statusInfo.color}
              icon={statusInfo.icon}
              sx={{ fontWeight: 500 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                ID: {showTestId ? displayTest._id : `${displayTest._id.substring(0, 8)}...`}
              </Typography>
              <Tooltip title="Copia ID">
                <IconButton size="small" onClick={handleCopyId}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Azioni 
        <Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleOpenRevokeDialog}
            disabled={displayTest.status === 'completed'}
            sx={{ 
              transition: 'all 0.2s',
              '&:hover:not(:disabled)': {
                bgcolor: alpha(theme.palette.error.main, 0.1)
              }
            }}
          >
            Revoca Test
          </Button>
        </Box>*/}
      </Box>

      {/* Barra di progresso dello stato */}
      <Box sx={{ mb: 3 }}>
        <LinearProgress 
          variant="determinate" 
          value={statusInfo.progress} 
          color={statusInfo.color}
          sx={{ height: 8, borderRadius: 1, mb: 1 }}
        />
        
        <Alert 
          severity={
            displayTest.status === 'pending' ? 'info' : 
            displayTest.status === 'in_progress' ? 'warning' : 
            'success'
          }
          sx={{ 
            mb: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {statusInfo.description}
        </Alert>
      </Box>

      {/* Dettagli del test */}
      <Grid container spacing={3}>
        {/* Colonna principale */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.primary.main
              }}
            >
              <EventAvailableIcon fontSize="small" />
              Informazioni sull'assegnazione
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Data di assegnazione
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(displayTest.assignedAt || displayTest.createdAt)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Assegnato da
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {displayTest.assignedBy ? 
                      (typeof displayTest.assignedBy === 'object' ? 
                        (displayTest.assignedBy.fullName || displayTest.assignedBy.username) : 
                        displayTest.assignedBy) :
                      'Informazione non disponibile'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ultimo tentativo
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {displayTest.lastStarted ? formatDate(displayTest.lastStarted) : 
                      (displayTest.updatedAt && displayTest.updatedAt !== displayTest.createdAt ?
                      `Aggiornato il ${formatDate(displayTest.updatedAt)}` :
                      'Nessun tentativo')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Numero di tentativi
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={displayTest.attempts || 0} 
                      size="small" 
                      color={displayTest.attempts > 0 ? "primary" : "default"}
                    />
                    <Typography variant="body2" color="text.secondary">
                      / {displayTest.configurazione?.tentativiMax || 1} massimi
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.primary.main
              }}
            >
              <SettingsIcon fontSize="small" />
              Configurazione del test
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tempo limite
                  </Typography>
                  <Box>
                    {displayTest.configurazione && 'tempoLimite' in displayTest.configurazione ? (
                      <Chip 
                        icon={<AccessTimeIcon />} 
                        label={`${displayTest.configurazione.tempoLimite} minuti`} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2">Non specificato</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Domande randomizzate
                  </Typography>
                  <Box>
                    <Chip 
                      label={displayTest.configurazione?.randomizzaDomande ? 'Sì' : 'No'} 
                      size="small" 
                      color={displayTest.configurazione?.randomizzaDomande ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Risultati immediati
                  </Typography>
                  <Box>
                    <Chip 
                      label={displayTest.configurazione?.mostraRisultatiImmediati ? 'Sì' : 'No'} 
                      size="small" 
                      color={displayTest.configurazione?.mostraRisultatiImmediati ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Versione
                  </Typography>
                  <Box>
                    <Chip 
                      label={displayTest.versione || '1.0.0'} 
                      size="small" 
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            {displayTest.descrizione && (
              <>
                <Divider sx={{ my: 3 }} />
                <Accordion 
                  disableGutters 
                  elevation={0}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}
                  >
                    <Typography variant="subtitle1">Descrizione del test</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">
                      {displayTest.descrizione}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </>
            )}
          </Paper>
        </Grid>

        {/* Colonna laterale */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Card dello studente */}
            <Card 
              variant="outlined"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: theme.palette.primary.main
                }
              }}
            >
              <CardContent>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: theme.palette.primary.main
                  }}
                >
                  <PersonIcon fontSize="small" />
                  Dettagli studente
                </Typography>
                
                <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Nome
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {displayTest.studentFullName || 'Nome studente non disponibile'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    ID Studente
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" fontWeight={500} sx={{ mr: 1 }}>
                      {displayTest.studentId}
                    </Typography>
                    <Tooltip title="Copia ID Studente">
                      <IconButton size="small" onClick={() => navigator.clipboard.writeText(displayTest.studentId)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {displayTest.studentEmail || 'Email non disponibile'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Card azione rapida */}
            <Card 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                bgcolor: displayTest.status === 'completed' 
                  ? alpha(theme.palette.success.main, 0.05)
                  : alpha(theme.palette.info.main, 0.05),
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: displayTest.status === 'completed' 
                    ? theme.palette.success.main 
                    : theme.palette.info.main
                }
              }}
            >
              <CardContent>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1,
                    color: displayTest.status === 'completed' 
                      ? theme.palette.success.main 
                      : theme.palette.info.main
                  }}
                >
                  {displayTest.status === 'completed' 
                    ? 'Test completato' 
                    : 'Azioni rapide'}
                </Typography>
                
                {displayTest.status === 'completed' ? (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="success"
                      fullWidth
                      startIcon={<AssignmentTurnedInIcon />}
                      sx={{ mb: 1 }}
                    >
                      Visualizza risultati
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Test completato il {formatDate(displayTest.dataCompletamento || displayTest.updatedAt)}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="info"
                      fullWidth
                      startIcon={<LinkIcon />}
                      sx={{ mb: 1 }}
                    >
                      Genera link diretto
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<DeleteOutlineIcon />}
                      onClick={handleOpenRevokeDialog}
                      sx={{ mb: 1 }}
                    >
                      Revoca test
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {displayTest.status === 'pending' 
                        ? 'Lo studente non ha ancora iniziato il test' 
                        : 'Lo studente ha iniziato il test ma non lo ha completato'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Card del promemoria */}
            <Card 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <CardContent>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <SchoolIcon fontSize="small" color="action" />
                  Promemoria
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lo studente può accedere al test assegnato dopo aver effettuato l'accesso alla 
                  piattaforma. Il test rimarrà disponibile fino al completamento o alla revoca.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      
      {/* Dialog di conferma revoca */}
      <Dialog
        open={showRevokeDialog}
        onClose={handleCloseRevokeDialog}
      >
        <DialogTitle>Conferma revoca test</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler revocare questo test? Questa azione non può essere annullata.
            Lo studente non potrà più accedere a questo test.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRevokeDialog}>Annulla</Button>
          <Button 
            onClick={handleConfirmRevoke} 
            color="error" 
            variant="contained"
          >
            Conferma revoca
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Componente per lo stato di caricamento
const LoadingState = () => {
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Skeleton variant="text" width="50%" height={40} sx={{ mb: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Skeleton variant="rounded" width={80} height={30} />
        <Skeleton variant="text" width="30%" />
      </Box>
      
      <Skeleton variant="rounded" height={10} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rounded" height={400} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rounded" height={180} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={180} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssignedTestDetails;