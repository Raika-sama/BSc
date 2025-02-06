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
  const [timeSpent, setTimeSpent] = useState(0);

  // Inizializzazione test
  useEffect(() => {
    const initializeTest = async () => {
        try {
            console.log('Initializing test with token:', token);
            
            const verifyResponse = await axiosInstance.get(`/tests/csi/verify/${token}`);
            console.log('Verify response:', verifyResponse.data);

            if (!verifyResponse.data?.data?.valid) {
                throw new Error('Token non valido o scaduto');
            }

            // Salva il test nei dati locali
            setTestData(verifyResponse.data.data.test);
            setQuestions(verifyResponse.data.data.questions);
            
            console.log('Test data:', verifyResponse.data.data.test);
            console.log('Questions loaded:', verifyResponse.data.data.questions.length);

            setCurrentStep('intro');
        } catch (err) {
            console.error('Test initialization error:', err);
            setError(err.response?.data?.error?.message || 'Errore durante il caricamento del test');
            setCurrentStep('error');
        }
    };

    if (token) {
        initializeTest();
    }
}, [token]);

  // Timer domanda
  useEffect(() => {
    let intervalId;
    if (currentStep === 'test' && questionStartTime) {
      intervalId = setInterval(() => {
        setTimeSpent(Date.now() - questionStartTime);
      }, 1000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [currentStep, questionStartTime]);

  const handleStartTest = () => {
    setCurrentStep('test');
    setQuestionStartTime(Date.now());
    setStartTime(Date.now());
  };

  const handleAnswer = async (event) => {
    const value = parseInt(event.target.value);
    console.log('Submitting answer:', {
        value,
        currentQuestion,
        token
    });
    setIsSubmitting(true);

    try {
        const answerData = {
            questionId: questions[currentQuestion].id,
            value,
            timeSpent: Date.now() - questionStartTime,
            categoria: questions[currentQuestion].categoria,
            timestamp: new Date().toISOString()
        };
        console.log('Answer data:', answerData);

        const response = await axiosInstance.post(
            `/tests/csi/${token}/answer`,
            answerData
        );
        console.log('Server response:', response.data);

        if (response.data.status === 'success') {
            setAnswers(prev => ({
                ...prev,
                [currentQuestion]: answerData
            }));

            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setQuestionStartTime(Date.now());
            } else {
                await handleTestComplete();
            }
        }
    } catch (err) {
        console.error('Full error:', err);
        setError(err.response?.data?.error?.message || 'Errore durante il salvataggio della risposta');
    } finally {
        setIsSubmitting(false);
    }
};

  const handleNavigation = (direction) => {
    const newQuestion = currentQuestion + direction;
    if (newQuestion >= 0 && newQuestion < questions.length) {
      setCurrentQuestion(newQuestion);
      setQuestionStartTime(Date.now());
    }
  };

  const handleTestComplete = async () => {
    try {
      const totalTime = Date.now() - startTime;
      await axiosInstance.post(`/tests/csi/${token}/complete`, {
        totalTime,
        answers: Object.values(answers)
      });
      setCurrentStep('results');
    } catch (err) {
      setError('Errore durante il completamento del test');
    }
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    return (
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestion / questions.length) * 100} 
          />
          
          <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography>
              Domanda {currentQuestion + 1} di {questions.length}
            </Typography>
            <Typography>
              Tempo: {Math.floor(timeSpent / 1000)}s
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 3 }}>
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

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => handleNavigation(-1)}
              disabled={currentQuestion === 0}
            >
              Indietro
            </Button>
            <Button
              onClick={() => handleNavigation(1)}
              disabled={currentQuestion === questions.length - 1}
            >
              Avanti
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Rendering condizionale
  if (currentStep === 'loading') return <CircularProgress />;
  if (currentStep === 'error') return <Alert severity="error">{error}</Alert>;
  if (currentStep === 'results') return (
    <Alert severity="success">
      Test completato con successo! Puoi chiudere questa finestra.
    </Alert>
  );
  if (currentStep === 'intro') return (
    <Card>
      <CardContent>
        <Typography variant="h5">Test Stili Cognitivi (CSI)</Typography>
        <Typography sx={{ mt: 2 }}>
          Il test consiste in {questions.length} domande.
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleStartTest} 
          sx={{ mt: 2 }}
        >
          Inizia il Test
        </Button>
      </CardContent>
    </Card>
  );

  return renderQuestion();
};

export default PublicCSITest;