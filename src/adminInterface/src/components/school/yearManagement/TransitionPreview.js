// src/components/school/yearManagement/TransitionPreview.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  Tabs,
  Tab,
  Alert,
  Badge
} from '@mui/material';
import {
  School as SchoolIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const TransitionPreview = ({ transitionData, loading, error }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedClass, setExpandedClass] = useState(null);
  
  // Se non ci sono dati o c'è un errore, mostra un messaggio appropriato
  if (!transitionData) {
    return (
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Nessuna anteprima disponibile. Completa la selezione degli anni accademici e procedi.
        </Typography>
      </Box>
    );
  }
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleExpandClass = (classId) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };
  
  const { currentClasses, newClasses, promotedStudents, graduatingStudents, warnings } = transitionData;
  
  // Count various statistics
  const totalCurrentClasses = currentClasses.length;
  const totalNewClasses = newClasses.length;
  const totalStudents = promotedStudents.length + graduatingStudents.length;
  const totalPromoted = promotedStudents.length;
  const totalGraduating = graduatingStudents.length;
  
  // Group classes by year and section
  const groupClassesByYear = (classes) => {
    const grouped = {};
    
    classes.forEach(cls => {
      const key = cls.year;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(cls);
    });
    
    return Object.entries(grouped).sort((a, b) => a[0] - b[0]);
  };
  
  const currentClassesByYear = groupClassesByYear(currentClasses);
  const newClassesByYear = groupClassesByYear(newClasses);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Anteprima della Transizione Anno
      </Typography>
      
      {/* Riepilogo numerico */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" align="center" color="primary">
                {totalCurrentClasses}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Classi attuali
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" align="center" color="primary">
                {totalNewClasses}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Nuove classi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" align="center" color="success.main">
                {totalPromoted}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Studenti promossi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" align="center" color="info.main">
                {totalGraduating}
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Studenti diplomati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Avvisi */}
      {warnings && warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Ci sono {warnings.length} avvisi relativi alla transizione:
          </Typography>
          <List dense>
            {warnings.map((warning, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: '30px' }}>
                  <WarningIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText primary={warning.message} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
      
      {/* Tabs per i diversi tipi di visualizzazione */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="transition preview tabs">
          <Tab label="Classi" />
          <Tab label="Studenti" />
          <Tab 
            label={
              <Badge badgeContent={warnings?.length || 0} color="warning">
                Avvisi
              </Badge>
            } 
          />
        </Tabs>
      </Box>
      
      {/* Tab Classi */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* Colonna classi attuali */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Classi Anno Corrente
            </Typography>
            
            {currentClassesByYear.map(([year, classes]) => (
              <Box key={year} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Anno {year}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Classe</TableCell>
                        <TableCell>Sezione</TableCell>
                        <TableCell>Studenti</TableCell>
                        <TableCell>Docente</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classes.map((cls) => (
                        <TableRow 
                          key={cls.id} 
                          hover
                          onClick={() => handleExpandClass(cls.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{cls.year}</TableCell>
                          <TableCell>{cls.section}</TableCell>
                          <TableCell>{cls.students?.length || 0}</TableCell>
                          <TableCell>
                            {cls.mainTeacher ? 
                              `${cls.mainTeacherName || 'Docente'} ${cls.mainTeacherLastName || ''}` : 
                              'Non assegnato'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Grid>
          
          {/* Colonna nuove classi */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Classi Anno Nuovo
            </Typography>
            
            {newClassesByYear.map(([year, classes]) => (
              <Box key={year} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Anno {year}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Classe</TableCell>
                        <TableCell>Sezione</TableCell>
                        <TableCell>Studenti</TableCell>
                        <TableCell>Docente</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classes.map((cls) => (
                        <TableRow 
                          key={cls.id} 
                          hover
                          onClick={() => handleExpandClass(cls.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{cls.year}</TableCell>
                          <TableCell>{cls.section}</TableCell>
                          <TableCell>{cls.studentCount || 0}</TableCell>
                          <TableCell>
                            {cls.mainTeacher ? 
                              `${cls.mainTeacherName || 'Docente'} ${cls.mainTeacherLastName || ''}` : 
                              'Non assegnato'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Grid>
        </Grid>
      )}
      
      {/* Tab Studenti */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Studenti promossi */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Studenti Promossi ({promotedStudents.length})
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Cognome</TableCell>
                    <TableCell>Classe Attuale</TableCell>
                    <TableCell align="center">
                      <ArrowForwardIcon fontSize="small" />
                    </TableCell>
                    <TableCell>Nuova Classe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promotedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.firstName}</TableCell>
                      <TableCell>{student.lastName}</TableCell>
                      <TableCell>
                        {student.currentYear}ª {student.currentSection}
                      </TableCell>
                      <TableCell align="center">
                        <ArrowForwardIcon fontSize="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        {student.newYear}ª {student.newSection}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          {/* Studenti diplomati */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Studenti Diplomati/In Uscita ({graduatingStudents.length})
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Cognome</TableCell>
                    <TableCell>Classe Attuale</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {graduatingStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.firstName}</TableCell>
                      <TableCell>{student.lastName}</TableCell>
                      <TableCell>
                        {student.currentYear}ª {student.currentSection}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={student.status === 'graduated' ? 'Diplomato' : 'In uscita'} 
                          color="info" 
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}
      
      {/* Tab Avvisi */}
      {activeTab === 2 && (
        <Box>
          {warnings && warnings.length > 0 ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Avvisi di Sistema ({warnings.length})
              </Typography>
              
              <List>
                {warnings.map((warning, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ 
                      bgcolor: 'warning.light', 
                      borderRadius: 1, 
                      mb: 1,
                      opacity: 0.9
                    }}
                  >
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={warning.message} 
                      secondary={warning.details || ''}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Questi avvisi indicano potenziali problemi o situazioni da verificare durante la transizione. 
                Puoi gestire eventuali eccezioni nel prossimo passaggio.
              </Alert>
            </Box>
          ) : (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Non ci sono avvisi per questa transizione. Tutto sembra in ordine!
            </Alert>
          )}
        </Box>
      )}
      
      {/* Dettagli classe quando espansa */}
      <Collapse in={!!expandedClass} sx={{ mt: 3 }}>
        {expandedClass && (
          <Card variant="outlined">
            <CardHeader 
              title={
                <>
                  Dettagli Classe 
                  {currentClasses.find(c => c.id === expandedClass)?.year || 
                   newClasses.find(c => c.id === expandedClass)?.year}
                  {currentClasses.find(c => c.id === expandedClass)?.section || 
                   newClasses.find(c => c.id === expandedClass)?.section}
                </>
              }
              action={
                <IconButton onClick={() => setExpandedClass(null)}>
                  <ExpandLessIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Informazioni Classe
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ClassIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Anno e Sezione"
                        secondary={`${currentClasses.find(c => c.id === expandedClass)?.year || 
                                     newClasses.find(c => c.id === expandedClass)?.year}° 
                                    ${currentClasses.find(c => c.id === expandedClass)?.section || 
                                     newClasses.find(c => c.id === expandedClass)?.section}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Docente Principale"
                        secondary={
                          currentClasses.find(c => c.id === expandedClass)?.mainTeacherName || 
                          newClasses.find(c => c.id === expandedClass)?.mainTeacherName || 
                          'Non assegnato'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Studenti"
                        secondary={
                          (currentClasses.find(c => c.id === expandedClass)?.students?.length || 
                           newClasses.find(c => c.id === expandedClass)?.studentCount || 0) +
                          ' studenti'
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Note
                  </Typography>
                  
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {currentClasses.find(c => c.id === expandedClass)?.notes || 
                       newClasses.find(c => c.id === expandedClass)?.notes || 
                       'Nessuna nota disponibile per questa classe.'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Collapse>
    </Box>
  );
};

export default TransitionPreview;