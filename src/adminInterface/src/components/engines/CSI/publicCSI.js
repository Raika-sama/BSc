// src/adminInterface/src/components/engines/CSI/publicCSI.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../../../services/axiosConfig';
import setupAxiosInterceptors from '../../../services/axiosConfig';
import { 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    LinearProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';

// Inizializza gli interceptor di axios
setupAxiosInterceptors();

const PublicCSITest = () => {
    const { token } = useParams();
    
    // Stati per gestire il flusso del test
    const [currentStep, setCurrentStep] = useState('loading');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [testData, setTestData] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [questionStartTime, setQuestionStartTime] = useState(null);

    // Inizializzazione test
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await axiosInstance.get(`/tests/csi/verify/${token}`);
                if (!response.data?.data?.valid) {
                    throw new Error('Token non valido o scaduto');
                }

                setTestData(response.data.data.test);
                setQuestions(response.data.data.questions);
                setCurrentStep('intro');

            } catch (err) {
                console.error('Test initialization error:', err);
                setError(err.response?.data?.error?.message || 'Errore durante il caricamento del test');
                setCurrentStep('error');
            }
        };

        if (token) verifyToken();
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

    const handleStartTest = async () => {
        try {
            const response = await axiosInstance.post(`/tests/csi/${token}/start`);
            if (response.data.status === 'success') {
                setCurrentStep('test');
                setQuestionStartTime(Date.now());
                setStartTime(Date.now());
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Errore durante l\'avvio del test');
        }
    };

    const handleAnswer = async (event) => {
        const value = parseInt(event.target.value);
        setIsSubmitting(true);

        try {
            const answerData = {
                questionId: questions[currentQuestion].id,
                value,
                timeSpent: Date.now() - questionStartTime,
                categoria: questions[currentQuestion].categoria,
                timestamp: new Date().toISOString()
            };

            const response = await axiosInstance.post(
                `/tests/csi/${token}/answer`,
                answerData
            );

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
            setError(err.response?.data?.error?.message || 'Errore durante il salvataggio della risposta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestComplete = async () => {
        try {
            const totalTime = Date.now() - startTime;
            const response = await axiosInstance.post(`/tests/csi/${token}/complete`);
            
            if (response.data.status === 'success') {
                setCurrentStep('results');
            } else {
                throw new Error('Errore durante il completamento del test');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Errore durante il completamento del test');
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