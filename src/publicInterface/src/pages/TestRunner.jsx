import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTest } from '../hooks/TestContext';
import {
  Box,
  Heading,
  Text,
  Button,
  Progress,
  RadioGroup,
  Radio,
  Stack,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
  Badge
} from '@chakra-ui/react';

const TestRunner = () => {
  const { testType, token } = useParams();
  const navigate = useNavigate();
  const {
    activeTest,
    verifyAndLoadTestData,
    startActiveTest,
    submitAnswer,
    completeTest,
    loading,
    error,
    clearError
  } = useTest();
  
  const [testStep, setTestStep] = useState('loading'); // loading, intro, test, completed, error
  const [responseValue, setResponseValue] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef(null);
  
  // Carica i dati del test quando il componente è montato
  useEffect(() => {
    const loadTest = async () => {
      try {
        if (!token || !testType) {
          throw new Error('Parametri del test mancanti');
        }
        
        // Verifica e carica i dati del test
        await verifyAndLoadTestData(token, testType);
        setTestStep('intro');
      } catch (error) {
        console.error('Errore nel caricamento del test:', error);
        setTestStep('error');
      }
    };
    
    loadTest();
    
    // Cleanup del timer quando il componente viene smontato
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [token, testType, verifyAndLoadTestData]);
  
  // Gestisce l'aggiornamento del timer
  useEffect(() => {
    if (testStep === 'test' && activeTest.startTime) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((Date.now() - activeTest.startTime) / 1000);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testStep, activeTest.startTime]);
  
  // Avvia il test
  const handleStartTest = async () => {
    try {
      const result = await startActiveTest();
      if (result.success) {
        setTestStep('test');
      } else {
        throw new Error('Errore nell\'avvio del test');
      }
    } catch (error) {
      console.error('Errore nell\'avvio del test:', error);
      setTestStep('error');
    }
  };
  
  // Invia una risposta
  const handleSubmitAnswer = async () => {
    if (responseValue === null) return; // Nessuna risposta selezionata
    
    try {
      const result = await submitAnswer(responseValue);
      if (result.success) {
        setResponseValue(null); // Reset della risposta selezionata
        
        // Se era l'ultima domanda, completa il test
        if (result.isLastQuestion) {
          await handleCompleteTest();
        }
      } else {
        throw new Error('Errore nell\'invio della risposta');
      }
    } catch (error) {
      console.error('Errore nell\'invio della risposta:', error);
    }
  };
  
  // Completa il test
  const handleCompleteTest = async () => {
    try {
      const result = await completeTest();
      if (result.success) {
        setTestStep('completed');
      } else {
        throw new Error('Errore nel completamento del test');
      }
    } catch (error) {
      console.error('Errore nel completamento del test:', error);
    }
  };
  
  // Torna alla pagina dei test assegnati
  const handleBackToTests = () => {
    navigate('/test-assegnati');
  };
  
  // Funzione per formattare il tempo
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Se c'è un errore, mostra un messaggio di errore
  if (testStep === 'error' || error) {
    return (
      <Box maxW="800px" mx="auto" p={5}>
        <Alert status="error" variant="solid" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle mb={1}>Si è verificato un errore</AlertTitle>
            <AlertDescription>
              {error || 'Impossibile caricare il test. Verifica il token e riprova.'}
            </AlertDescription>
          </Box>
        </Alert>
        
        <Button mt={4} colorScheme="blue" onClick={handleBackToTests}>
          Torna ai test assegnati
        </Button>
      </Box>
    );
  }
  
  // Se il test è in fase di caricamento, mostra uno spinner
  if (testStep === 'loading' || loading.test) {
    return (
      <Flex direction="column" align="center" justify="center" h="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4} fontSize="lg">Caricamento del test in corso...</Text>
      </Flex>
    );
  }
  
  // Se il test è completato, mostra un messaggio di conferma
  if (testStep === 'completed') {
    return (
      <Box maxW="800px" mx="auto" p={5}>
        <Alert status="success" variant="solid" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle mb={1}>Test completato con successo!</AlertTitle>
            <AlertDescription>
              Grazie per aver completato il test. I risultati sono stati salvati.
            </AlertDescription>
          </Box>
        </Alert>
        
        <Button mt={4} colorScheme="blue" onClick={handleBackToTests}>
          Torna ai test assegnati
        </Button>
      </Box>
    );
  }
  
  // Se il test è nella fase di introduzione
  if (testStep === 'intro') {
    return (
      <Box maxW="800px" mx="auto" p={5}>
        <Card borderRadius="lg" overflow="hidden" boxShadow="lg">
          <CardHeader bg="blue.500" color="white">
            <Heading size="md">{activeTest.testData?.nome || `Test ${testType.toUpperCase()}`}</Heading>
          </CardHeader>
          <CardBody>
            <Heading size="md" mb={4}>Benvenuto/a!</Heading>
            
            <Text mb={3}>
              Stai per iniziare un {testType === 'csi' ? 'test sugli Stili Cognitivi (CSI)' : 'test'}.
            </Text>
            
            {activeTest.testData?.descrizione && (
              <Text mb={3}>{activeTest.testData.descrizione}</Text>
            )}
            
            {activeTest.questions?.length > 0 && (
              <Text mb={3}>
                Questo test è composto da {activeTest.questions.length} domande.
              </Text>
            )}
            
            {activeTest.testData?.config?.tempoLimite && (
              <Alert status="info" mb={3} borderRadius="md">
                <AlertIcon />
                <Text>
                  Hai {activeTest.testData.config.tempoLimite} minuti per completare questo test.
                </Text>
              </Alert>
            )}
            
            {activeTest.testData?.config?.istruzioni && (
              <Box mt={4}>
                <Heading size="sm" mb={2}>Istruzioni</Heading>
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text>{activeTest.testData.config.istruzioni}</Text>
                </Box>
              </Box>
            )}
          </CardBody>
          <CardFooter bg="gray.50" justifyContent="space-between">
            <Button onClick={handleBackToTests} variant="outline">
              Annulla
            </Button>
            <Button onClick={handleStartTest} colorScheme="blue">
              Inizia il test
            </Button>
          </CardFooter>
        </Card>
      </Box>
    );
  }
  
  // Visualizzazione delle domande del test
  const currentQuestion = activeTest.questions[activeTest.currentQuestion];
  
  return (
    <Box maxW="800px" mx="auto" p={5}>
      <Card borderRadius="lg" overflow="hidden" boxShadow="lg">
        <CardHeader bg="blue.500" color="white">
          <Flex justify="space-between" align="center">
            <Heading size="md">{activeTest.testData?.nome || `Test ${testType.toUpperCase()}`}</Heading>
            <Flex align="center" gap={2}>
              <Badge colorScheme="green">
                {activeTest.currentQuestion + 1} di {activeTest.questions.length}
              </Badge>
              <Badge colorScheme="purple">
                Tempo: {formatTime(timeElapsed)}
              </Badge>
            </Flex>
          </Flex>
        </CardHeader>
        
        <CardBody>
          <Progress 
            value={(activeTest.currentQuestion / activeTest.questions.length) * 100} 
            mb={4} 
            colorScheme="blue"
            borderRadius="md"
          />
          
          <Heading size="md" mb={4}>
            {currentQuestion?.testo || `Domanda ${activeTest.currentQuestion + 1}`}
          </Heading>
          
          <RadioGroup 
            value={responseValue !== null ? responseValue.toString() : ''} 
            onChange={(value) => setResponseValue(parseInt(value))}
            mb={4}
          >
            <Stack spacing={3}>
              {[
                { value: 1, label: "Per niente d'accordo" },
                { value: 2, label: "Poco d'accordo" },
                { value: 3, label: "Neutrale" },
                { value: 4, label: "Abbastanza d'accordo" },
                { value: 5, label: "Completamente d'accordo" }
              ].map((option) => (
                <Radio
                  key={option.value}
                  value={option.value.toString()}
                  isDisabled={loading.submitting}
                  colorScheme="blue"
                  size="lg"
                >
                  {option.label}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
          
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
              <Button ml="auto" size="sm" onClick={clearError}>
                Chiudi
              </Button>
            </Alert>
          )}
        </CardBody>
        
        <CardFooter bg="gray.50" justifyContent="space-between">
          <Text fontStyle="italic">
            {currentQuestion?.categoria && (
              <Badge colorScheme="cyan" mr={2}>{currentQuestion.categoria}</Badge>
            )}
            Domanda {activeTest.currentQuestion + 1} di {activeTest.questions.length}
          </Text>
          <Button 
            onClick={handleSubmitAnswer} 
            colorScheme="blue" 
            isLoading={loading.submitting}
            isDisabled={responseValue === null}
          >
            {activeTest.currentQuestion === activeTest.questions.length - 1 ? 'Completa il test' : 'Avanti'}
          </Button>
        </CardFooter>
      </Card>
    </Box>
  );
};

export default TestRunner;