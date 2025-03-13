import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTest } from '../hooks/TestContext';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  Text,
  Button,
  Progress,
  RadioGroup,
  Radio,
  Stack,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useToast,
} from '@chakra-ui/react';

const TestRunner = () => {
  const { token, testType = 'csi' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
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

  // Stati locali
  const [currentStep, setCurrentStep] = useState('loading');
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedValue, setSelectedValue] = useState(null);

  // Recupera e verifica il token del test
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          throw new Error('Token non valido');
        }

        const result = await verifyAndLoadTestData(token, testType);
        if (result) {
          setCurrentStep('intro');
        } else {
          throw new Error('Impossibile caricare i dati del test');
        }
      } catch (err) {
        console.error('Errore nella verifica del token:', err);
        toast({
          title: "Errore",
          description: err.message || "Token non valido o scaduto",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setCurrentStep('error');
      }
    };

    verifyToken();
  }, [token, testType, verifyAndLoadTestData, toast]);

  // Timer per monitorare il tempo trascorso sulla domanda corrente
  useEffect(() => {
    let intervalId;
    
    if (currentStep === 'test' && activeTest.questionStartTime) {
      intervalId = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - activeTest.questionStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStep, activeTest.questionStartTime]);

  // Gestore per iniziare il test
  const handleStartTest = async () => {
    try {
      const result = await startActiveTest();
      if (result.success) {
        setCurrentStep('test');
      } else {
        throw new Error('Impossibile avviare il test');
      }
    } catch (err) {
      toast({
        title: "Errore",
        description: err.message || "Errore nell'avvio del test",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Gestore per inviare una risposta
  const handleSubmitAnswer = async () => {
    if (selectedValue === null) {
      toast({
        title: "Attenzione",
        description: "Seleziona una risposta per continuare",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const result = await submitAnswer(parseInt(selectedValue, 10));
      
      if (result.success) {
        // Resetta il valore selezionato per la prossima domanda
        setSelectedValue(null);
        
        // Se era l'ultima domanda, completa il test
        if (result.isLastQuestion) {
          await handleCompleteTest();
        }
      } else {
        throw new Error('Errore nell\'invio della risposta');
      }
    } catch (err) {
      toast({
        title: "Errore",
        description: err.message || "Errore nell'invio della risposta",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Gestore per completare il test
  const handleCompleteTest = async () => {
    try {
      const result = await completeTest();
      
      if (result.success) {
        setCurrentStep('completed');
        
        toast({
          title: "Test completato",
          description: "Il test è stato completato con successo!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Errore nel completamento del test');
      }
    } catch (err) {
      toast({
        title: "Errore",
        description: err.message || "Errore nel completamento del test",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Naviga alla dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Renderizza la schermata di caricamento
  const renderLoading = () => (
    <Box display="flex" justifyContent="center" alignItems="center" height="300px">
      <Spinner size="xl" color="blue.500" thickness="4px" />
    </Box>
  );

  // Renderizza la schermata di errore
  const renderError = () => (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="300px"
      borderRadius="lg"
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Si è verificato un errore
      </AlertTitle>
      <AlertDescription maxWidth="sm">
        {error || "Impossibile caricare il test. Il token potrebbe essere scaduto o non valido."}
      </AlertDescription>
      <Button mt={4} colorScheme="blue" onClick={handleBackToDashboard}>
        Torna alla Dashboard
      </Button>
    </Alert>
  );

  // Renderizza l'introduzione al test
  const renderIntro = () => {
    const testConfig = activeTest.testData?.config || {};
    const testName = activeTest.testData?.nome || `Test ${testType.toUpperCase()}`;
    const testDescription = activeTest.testData?.descrizione || 'Test per la valutazione degli stili cognitivi';
    const questionCount = activeTest.questions?.length || 0;
    
    return (
      <Card borderRadius="lg" boxShadow="lg" maxW="800px" mx="auto">
        <CardHeader bg="blue.500" color="white" borderTopRadius="lg">
          <Heading size="lg">{testName}</Heading>
        </CardHeader>
        
        <CardBody py={6}>
          <Text fontSize="lg" mb={4}>
            {testDescription}
          </Text>
          
          <Box bg="blue.50" p={4} borderRadius="md" mb={4}>
            <Heading size="md" mb={2} color="blue.700">
              Informazioni sul test
            </Heading>
            <Stack spacing={2}>
              <Flex>
                <Text fontWeight="bold" minW="180px">Numero di domande:</Text>
                <Text>{questionCount}</Text>
              </Flex>
              {testConfig.tempoLimite && (
                <Flex>
                  <Text fontWeight="bold" minW="180px">Tempo limite:</Text>
                  <Text>{testConfig.tempoLimite} minuti</Text>
                </Flex>
              )}
            </Stack>
          </Box>
          
          <Box bg="yellow.50" p={4} borderRadius="md">
            <Heading size="md" mb={2} color="yellow.700">
              Istruzioni
            </Heading>
            <Text>
              {testConfig.istruzioni || 
                `Per ogni domanda, leggi attentamente l'affermazione e seleziona l'opzione che meglio rappresenta 
                quanto sei d'accordo con essa. Non ci sono risposte giuste o sbagliate, l'importante è rispondere 
                in base alle tue preferenze personali.`}
            </Text>
          </Box>
        </CardBody>
        
        <CardFooter borderTop="1px" borderColor="gray.200" justifyContent="flex-end">
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleStartTest}
            isLoading={loading.test}
            loadingText="Avvio..."
          >
            Inizia il Test
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderizza una domanda del test
  const renderQuestion = () => {
    const { currentQuestion, questions } = activeTest;
    const question = questions[currentQuestion];
    
    if (!question) {
      return renderError();
    }
    
    const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
    
    return (
      <Card borderRadius="lg" boxShadow="lg" maxW="800px" mx="auto">
        <CardHeader bg="blue.500" color="white" borderTopRadius="lg" pb={2}>
          <Progress 
            value={progressPercentage} 
            size="sm" 
            colorScheme="green" 
            borderRadius="full" 
            mb={2}
          />
          <Flex justify="space-between" align="center">
            <Text>Domanda {currentQuestion + 1} di {questions.length}</Text>
            <Text>Tempo: {timeSpent} secondi</Text>
          </Flex>
        </CardHeader>
        
        <CardBody py={6}>
          <Heading size="md" mb={5} textAlign="center">
            {question.testo}
          </Heading>
          
          <RadioGroup 
            value={selectedValue} 
            onChange={setSelectedValue}
            colorScheme="blue"
          >
            <Stack spacing={4} direction="column">
              <Radio value="1" size="lg">
                <Text fontWeight="medium">Per niente d'accordo</Text>
              </Radio>
              <Radio value="2" size="lg">
                <Text fontWeight="medium">Poco d'accordo</Text>
              </Radio>
              <Radio value="3" size="lg">
                <Text fontWeight="medium">Neutrale</Text>
              </Radio>
              <Radio value="4" size="lg">
                <Text fontWeight="medium">Abbastanza d'accordo</Text>
              </Radio>
              <Radio value="5" size="lg">
                <Text fontWeight="medium">Completamente d'accordo</Text>
              </Radio>
            </Stack>
          </RadioGroup>
        </CardBody>
        
        <CardFooter borderTop="1px" borderColor="gray.200" justifyContent="flex-end">
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleSubmitAnswer}
            isLoading={loading.submitting}
            loadingText="Invio..."
            px={8}
          >
            {currentQuestion === questions.length - 1 ? 'Completa' : 'Avanti'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderizza il completamento del test
  const renderCompleted = () => (
    <Card borderRadius="lg" boxShadow="lg" maxW="800px" mx="auto" bg="green.50">
      <CardHeader bg="green.500" color="white" borderTopRadius="lg">
        <Heading size="lg">Test Completato</Heading>
      </CardHeader>
      
      <CardBody py={6} textAlign="center">
        <Box mb={6}>
          <Alert
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={6}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Test completato con successo!
            </AlertTitle>
            <AlertDescription maxWidth="md">
              Grazie per aver completato il test. I risultati sono stati registrati nel sistema.
            </AlertDescription>
          </Alert>
        </Box>
      </CardBody>
      
      <CardFooter borderTop="1px" borderColor="gray.200" justifyContent="center">
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleBackToDashboard}
          leftIcon={<span>🏠</span>}
        >
          Torna alla Dashboard
        </Button>
      </CardFooter>
    </Card>
  );

  // Renderizzazione condizionale in base allo stato corrente
  const renderContent = () => {
    if (loading.test && currentStep === 'loading') return renderLoading();
    if (error || currentStep === 'error') return renderError();
    if (currentStep === 'intro') return renderIntro();
    if (currentStep === 'test') return renderQuestion();
    if (currentStep === 'completed') return renderCompleted();
    
    // Fallback
    return renderLoading();
  };

  return (
    <Box 
      maxW="1200px" 
      mx="auto" 
      p={4} 
      pt={6}
      height="calc(100vh - 120px)"
      display="flex"
      flexDirection="column"
      justifyContent="center"
    >
      {renderContent()}
    </Box>
  );
};

export default TestRunner;