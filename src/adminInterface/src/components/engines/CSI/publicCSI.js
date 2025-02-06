// src/adminInterface/src/components/engines/CSI/publicCSI.js
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
  CircularProgress,
  Alert
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
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);

    // Verifica il token e inizia il test

    useEffect(() => {
      const initializeTest = async () => {
        try {
            console.log('Verifying token:', token);
    
            const verifyResponse = await axiosInstance.get(`/tests/csi/verify/${token}`);
            console.log('Verify response:', verifyResponse.data);
    
            if (!verifyResponse.data?.data?.valid) {
                throw new Error('Token non valido o scaduto');
            }
    
            // Salva le domande e la configurazione
            const { questions, config } = verifyResponse.data.data;
            setQuestions(questions);
            setTestData({ ...verifyResponse.data.data, config });
    
            const startResponse = await axiosInstance.post(`/tests/csi/${token}/start`);
            console.log('Start response:', startResponse.data);
    
            if (!startResponse.data?.data?.questions?.length) {
                throw new Error('Nessuna domanda ricevuta dal server');
            }
    
            // Aggiorna con eventuali nuovi dati dal server
            setQuestions(startResponse.data.data.questions);
            setTestData(prev => ({
                ...prev,
                ...startResponse.data.data
            }));
            setCurrentStep('intro');
            setStartTime(Date.now());
    
        } catch (err) {
            console.error('Test initialization error:', err);
            const errorMessage = err.response?.data?.error?.message || 
                               err.message || 
                               'Errore durante il caricamento del test';
            setError(errorMessage);
            setCurrentStep('error');
        }
    };
  
      if (token) {
        initializeTest();
      }
  }, [token]);
  
    const handleStartTest = () => {
      setCurrentStep('test');
      setQuestionStartTime(Date.now());
    };
  
    const handleAnswer = async (event) => {
      const value = parseInt(event.target.value);
      const timeSpent = Date.now() - questionStartTime;
      setIsSubmitting(true);
  
      try {
        const answerData = {
          questionId: questions[currentQuestion].id,
          value,
          timeSpent,
          categoria: questions[currentQuestion].categoria
        };
  
        // Rimuovi /api/v1 dal path
        await axiosInstance.post(`/tests/csi/${token}/answer`, answerData);
  
        setAnswers(prev => ({
          ...prev,
          [currentQuestion]: {
            ...answerData,
            timestamp: new Date().toISOString()
          }
        }));
  
        if (currentQuestion === questions.length - 1) {
          const totalTime = Date.now() - startTime;
          
          // Rimuovi /api/v1 dal path
          await axiosInstance.post(`/tests/csi/${token}/complete`, {
            totalTime,
            answers: Object.entries(answers).map(([index, data]) => ({
              questionId: questions[parseInt(index)].id,
              categoria: questions[parseInt(index)].categoria,
              ...data
            }))
          });
  
          setCurrentStep('results');
        } else {
          setCurrentQuestion(prev => prev + 1);
          setQuestionStartTime(Date.now());
        }
      } catch (err) {
        console.error('Answer submission error:', err);
        setError(err.response?.data?.error?.message || 'Errore durante il salvataggio della risposta');
      } finally {
        setIsSubmitting(false);
      }
  };
  
    // Aggiungi una funzione di utility per formattare il tempo
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${seconds % 60}s`;
    };
  
    const renderQuestion = () => {
      const question = questions[currentQuestion];
      const progress = (currentQuestion / questions.length) * 100;
      const timeSpent = Date.now() - questionStartTime;
  
      if (!question) {
        return (
          <Box display="flex" justifyContent="center">
            <Alert severity="error">Errore nel caricamento della domanda</Alert>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Domanda {currentQuestion + 1} di {questions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tempo: {formatTime(timeSpent)}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {question.testo}
            </Typography>
            <RadioGroup
              value={answers[currentQuestion]?.value?.toString() || ''}
              onChange={handleAnswer}
            >
              {[
                { value: 1, label: "Per niente d'accordo" },
                { value: 2, label: "Poco d'accordo" },
                { value: 3, label: "Neutrale" },
                { value: 4, label: "Abbastanza d'accordo" },
                { value: 5, label: "Completamente d'accordo" }
              ].map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value.toString()}
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


    const renderIntro = () => (
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                  Test Stili Cognitivi (CSI)
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                  {testData?.config?.interfaccia?.istruzioni || 
                   "Questo test ti aiuterà a comprendere il tuo stile di apprendimento."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Il test consiste in {questions.length} domande.
                  Tempo massimo per domanda: {formatTime(testData?.config?.validazione?.tempoMassimoDomanda)}
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                  {testData?.config?.interfaccia?.permettiTornaIndietro ? 
                      "Potrai rivedere le risposte date prima di completare il test." :
                      "Una volta data una risposta, non potrai tornare indietro."}
              </Alert>
              <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleStartTest}
              >
                  Inizia il Test
              </Button>
          </CardContent>
      </Card>
  );



  const renderResults = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Test Completato
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Grazie per aver completato il test degli Stili Cognitivi.
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          I risultati sono stati salvati con successo e saranno analizzati dal sistema.
          Il tuo insegnante potrà accedere ai risultati attraverso la piattaforma.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Puoi chiudere questa finestra.
        </Typography>
      </CardContent>
    </Card>
  );

  const renderError = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
            <Typography variant="h5" color="error" gutterBottom>
                Errore
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
                {error}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Se il problema persiste, contatta l'amministratore.
            </Typography>
            <Button 
                variant="contained" 
                color="primary"
                onClick={() => window.location.reload()}
            >
                Riprova
            </Button>
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