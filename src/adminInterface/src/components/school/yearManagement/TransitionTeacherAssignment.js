// src/components/school/yearManagement/TransitionTeacherAssignment.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Chip,
  TextField,
  Autocomplete,
  Avatar,
  ListItemAvatar,
  ListItemText,
  List,
  ListItem,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Sync as SyncIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { axiosInstance } from '../../../services/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';

const TransitionTeacherAssignment = ({ 
  transitionData, 
  teacherAssignments, 
  school, 
  onChange 
}) => {
  const { showNotification } = useNotification();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { newClasses } = transitionData || {};
  
  // Fetch available teachers from the school
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!school) return;
      
      setLoading(true);
      try {
        // Get teachers from school.users
        const teachers = school.users
          .filter(user => user.user && (user.role === 'teacher' || user.role === 'admin'))
          .map(user => ({
            id: user.user._id,
            name: `${user.user.firstName || ''} ${user.user.lastName || ''}`,
            email: user.user.email,
            role: user.role
          }));
        
        setAvailableTeachers(teachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        showNotification('Errore nel caricamento dei docenti', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, [school, showNotification]);
  
  const handleOpenDialog = (classData) => {
    setSelectedClass(classData);
    
    // Pre-select the current teacher assignment if it exists
    const currentTeacherId = teacherAssignments[classData.id];
    const teacher = availableTeachers.find(t => t.id === currentTeacherId);
    setSelectedTeacher(teacher || null);
    
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClass(null);
    setSelectedTeacher(null);
    setSearchQuery('');
  };
  
  const handleAssignTeacher = () => {
    if (!selectedClass || !selectedTeacher) return;
    
    // Update the teacher assignments
    const newAssignments = { ...teacherAssignments };
    newAssignments[selectedClass.id] = selectedTeacher.id;
    onChange(newAssignments);
    
    handleCloseDialog();
  };
  
  const handleRemoveTeacher = (classId) => {
    // Remove teacher assignment
    const newAssignments = { ...teacherAssignments };
    delete newAssignments[classId];
    onChange(newAssignments);
  };
  
  const getTeacherName = (teacherId) => {
    const teacher = availableTeachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Non assegnato';
  };
  
  // Group classes by year
  const classesByYear = React.useMemo(() => {
    if (!newClasses) return {};
    
    const grouped = {};
    newClasses.forEach(cls => {
      if (!grouped[cls.year]) {
        grouped[cls.year] = [];
      }
      grouped[cls.year].push(cls);
    });
    
    // Sort classes by section within each year
    Object.keys(grouped).forEach(year => {
      grouped[year].sort((a, b) => a.section.localeCompare(b.section));
    });
    
    return grouped;
  }, [newClasses]);
  
  // Filter teachers by search query
  const filteredTeachers = React.useMemo(() => {
    if (!searchQuery.trim()) return availableTeachers;
    
    const query = searchQuery.toLowerCase();
    return availableTeachers.filter(teacher => 
      teacher.name.toLowerCase().includes(query) || 
      teacher.email.toLowerCase().includes(query)
    );
  }, [availableTeachers, searchQuery]);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Assegnazione Docenti
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        In questa sezione puoi assegnare i docenti principali alle nuove classi per il prossimo anno accademico.
        I docenti attuali sono proposti di default, ma puoi modificarli se necessario.
      </Alert>
      
      {/* Table of classes grouped by year */}
      {Object.entries(classesByYear).map(([year, classes]) => (
        <Card key={year} variant="outlined" sx={{ mb: 3 }}>
          <CardHeader 
            title={`Classi ${year}° Anno`} 
            subheader={`${classes.length} classi`}
          />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Classe</TableCell>
                    <TableCell>Provenienza</TableCell>
                    <TableCell>Studenti</TableCell>
                    <TableCell>Docente Attuale</TableCell>
                    <TableCell>Docente Nuovo Anno</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        {cls.year}ª {cls.section}
                      </TableCell>
                      <TableCell>
                        {cls.sourceClass ? (
                          <Typography variant="body2">
                            {cls.sourceClass.year}ª {cls.sourceClass.section}
                          </Typography>
                        ) : (
                          <Chip label="Nuova classe" size="small" color="primary" />
                        )}
                      </TableCell>
                      <TableCell>
                        {cls.studentCount || 0}
                      </TableCell>
                      <TableCell>
                        {cls.mainTeacherName ? (
                          <Tooltip title={cls.mainTeacherEmail || ''}>
                            <Typography variant="body2">
                              {cls.mainTeacherName}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non assegnato
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacherAssignments[cls.id] ? (
                          <Chip 
                            label={getTeacherName(teacherAssignments[cls.id])}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip 
                            label="Da assegnare"
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog(cls)}
                          startIcon={<PersonIcon />}
                        >
                          Assegna
                        </Button>
                        {teacherAssignments[cls.id] && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveTeacher(cls.id)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
      
      {/* Dialog for teacher assignment */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assegna Docente per {selectedClass ? `${selectedClass.year}ª ${selectedClass.section}` : ''}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Seleziona il docente principale per questa classe per il nuovo anno accademico.
          </DialogContentText>
          
          {selectedClass && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2">
                    Classe: {selectedClass.year}ª {selectedClass.section}
                  </Typography>
                  {selectedClass.mainTeacherName && (
                    <Typography variant="subtitle2">
                      Docente attuale: {selectedClass.mainTeacherName}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cerca docente"
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{ mb: 2 }}
                />
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : (
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((teacher) => (
                          <ListItem
                            key={teacher.id}
                            button
                            selected={selectedTeacher?.id === teacher.id}
                            onClick={() => setSelectedTeacher(teacher)}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <PersonIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={teacher.name}
                              secondary={teacher.email}
                            />
                            {selectedTeacher?.id === teacher.id && (
                              <CheckIcon color="success" />
                            )}
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText 
                            primary="Nessun docente trovato" 
                            secondary="Prova con una ricerca diversa" 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            onClick={handleAssignTeacher} 
            variant="contained"
            disabled={!selectedTeacher}
          >
            Assegna
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransitionTeacherAssignment;