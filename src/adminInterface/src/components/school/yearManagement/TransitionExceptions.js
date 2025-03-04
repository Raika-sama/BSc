// src/components/school/yearManagement/TransitionExceptions.js
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Stack,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const EXCEPTION_TYPES = {
  RETAINED: 'retained',      // Bocciato/trattenuto (stesso anno)
  SECTION_CHANGE: 'section_change', // Cambio sezione (stesso anno ma sezione diversa)
  CUSTOM: 'custom',          // Personalizzato (anno e sezione specifici)
  TRANSFERRED: 'transferred' // Trasferito (esce dalla scuola)
};

const TransitionExceptions = ({ transitionData, exceptions, onChange }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exceptionType, setExceptionType] = useState(EXCEPTION_TYPES.RETAINED);
  const [destinationYear, setDestinationYear] = useState(null);
  const [destinationSection, setDestinationSection] = useState(null);
  const [reason, setReason] = useState('');
  
  const { currentClasses, newClasses, promotedStudents } = transitionData || {};
  
  // Extract all available sections from the new classes
  const availableSections = React.useMemo(() => {
    if (!newClasses) return [];
    
    // Create a map of year -> sections
    const sectionsByYear = {};
    
    newClasses.forEach(cls => {
      if (!sectionsByYear[cls.year]) {
        sectionsByYear[cls.year] = [];
      }
      if (!sectionsByYear[cls.year].includes(cls.section)) {
        sectionsByYear[cls.year].push(cls.section);
      }
    });
    
    return sectionsByYear;
  }, [newClasses]);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (selectedStudent) {
      setExceptionType(EXCEPTION_TYPES.RETAINED);
      setDestinationYear(selectedStudent.currentYear);
      setDestinationSection(selectedStudent.currentSection);
      setReason('');
    }
  }, [selectedStudent]);
  
  const handleOpenDialog = (student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
  };
  
  const handleExceptionTypeChange = (event) => {
    const newType = event.target.value;
    setExceptionType(newType);
    
    // Update destination values based on type
    if (newType === EXCEPTION_TYPES.RETAINED) {
      setDestinationYear(selectedStudent.currentYear);
      setDestinationSection(selectedStudent.currentSection);
    } else if (newType === EXCEPTION_TYPES.SECTION_CHANGE) {
      setDestinationYear(selectedStudent.currentYear);
      setDestinationSection('');
    } else if (newType === EXCEPTION_TYPES.TRANSFERRED) {
      setDestinationYear(null);
      setDestinationSection(null);
    }
  };
  
  const handleAddException = () => {
    if (!selectedStudent) return;
    
    const newException = {
      studentId: selectedStudent.id,
      firstName: selectedStudent.firstName,
      lastName: selectedStudent.lastName,
      currentYear: selectedStudent.currentYear,
      currentSection: selectedStudent.currentSection,
      type: exceptionType,
      destinationYear: exceptionType !== EXCEPTION_TYPES.TRANSFERRED ? destinationYear : null,
      destinationSection: exceptionType !== EXCEPTION_TYPES.TRANSFERRED ? destinationSection : null,
      reason: reason,
      timestamp: new Date().toISOString()
    };
    
    // Add to exceptions list
    onChange([...exceptions, newException]);
    
    // Close dialog
    handleCloseDialog();
  };
  
  const handleRemoveException = (studentId) => {
    onChange(exceptions.filter(ex => ex.studentId !== studentId));
  };
  
  const getExceptionLabel = (type) => {
    switch (type) {
      case EXCEPTION_TYPES.RETAINED:
        return 'Bocciato';
      case EXCEPTION_TYPES.SECTION_CHANGE:
        return 'Cambio Sezione';
      case EXCEPTION_TYPES.CUSTOM:
        return 'Personalizzato';
      case EXCEPTION_TYPES.TRANSFERRED:
        return 'Trasferito';
      default:
        return 'Sconosciuto';
    }
  };
  
  const getExceptionColor = (type) => {
    switch (type) {
      case EXCEPTION_TYPES.RETAINED:
        return 'error';
      case EXCEPTION_TYPES.SECTION_CHANGE:
        return 'warning';
      case EXCEPTION_TYPES.CUSTOM:
        return 'info';
      case EXCEPTION_TYPES.TRANSFERRED:
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Check if a student has an exception
  const hasException = (studentId) => {
    return exceptions.some(ex => ex.studentId === studentId);
  };
  
  // Find available years
  const availableYears = React.useMemo(() => {
    if (!newClasses) return [];
    
    return [...new Set(newClasses.map(cls => cls.year))].sort((a, b) => a - b);
  }, [newClasses]);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Gestione Eccezioni
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        In questa sezione puoi gestire le eccezioni alla promozione standard degli studenti,
        come bocciature, cambi di sezione o trasferimenti.
      </Alert>
      
      <Grid container spacing={3}>
        {/* Eccezioni configurate */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Eccezioni configurate" 
              subheader={`${exceptions.length} eccezioni`}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={() => onChange([])}
                  disabled={exceptions.length === 0}
                >
                  Rimuovi Tutte
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {exceptions.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Studente</TableCell>
                        <TableCell>Classe Attuale</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Destinazione</TableCell>
                        <TableCell>Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exceptions.map((exception) => (
                        <TableRow key={exception.studentId}>
                          <TableCell>
                            {exception.firstName} {exception.lastName}
                          </TableCell>
                          <TableCell>
                            {exception.currentYear}ª {exception.currentSection}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getExceptionLabel(exception.type)}
                              color={getExceptionColor(exception.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {exception.type === EXCEPTION_TYPES.TRANSFERRED ? (
                              <Typography variant="body2" color="text.secondary">
                                Trasferito
                              </Typography>
                            ) : (
                              <>
                                {exception.destinationYear}ª {exception.destinationSection}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveException(exception.studentId)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nessuna eccezione configurata. Gli studenti saranno promossi secondo lo schema standard.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Lista studenti */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader 
              title="Studenti da promuovere" 
              subheader={`${promotedStudents?.length || 0} studenti`}
            />
            <Divider />
            <CardContent>
              {promotedStudents && promotedStudents.length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Studente</TableCell>
                        <TableCell>Classe Attuale</TableCell>
                        <TableCell>Classe Futura</TableCell>
                        <TableCell>Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {promotedStudents.map((student) => (
                        <TableRow 
                          key={student.id}
                          sx={{
                            backgroundColor: hasException(student.id) ? 'rgba(255, 0, 0, 0.05)' : 'inherit'
                          }}
                        >
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>
                            {student.currentYear}ª {student.currentSection}
                          </TableCell>
                          <TableCell>
                            {hasException(student.id) ? (
                              <Chip
                                label={getExceptionLabel(
                                  exceptions.find(ex => ex.studentId === student.id).type
                                )}
                                color={getExceptionColor(
                                  exceptions.find(ex => ex.studentId === student.id).type
                                )}
                                size="small"
                              />
                            ) : (
                              <Box display="flex" alignItems="center">
                                <Typography variant="body2">
                                  {student.newYear}ª {student.newSection}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant={hasException(student.id) ? "outlined" : "contained"}
                              color={hasException(student.id) ? "error" : "primary"}
                              onClick={() => handleOpenDialog(student)}
                              startIcon={hasException(student.id) ? <EditIcon /> : <AddIcon />}
                            >
                              {hasException(student.id) ? "Modifica" : "Eccezione"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nessuno studente disponibile per la promozione.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Dialog per aggiungere/modificare eccezioni */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {hasException(selectedStudent?.id) ? "Modifica eccezione" : "Aggiungi eccezione"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Configura un'eccezione per {selectedStudent?.firstName} {selectedStudent?.lastName}.
          </DialogContentText>
          
          {selectedStudent && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2">
                    Classe attuale: {selectedStudent.currentYear}ª {selectedStudent.currentSection}
                  </Typography>
                  <Typography variant="subtitle2">
                    Promozione standard: {selectedStudent.newYear}ª {selectedStudent.newSection}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="exception-type-label">Tipo di eccezione</InputLabel>
                  <Select
                    labelId="exception-type-label"
                    id="exception-type"
                    value={exceptionType}
                    label="Tipo di eccezione"
                    onChange={handleExceptionTypeChange}
                  >
                    <MenuItem value={EXCEPTION_TYPES.RETAINED}>
                      Bocciato (stessa classe)
                    </MenuItem>
                    <MenuItem value={EXCEPTION_TYPES.SECTION_CHANGE}>
                      Cambio sezione (stesso anno)
                    </MenuItem>
                    <MenuItem value={EXCEPTION_TYPES.CUSTOM}>
                      Personalizzato (anno e sezione specifici)
                    </MenuItem>
                    <MenuItem value={EXCEPTION_TYPES.TRANSFERRED}>
                      Trasferito (esce dalla scuola)
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {exceptionType !== EXCEPTION_TYPES.TRANSFERRED && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="destination-year-label">Anno destinazione</InputLabel>
                      <Select
                        labelId="destination-year-label"
                        id="destination-year"
                        value={destinationYear || ''}
                        label="Anno destinazione"
                        onChange={(e) => setDestinationYear(e.target.value)}
                        disabled={exceptionType === EXCEPTION_TYPES.RETAINED}
                      >
                        {availableYears.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}ª
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="destination-section-label">Sezione destinazione</InputLabel>
                      <Select
                        labelId="destination-section-label"
                        id="destination-section"
                        value={destinationSection || ''}
                        label="Sezione destinazione"
                        onChange={(e) => setDestinationSection(e.target.value)}
                        disabled={exceptionType === EXCEPTION_TYPES.RETAINED}
                      >
                        {destinationYear && availableSections[destinationYear] && 
                          availableSections[destinationYear].map((section) => (
                            <MenuItem key={section} value={section}>
                              {section}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="reason"
                  label="Motivazione"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Inserisci una motivazione per questa eccezione"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            onClick={handleAddException} 
            variant="contained"
            disabled={
              !selectedStudent ||
              (exceptionType !== EXCEPTION_TYPES.TRANSFERRED && (!destinationYear || !destinationSection))
            }
          >
            {hasException(selectedStudent?.id) ? "Aggiorna" : "Aggiungi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransitionExceptions;