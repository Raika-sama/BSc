import React, { useState, useEffect } from 'react';
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
  Button,
  Divider,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Flex,
  Stack,
  Skeleton
} from '@chakra-ui/react';
import { AccessTimeIcon, AssignmentIcon, FaSchool, FaCalendar, FaPlay } from 'react-icons/fa';
import { TbSchool } from 'react-icons/tb';
import { MdAssignment, MdAccessTime, MdEvent, MdPlayArrow } from 'react-icons/md';

const AssignedTestsPage = () => {
  const { 
    assignedTests, 
    selectedTest,
    selectTest,
    startTest,
    loading, 
    error, 
    formatDate,
    getAssignedTests,
    clearError
  } = useTest();
  
  // Stato per gestire l'avvio di un test
  const [startingTestId, setStartingTestId] = useState(null);

  // Effetto per ricaricare i test quando la pagina viene montata
  useEffect(() => {
    getAssignedTests();
  }, [getAssignedTests]);

  // Gestore della selezione di un test
  const handleSelectTest = (test) => {
    selectTest(test);
  };

  // Gestore dell'avvio di un test
  const handleStartTest = async (testId) => {
    setStartingTestId(testId);
    try {
      const result = await startTest(testId);
      if (result.success) {
        // In futuro, qui si potrebbe reindirizzare alla pagina del test
        alert('Test avviato con successo! In futuro questa azione aprirà la pagina del test.');
      }
    } finally {
      setStartingTestId(null);
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
              
              {selectedTest.status === 'pending' && (
                <Box 
                  p={2} 
                  borderTop="1px solid" 
                  borderColor="gray.200"
                  display="flex"
                  justifyContent="flex-end"
                >
                  <Button
                    colorScheme="blue"
                    size="md"
                    leftIcon={<Box as={MdPlayArrow} />}
                    onClick={() => handleStartTest(selectedTest._id)}
                    isLoading={loading.test || startingTestId === selectedTest._id}
                    loadingText="Avvio..."
                    minWidth="150px"
                    boxShadow="sm"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'md'
                    }}
                    transition="all 0.2s ease"
                  >
                    Inizia Test
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