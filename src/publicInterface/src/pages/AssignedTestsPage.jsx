import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTest } from '../hooks/TestContext';
import {
  Box,
  Heading,
  Text,
  List,
  ListItem,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Divider,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Flex,
  Stack,
  Skeleton,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { TbSchool } from 'react-icons/tb';
import { MdAssignment, MdAccessTime, MdEvent, MdPlayArrow, MdPlayCircleOutline, MdCheckCircle } from 'react-icons/md';
import { Global, css } from '@emotion/react';

const AssignedTestsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    assignedTests,
    selectedTest,
    getAssignedTests,
    selectTest,
    startTest,
    loading,
    error,
    clearError,
    formatDate
  } = useTest();
  
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [lastCompleted, setLastCompleted] = useState(null);
  const toast = useToast();

  // Carica i test assegnati all'avvio
  useEffect(() => {
    getAssignedTests();
  }, [getAssignedTests]);

  // Effetto per aggiornare i dati quando si arriva da un test completato
  useEffect(() => {
    const fromTest = location.state?.fromTest;
    const testCompleted = location.state?.testCompleted;
    
    if (fromTest && testCompleted && testCompleted !== lastCompleted) {
      getAssignedTests(true);  // Forza l'aggiornamento
      setLastCompleted(testCompleted);
    }
  }, [location, getAssignedTests, lastCompleted]);

  // Stato per gestire l'avvio di un test
  const [startingTestId, setStartingTestId] = useState(null);

  // Gestore della selezione di un test
  const handleSelectTest = (test) => {
    selectTest(test);
  };

  const canStartTest = useCallback((test) => {
    // Se questo test è già in corso o completato, non può essere avviato
    if (test.status !== 'pending') {
      return false;
    }
    
    // Verifica se ci sono altri test dello stesso tipo in corso
    const activeTestsSameType = assignedTests.filter(
      t => t.tipo === test.tipo && t.status === 'in_progress'
    );
    
    return activeTestsSameType.length === 0;
  }, [assignedTests]);
  
  // Avvia un test
  const handleStartTest = async (testId) => {
    try {
      setStartingTestId(testId);
      console.log('Avvio test con ID:', testId);
      const result = await startTest(testId);
      
      console.log('Risposta completa dal server:', result);
      
      if (result.success) {
        // Correzione qui: navigazione diretta all'URL del test con il token
        const { token, testType } = result;
        console.log(`Navigazione al test di tipo ${testType} con token: ${token}`);
        
        if (!token || !testType) {
          throw new Error('Token o tipo test mancanti nella risposta');
        }
        
        // Usa direttamente la navigazione con i parametri corretti
        navigate(`/test/${testType.toLowerCase()}/${token}`);
      } else {
        throw new Error(result.error || 'Errore nell\'avvio del test');
      }
    } catch (error) {
      console.error('Errore nell\'avvio del test:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare il test",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setStartingTestId(null);
      setIsStartModalOpen(false);
    }
  };

  // Funzione per ottenere il colore dello stato del test
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'green';
      case 'in_progress': return 'orange';
      case 'pending': 
      default: return 'blue';
    }
  };

  // Funzione per ottenere il testo dello stato del test in italiano
  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Completato';
      case 'in_progress': return 'In corso';
      case 'pending': 
      default: return 'In attesa';
    }
  };

  // Renderizza lo skeleton di caricamento per la lista dei test
  const renderTestListSkeleton = () => (
    <Box p={2}>
      {[1, 2, 3].map((item) => (
        <Box key={item} mb={2}>
          <Skeleton height="60px" borderRadius="md" />
        </Box>
      ))}
    </Box>
  );

  // Renderizza lo skeleton di caricamento per i dettagli del test
  const renderTestDetailsSkeleton = () => (
    <Box p={2}>
      <Skeleton height="40px" width="70%" mb={1} />
      <Skeleton height="30px" width="40%" mb={2} />
      <Divider my={2} />
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} height="80px" borderRadius="md" />
        ))}
      </SimpleGrid>
      <Divider my={2} />
      <Skeleton height="50px" width="40%" borderRadius="md" />
    </Box>
  );

  return (
    <Box 
      maxW="1200px" 
      mx="auto" 
      p={3}
      height="calc(100vh - 120px)"
      display="flex"
      flexDirection="column"
    >
      <Global
        styles={css`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(72, 187, 120, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(72, 187, 120, 0);
            }
          }
        `}
      />
      
      <Heading as="h1" size="lg" mb={3} fontWeight="bold">
        Test Assegnati
      </Heading>
      
      {error && (
        <Alert 
          status="error" 
          mb={3}
          onClose={clearError}
        >
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <Flex 
        gap={3} 
        flex="1"
        height="calc(100% - 50px)"
        flexDirection={{ base: 'column', md: 'row' }}
      >
        {/* Pannello sinistro - Lista dei test */}
        <Box 
          width={{ base: '100%', md: '320px' }}
          borderRadius="lg"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          boxShadow="md"
          bg="white"
        >
          <Box 
            bg="blue.500" 
            color="white"
            p={2}
          >
            <Flex align="center">
              <Box as={MdAssignment} mr={2} />
              <Heading size="md">Test disponibili</Heading>
            </Flex>
          </Box>
          
          {loading.assigned ? (
            renderTestListSkeleton()
          ) : assignedTests.length === 0 ? (
            <Box p={3} textAlign="center">
              <Text color="gray.500">
                Non ci sono test assegnati al momento
              </Text>
            </Box>
          ) : (
            <List 
              flex="1" 
              overflow="auto" 
              p={0}
            >
              {assignedTests.map((test) => (
                <React.Fragment key={test._id}>
                  <ListItem 
                    onClick={() => handleSelectTest(test)}
                    cursor="pointer"
                    borderLeft="3px solid"
                    borderLeftColor={selectedTest && selectedTest._id === test._id ? 
                      'blue.500' : 'transparent'}
                    transition="all 0.2s ease"
                    _hover={{ bg: 'gray.50' }}
                    bg={selectedTest && selectedTest._id === test._id ? 'gray.50' : 'white'}
                    p={3}
                    position="relative"
                  >
                    <Box>
                      <Text fontWeight={500}>
                        {test.nome || `Test ${test.tipo}`}
                      </Text>
                      <Flex align="center" mt={1} gap={1}>
                        <Badge 
                          colorScheme={getStatusColor(test.status)}
                          mr={1}
                        >
                          {getStatusText(test.status)}
                        </Badge>
                        <Flex align="center" fontSize="sm" color="gray.500">
                          <Box as={MdEvent} size="14px" mr={1} />
                          {formatDate(test.assignedAt || test.createdAt)}
                        </Flex>
                      </Flex>
                    </Box>
                    
                    {/* Indicatore per test con stato attivo */}
                    {test.status === 'in_progress' && (
                      <Box 
                        position="absolute"
                        right={2}
                        top={2}
                        borderRadius="full"
                        bg="green.400"
                        w={3}
                        h={3}
                        animation="pulse 1.5s infinite"
                      />
                    )}
                    
                    {/* Indicatore per test completati */}
                    {test.status === 'completed' && (
                      <Box 
                        as={MdCheckCircle}
                        position="absolute"
                        right={2}
                        top={2}
                        color="green.500"
                        size="20px"
                      />
                    )}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
        
        {/* Pannello destro - Dettagli del test */}
        <Box 
          flex="1" 
          borderRadius="lg"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          boxShadow="md"
          bg="white"
        >
          {loading.assigned ? (
            renderTestDetailsSkeleton()
          ) : !selectedTest ? (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              height="100%"
              p={3}
            >
              <Text color="gray.500" fontSize="xl">
                Seleziona un test per visualizzare i dettagli
              </Text>
            </Box>
          ) : (
            <>
              <Box bg="blue.500" color="white" p={2}>
                <Heading size="md">
                  {selectedTest.nome || `Test ${selectedTest.tipo}`}
                </Heading>
                <Badge 
                  colorScheme={getStatusColor(selectedTest.status)}
                  mt={1}
                  size="sm"
                >
                  {getStatusText(selectedTest.status)}
                </Badge>
              </Box>
              
              <Box p={3} flex="1" overflow="auto">
                {selectedTest.descrizione && (
                  <Text mb={3}>
                    {selectedTest.descrizione}
                  </Text>
                )}
                
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mt={1}>
                  <Card variant="outline">
                    <CardBody py={3}>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Tipo di test
                      </Text>
                      <Flex align="center">
                        <Box as={TbSchool} mr={2} color="blue.500" />
                        <Text>
                          {selectedTest.tipo || 'Non specificato'}
                        </Text>
                      </Flex>
                    </CardBody>
                  </Card>
                  
                  <Card variant="outline">
                    <CardBody py={3}>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Data di assegnazione
                      </Text>
                      <Flex align="center">
                        <Box as={MdEvent} mr={2} color="blue.500" />
                        <Text>
                          {formatDate(selectedTest.assignedAt || selectedTest.createdAt)}
                        </Text>
                      </Flex>
                    </CardBody>
                  </Card>
                  
                  {/* Card per la data di completamento se il test è completato */}
                  {selectedTest.status === 'completed' && selectedTest.dataCompletamento && (
                    <Card variant="outline">
                      <CardBody py={3}>
                        <Text fontSize="sm" color="gray.500" mb={1}>
                          Data di completamento
                        </Text>
                        <Flex align="center">
                          <Box as={MdCheckCircle} mr={2} color="green.500" />
                          <Text>
                            {formatDate(selectedTest.dataCompletamento)}
                          </Text>
                        </Flex>
                      </CardBody>
                    </Card>
                  )}
                  
                  {selectedTest.configurazione && selectedTest.configurazione.tempoLimite && (
                    <Card variant="outline">
                      <CardBody py={3}>
                        <Text fontSize="sm" color="gray.500" mb={1}>
                          Tempo limite
                        </Text>
                        <Flex align="center">
                          <Box as={MdAccessTime} mr={2} color="blue.500" />
                          <Text>
                            {selectedTest.configurazione.tempoLimite} minuti
                          </Text>
                        </Flex>
                      </CardBody>
                    </Card>
                  )}
                  
                  {selectedTest.configurazione && selectedTest.configurazione.tentativiMax && (
                    <Card variant="outline">
                      <CardBody py={3}>
                        <Text fontSize="sm" color="gray.500" mb={1}>
                          Tentativi massimi
                        </Text>
                        <Text>
                          {selectedTest.configurazione.tentativiMax}
                          {selectedTest.attempts > 0 && ` (utilizzati: ${selectedTest.attempts})`}
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </SimpleGrid>
                
                {selectedTest.configurazione && selectedTest.configurazione.istruzioni && (
                  <Box mt={3}>
                    <Heading size="sm" mb={2}>
                      Istruzioni
                    </Heading>
                    <Box 
                      p={2} 
                      bg="gray.50"
                      borderRadius="md" 
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Text fontSize="sm">
                        {selectedTest.configurazione.istruzioni}
                      </Text>
                    </Box>
                  </Box>
                )}
                
                {selectedTest.status === 'pending' && (
                  <Box mt={3}>
                    <Text fontWeight="medium" mb={1}>
                      Puoi iniziare questo test quando sei pronto
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      Assicurati di avere abbastanza tempo per completarlo, soprattutto se è previsto un tempo limite.
                    </Text>
                  </Box>
                )}
              </Box>
              
              {/* Sezione per test completati */}
              {selectedTest.status === 'completed' && (
                <Box 
                  p={2} 
                  borderTop="1px solid" 
                  borderColor="gray.200"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={2}
                  bg="green.50"
                >
                  <Alert status="success" variant="subtle" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Test completato con successo!</AlertTitle>
                      <AlertDescription>
                        Hai completato questo test in data {formatDate(selectedTest.dataCompletamento || selectedTest.updatedAt)}.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  {/* Opzionale: pulsante per visualizzare i risultati se implementi questa funzionalità */}
                  <Button
                    colorScheme="green"
                    leftIcon={<Box as={MdAssignment} />}
                    onClick={() => navigate(`/risultati-test/${selectedTest._id}`)}
                    size="md"
                    isDisabled={true} // Abilita quando implementi la pagina dei risultati
                  >
                    Visualizza Risultati
                  </Button>
                </Box>
              )}
              
              {/* Pulsanti per l'azione del test - Inizia Test */}
              {selectedTest.status === 'pending' && (
                <Box 
                  p={2} 
                  borderTop="1px solid" 
                  borderColor="gray.200"
                  display="flex"
                  justifyContent="flex-end"
                >
                  <Tooltip 
                    isDisabled={canStartTest(selectedTest)}
                    hasArrow
                    label={
                      !canStartTest(selectedTest) 
                        ? "Hai già un test dello stesso tipo in corso. Completa quello prima di avviarne un altro."
                        : ""
                    }
                    placement="top"
                  >
                    <Button
                      colorScheme="blue"
                      size="md"
                      leftIcon={<Box as={MdPlayArrow} />}
                      onClick={() => handleStartTest(selectedTest._id)}
                      isLoading={loading.test || startingTestId === selectedTest._id}
                      loadingText="Avvio..."
                      minWidth="150px"
                      isDisabled={!canStartTest(selectedTest)}
                      boxShadow="sm"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'md'
                      }}
                      transition="all 0.2s ease"
                    >
                      Inizia Test
                    </Button>
                  </Tooltip>
                </Box>
              )}
              
              {/* Pulsanti per l'azione del test - Continua Test */}
              {selectedTest.status === 'in_progress' && (
                <Box 
                  p={2} 
                  borderTop="1px solid" 
                  borderColor="gray.200"
                  display="flex"
                  justifyContent="flex-end"
                >
                  <Button
                    colorScheme="green"
                    size="md"
                    leftIcon={<Box as={MdPlayCircleOutline} />}
                    onClick={() => navigate(`/test/${selectedTest.tipo.toLowerCase()}/${selectedTest.currentToken}`)}
                    isLoading={loading.test}
                    loadingText="Caricamento..."
                    minWidth="150px"
                    boxShadow="sm"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'md'
                    }}
                    transition="all 0.2s ease"
                  >
                    Continua Test
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default AssignedTestsPage;