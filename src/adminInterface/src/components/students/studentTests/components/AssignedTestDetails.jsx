import React from 'react';
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
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PersonIcon from '@mui/icons-material/Person';

const AssignedTestDetails = ({ test, onRevokeTest }) => {
  const theme = useTheme();
  
  if (!test) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary'
        }}
      >
        <Typography variant="body1">
          Seleziona un test per visualizzarne i dettagli
        </Typography>
      </Box>
    );
  }

  // Formatta la data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ottiene info sullo stato
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'warning', 
          label: 'In attesa', 
          icon: <HourglassTopIcon />,
          description: 'Il test è stato assegnato ma non è ancora stato iniziato dallo studente.'
        };
      case 'in_progress':
        return { 
          color: 'info', 
          label: 'In corso', 
          icon: <AccessTimeIcon />,
          description: 'Lo studente ha iniziato il test ma non l\'ha ancora completato.'
        };
      case 'completed':
        return { 
          color: 'success', 
          label: 'Completato', 
          icon: null,
          description: 'Il test è stato completato dallo studente.'
        };
      default:
        return { 
          color: 'default', 
          label: 'Sconosciuto', 
          icon: null,
          description: 'Stato del test sconosciuto.'
        };
    }
  };

  const statusInfo = getStatusInfo(test.status);

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
            Test {test.tipo}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={statusInfo.label}
              color={statusInfo.color}
              icon={statusInfo.icon}
              sx={{ fontWeight: 500 }}
            />
            <Typography variant="body2" color="text.secondary">
              ID: {test._id}
            </Typography>
          </Box>
        </Box>

        {/* Azioni */}
        <Box>
          <Button
            variant="outlined"
            color="error"
            onClick={() => onRevokeTest(test._id)}
            disabled={test.status === 'completed'}
          >
            Revoca Test
          </Button>
        </Box>
      </Box>

      {/* Riepilogo stato */}
      <Alert 
        severity={
          test.status === 'pending' ? 'info' : 
          test.status === 'in_progress' ? 'warning' : 
          'success'
        }
        sx={{ mb: 3 }}
      >
        {statusInfo.description}
      </Alert>

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
              height: '100%'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <EventAvailableIcon fontSize="small" />
              Informazioni sull'assegnazione
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data di assegnazione
                </Typography>
                <Typography variant="body1">
                  {formatDate(test.assignedAt)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Assegnato da
                </Typography>
                <Typography variant="body1">
                  {test.assignedBy?.fullName || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Ultimo tentativo
                </Typography>
                <Typography variant="body1">
                  {test.attempts > 0 ? formatDate(test.lastStarted) : 'Nessun tentativo'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Numero di tentativi
                </Typography>
                <Typography variant="body1">
                  {test.attempts} / {test.configurazione?.tentativiMax || 1}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <SettingsIcon fontSize="small" />
              Configurazione del test
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tempo limite
                </Typography>
                <Typography variant="body1">
                  {test.configurazione?.tempoLimite ? `${test.configurazione.tempoLimite} minuti` : 'Nessun limite'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Domande randomizzate
                </Typography>
                <Typography variant="body1">
                  {test.configurazione?.randomizzaDomande ? 'Sì' : 'No'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Risultati immediati
                </Typography>
                <Typography variant="body1">
                  {test.configurazione?.mostraRisultatiImmediati ? 'Sì' : 'No'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Versione
                </Typography>
                <Typography variant="body1">
                  {test.versione || '1.0.0'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Colonna laterale */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Card dello studente */}
            <Card 
              variant="outlined"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }}
            >
              <CardContent>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <PersonIcon fontSize="small" />
                  Dettagli studente
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Nome
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {test.studentFullName || 'Nome studente non disponibile'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  ID Studente
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {test.studentId}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {test.studentEmail || 'Email non disponibile'}
                </Typography>
              </CardContent>
            </Card>

            {/* Card del promemoria */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
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
    </Box>
  );
};

export default AssignedTestDetails;