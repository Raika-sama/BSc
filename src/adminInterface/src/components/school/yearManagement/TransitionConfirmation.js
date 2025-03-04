// src/components/school/yearManagement/TransitionConfirmation.js
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Class as ClassIcon,
  SwapHoriz as SwapHorizIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const TransitionConfirmation = ({ 
  fromYear, 
  toYear, 
  transitionData, 
  exceptions, 
  teacherAssignments 
}) => {
  if (!fromYear || !toYear || !transitionData) {
    return (
      <Alert severity="warning">
        <AlertTitle>Dati incompleti</AlertTitle>
        Completa tutti i passaggi precedenti prima di procedere alla conferma.
      </Alert>
    );
  }
  
  const { currentClasses, newClasses, promotedStudents, graduatingStudents } = transitionData;
  
  // Count statistics
  const totalCurrentClasses = currentClasses.length;
  const totalNewClasses = newClasses.length;
  const totalStudents = promotedStudents.length + graduatingStudents.length;
  const totalPromoted = promotedStudents.length - exceptions.filter(e => e.type !== 'section_change').length;
  const totalGraduating = graduatingStudents.length;
  const totalExceptions = exceptions.length;
  const totalTeacherAssignments = Object.keys(teacherAssignments).length;
  const unassignedTeachers = newClasses.filter(cls => !teacherAssignments[cls.id]).length;
  
  const formatYearDisplay = (yearString) => {
    if (!yearString) return '';
    return yearString; // Anno nel formato originale (es. "2023/2024")
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Conferma Transizione Anno
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>Attenzione</AlertTitle>
        Stai per eseguire la transizione dall'anno accademico {formatYearDisplay(fromYear.year)} all'anno {formatYearDisplay(toYear.year)}.
        Questa operazione non può essere annullata. Verifica con attenzione i dati prima di procedere.
      </Alert>
      
      {/* Riepilogo anni accademici */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SchoolIcon color="primary" />
                <Typography variant="h6">
                  Anno Corrente
                </Typography>
              </Stack>
              <Typography variant="h5" color="primary">
                {formatYearDisplay(fromYear.year)}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                Stato: {fromYear.status === 'active' ? 'Attivo' : fromYear.status}
              </Typography>
              <Typography variant="body2">
                Classi: {totalCurrentClasses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ArrowForwardIcon fontSize="large" color="action" />
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SchoolIcon color="success" />
                <Typography variant="h6">
                  Anno Nuovo
                </Typography>
              </Stack>
              <Typography variant="h5" color="success.main">
                {formatYearDisplay(toYear.year)}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                Stato: {toYear.status} (diventerà 'active')
              </Typography>
              <Typography variant="body2">
                Classi: {totalNewClasses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Riepilogo numerico */}
      <Typography variant="subtitle1" gutterBottom>
        Riepilogo Modifiche
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ClassIcon color="primary" />
              <Typography variant="subtitle2">
                Classi
              </Typography>
            </Stack>
            <List dense disablePadding>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalCurrentClasses} classi attuali`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalNewClasses} classi nel nuovo anno`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${newClasses.filter(c => c.year === 1).length} classi prime`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon color="primary" />
              <Typography variant="subtitle2">
                Studenti
              </Typography>
            </Stack>
            <List dense disablePadding>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalStudents} studenti totali`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalPromoted} studenti promossi`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalGraduating} studenti diplomati/in uscita`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SwapHorizIcon color="primary" />
              <Typography variant="subtitle2">
                Modifiche
              </Typography>
            </Stack>
            <List dense disablePadding>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalExceptions} eccezioni configurate`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${totalTeacherAssignments} docenti assegnati`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemText 
                  primary={`${unassignedTeachers} classi senza docente`}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    color: unassignedTeachers > 0 ? 'error' : 'text.primary'
                  }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Avvisi */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Controlli pre-transizione
        </Typography>
        
        <List>
          {/* Controllo 1: Tutti i docenti assegnati */}
          <ListItem sx={{ 
            bgcolor: unassignedTeachers > 0 ? 'error.light' : 'success.light', 
            borderRadius: 1,
            mb: 1
          }}>
            <ListItemIcon>
              {unassignedTeachers > 0 ? 
                <WarningIcon color="error" /> : 
                <CheckCircleIcon color="success" />
              }
            </ListItemIcon>
            <ListItemText 
              primary={unassignedTeachers > 0 ? 
                `Ci sono ${unassignedTeachers} classi senza docente assegnato` : 
                "Tutte le classi hanno un docente assegnato"
              }
              secondary={unassignedTeachers > 0 ? 
                "Si consiglia di assegnare un docente a tutte le classi" : 
                "Ottimo! Tutte le classi hanno un docente principale"
              }
            />
          </ListItem>
          
          {/* Controllo 2: Gestione eccezioni */}
          <ListItem sx={{ 
            bgcolor: 'info.light', 
            borderRadius: 1,
            mb: 1
          }}>
            <ListItemIcon>
              <InfoIcon color="info" />
            </ListItemIcon>
            <ListItemText 
              primary={`${totalExceptions} eccezioni configurate`}
              secondary={totalExceptions > 0 ? 
                "Le eccezioni configurate saranno applicate durante la transizione" : 
                "Nessuna eccezione configurata, tutti gli studenti saranno promossi normalmente"
              }
            />
          </ListItem>
          
          {/* Controllo 3: Anno di destinazione */}
          <ListItem sx={{ 
            bgcolor: toYear.status !== 'planned' ? 'warning.light' : 'success.light', 
            borderRadius: 1
          }}>
            <ListItemIcon>
              {toYear.status !== 'planned' ? 
                <WarningIcon color="warning" /> : 
                <CheckCircleIcon color="success" />
              }
            </ListItemIcon>
            <ListItemText 
              primary={`Anno di destinazione: ${formatYearDisplay(toYear.year)} (${toYear.status})`}
              secondary={toYear.status !== 'planned' ? 
                "Attenzione: l'anno di destinazione non è in stato 'planned'" : 
                "L'anno di destinazione è in stato 'planned' e diventerà 'active'"
              }
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default TransitionConfirmation;