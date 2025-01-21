import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../../../services/axiosConfig';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Container,
  Box,
  CircularProgress
} from '@mui/material';

const PublicCSITest = () => {
  const { token } = useParams();
  const [currentStep, setCurrentStep] = useState('loading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifica il token e inizia il test
  useEffect(() => {
    const initializeTest = async () => {
        try {
          console.log('Verifying token:', token); // Debug log
  
          // Prima verifica il token
          const verifyResponse = await axiosInstance.get(`/tests/csi/public/verify/${token}`);
          console.log('Token verification response:', verifyResponse.data); // Debug log
          
          // Se valido, inizia il test
          const startResponse = await axiosInstance.post(`/tests/csi/public/start/${token}`);
          console.log('Test start response:', startResponse.data); // Debug log
          
          if (startResponse.data?.data?.questions) {
            setQuestions(startResponse.data.data.questions);
            setTestData(startResponse.data.data);
            setCurrentStep('intro');
          } else {
            throw new Error('Nessuna domanda ricevuta dal server');
          }
        } catch (err) {
          console.error('Test initialization error:', err); // Debug log
          setError(err.response?.data?.message || 'Errore durante il caricamento del test');
          setCurrentStep('error');
        }
      };
  
      if (token) {
        initializeTest();
      }
    }, [token]);


    const handleAnswer = async (event) => {
        const value = event.target.value;
        setIsSubmitting(true);
        
        try {
            console.log('Submitting answer:', { 
                questionIndex: currentQuestion, 
                value,
                isLastQuestion: currentQuestion === questions.length - 1
            });
    
            // Invia la risposta al backend
            const response = await axiosInstance.post(`/tests/csi/public/${token}/answer`, {
                questionIndex: currentQuestion,
                value: parseInt(value),
                timeSpent: 0
            });
    
            // Aggiorna lo stato locale delle risposte
            setAnswers(prev => ({
                ...prev,
                [currentQuestion]: value
            }));
    
            // Se è l'ultima domanda
            if (currentQuestion === questions.length - 1) {
                try {
                    // Aspetta un momento per assicurarsi che l'ultima risposta sia salvata
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Completa il test
                    const completeResponse = await axiosInstance.post(`/tests/csi/public/${token}/complete`);
                    console.log('Test completion response:', completeResponse.data);
                    
                    // Passa ai risultati
                    setCurrentStep('results');
                } catch (completeError) {
                    console.error('Error completing test:', completeError);
                    setError('Errore durante il completamento del test. Per favore, riprova.');
                }
            } else {
                // Passa alla prossima domanda
                setCurrentQuestion(prev => prev + 1);
            }
        } catch (err) {
            console.error('Answer submission error:', err.response?.data || err);
            setError(err.response?.data?.message || 'Errore durante il salvataggio della risposta');
        } finally {
            setIsSubmitting(false);
        }
      };

  const renderIntro = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Test Stili Cognitivi
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Questo test ti aiuterà a comprendere il tuo stile di apprendimento preferito.
          Non ci sono risposte giuste o sbagliate.
        </Typography>
        {testData?.instructions && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {testData.instructions}
          </Typography>
        )}
        <Button 
          variant="contained" 
          fullWidth 
          onClick={() => setCurrentStep('test')}
        >
          Inizia il Test
        </Button>
      </CardContent>
    </Card>
  );

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    const progress = (currentQuestion / questions.length) * 100;
    
    console.log('Rendering question:', { currentQuestion, question }); // Debug log
    
    if (!question) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center">
          <Typography color="error">
            Errore nel caricamento della domanda
          </Typography>
        </Box>
      );
    }

    return (
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            Domanda {currentQuestion + 1} di {questions.length}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {question.testo}
          </Typography>
          <RadioGroup
            value={answers[currentQuestion] || ''}
            onChange={handleAnswer}
          >
            {[
              { value: '1', label: "Per niente d'accordo" },
              { value: '2', label: "Poco d'accordo" },
              { value: '3', label: "Neutrale" },
              { value: '4', label: "Abbastanza d'accordo" },
              { value: '5', label: "Completamente d'accordo" }
            ].map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
                disabled={isSubmitting}
              />
            ))}
          </RadioGroup>
          {isSubmitting && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={24} />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Test Completato
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Grazie per aver completato il test. I risultati saranno analizzati e resi disponibili attraverso il tuo insegnante.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Puoi chiudere questa finestra.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const renderError = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" color="error" gutterBottom>
          Errore
        </Typography>
        <Typography variant="body1">
          {error}
        </Typography>
        <Box mt={2}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
          >
            Riprova
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container sx={{ py: 4 }}>
      {currentStep === 'loading' && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      )}
      {currentStep === 'error' && renderError()}
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'test' && questions.length > 0 && renderQuestion()}
      {currentStep === 'results' && renderResults()}
    </Container>
  );
};

export default PublicCSITest;