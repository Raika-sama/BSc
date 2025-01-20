import React, { useState } from 'react';
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
  Box
} from '@mui/material';

const mockQuestions = [
  {
    id: 1,
    text: "Prima di iniziare una ricerca, leggo diverse fonti per farmi un'idea generale dell'argomento",
    category: "Analitico/Globale",
    type: "likert",
    polarity: "-"
  },
  {
    id: 2,
    text: "Quando risolvo un problema, tendo a seguire un metodo logico e sequenziale",
    category: "Sistematico/Intuitivo",
    type: "likert",
    polarity: "+"
  },
  // ... altre domande mock
];

const PublicCSITest = () => {
  const [currentStep, setCurrentStep] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [studentInfo, setStudentInfo] = useState({
    firstName: '',
    lastName: '',
    class: ''
  });

  const progress = (currentQuestion / mockQuestions.length) * 100;

  const handleAnswer = (event) => {
    const value = event.target.value;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: value
    }));

    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setCurrentStep('results');
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
    const question = mockQuestions[currentQuestion];
    
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            Domanda {currentQuestion + 1} di {mockQuestions.length}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {question.text}
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
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          I Tuoi Risultati
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ecco l'analisi del tuo stile cognitivo
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Stile Dominante:
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Analitico-Sistematico
          </Typography>
          <Typography variant="h6" gutterBottom>
            Punti di Forza:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li">Ottima capacità di analisi dei dettagli</Typography>
            <Typography component="li">Approccio metodico alla risoluzione dei problemi</Typography>
            <Typography component="li">Buona organizzazione del lavoro</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container sx={{ py: 4 }}>
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'test' && renderQuestion()}
      {currentStep === 'results' && renderResults()}
    </Container>
  );
};

export default PublicCSITest;