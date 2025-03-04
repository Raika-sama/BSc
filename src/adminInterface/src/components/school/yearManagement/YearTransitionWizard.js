// src/components/school/yearManagement/YearTransitionWizard.js
import React, { useState, useEffect } from 'react';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  CircularProgress,
  Divider,
  Alert,
  Container,
  Grid
} from '@mui/material';
import { useSchool } from '../../../context/SchoolContext';
import { useClass } from '../../../context/ClassContext';
import { useNotification } from '../../../context/NotificationContext';
import TransitionSelectYear from './TransitionSelectYear';
import TransitionPreview from './TransitionPreview';
import TransitionExceptions from './TransitionExceptions';
import TransitionTeacherAssignment from './TransitionTeacherAssignment';
import TransitionConfirmation from './TransitionConfirmation';
import { axiosInstance } from '../../../services/axiosConfig';

const steps = [
  'Seleziona anno accademico',
  'Anteprima classi',
  'Gestione eccezioni',
  'Assegnazione docenti',
  'Conferma'
];

const YearTransitionWizard = ({ school, onComplete }) => {
  const { showNotification } = useNotification();
  const { getSchoolById } = useSchool();
  const { getClassesByAcademicYear } = useClass();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dati per la transizione
  const [fromYear, setFromYear] = useState(null);
  const [toYear, setToYear] = useState(null);
  const [transitionData, setTransitionData] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState({});
  
  // Funzione per ottenere l'anteprima della transizione
  const fetchTransitionPreview = async () => {
    if (!fromYear || !toYear) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/schools/${school._id}/transition-preview`, {
        params: {
          fromYear: fromYear.year,
          toYear: toYear.year
        }
      });
      
      if (response.data.status === 'success') {
        setTransitionData(response.data.data);
        
        // Inizializza la lista delle eccezioni vuota
        const initialExceptions = [];
        setExceptions(initialExceptions);
        
        // Inizializza le assegnazioni docenti con quelle predefinite
        const initialTeacherAssignments = {};
        response.data.data.newClasses.forEach(cls => {
          initialTeacherAssignments[cls.id] = cls.mainTeacher;
        });
        setTeacherAssignments(initialTeacherAssignments);
      } else {
        throw new Error(response.data.message || 'Errore nel recupero dell\'anteprima');
      }
    } catch (error) {
      console.error('Error fetching transition preview:', error);
      setError(error.response?.data?.message || error.message);
      showNotification(
        `Errore nell'anteprima della transizione: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per eseguire la transizione
  const executeTransition = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post(`/schools/${school._id}/year-transition`, {
        fromYear: fromYear.year,
        toYear: toYear.year,
        exceptions: exceptions,
        teacherAssignments: teacherAssignments
      });
      
      if (response.data.status === 'success') {
        showNotification('Transizione anno completata con successo', 'success');
        await getSchoolById(school._id);
        onComplete && onComplete();
      } else {
        throw new Error(response.data.message || 'Errore durante la transizione');
      }
    } catch (error) {
      console.error('Error executing year transition:', error);
      setError(error.response?.data?.message || error.message);
      showNotification(
        `Errore nella transizione: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione del cambio di step
  const handleNext = () => {
    // Azioni specifiche in base allo step
    if (activeStep === 0) {
      fetchTransitionPreview();
    } else if (activeStep === steps.length - 1) {
      executeTransition();
      return; // Previene l'avanzamento automatico dello step
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setFromYear(null);
    setToYear(null);
    setTransitionData(null);
    setExceptions([]);
    setTeacherAssignments({});
  };
  
  // Validazione degli step
  const isNextDisabled = () => {
    switch (activeStep) {
      case 0:
        return !fromYear || !toYear;
      case 1:
        return !transitionData;
      // Altri casi se necessario
      default:
        return false;
    }
  };
  
  // Render del contenuto dello step corrente
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <TransitionSelectYear 
            school={school}
            fromYear={fromYear}
            toYear={toYear}
            onFromYearChange={setFromYear}
            onToYearChange={setToYear}
          />
        );
      case 1:
        return (
          <TransitionPreview 
            transitionData={transitionData}
            loading={loading}
            error={error}
          />
        );
      case 2:
        return (
          <TransitionExceptions 
            transitionData={transitionData}
            exceptions={exceptions}
            onChange={setExceptions}
          />
        );
      case 3:
        return (
          <TransitionTeacherAssignment 
            transitionData={transitionData}
            teacherAssignments={teacherAssignments}
            school={school}
            onChange={setTeacherAssignments}
          />
        );
      case 4:
        return (
          <TransitionConfirmation 
            fromYear={fromYear}
            toYear={toYear}
            transitionData={transitionData}
            exceptions={exceptions}
            teacherAssignments={teacherAssignments}
          />
        );
      default:
        return 'Passo sconosciuto';
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Transizione Anno Accademico
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Questo wizard ti guiderà attraverso il processo di transizione da un anno accademico al successivo.
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box>
          {activeStep === steps.length ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Transizione completata con successo!
              </Typography>
              <Button onClick={handleReset} variant="outlined" sx={{ mt: 2 }}>
                Nuova Transizione
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ minHeight: '300px' }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                  </Box>
                ) : (
                  getStepContent(activeStep)
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Indietro
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isNextDisabled() || loading}
                >
                  {activeStep === steps.length - 1 ? 'Esegui Transizione' : 'Avanti'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default YearTransitionWizard;