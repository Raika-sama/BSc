import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Divider,
  Badge,
  Skeleton,
  Card,
  CardHeader,
  CardBody,
  Icon,
  useColorModeValue,
  Avatar,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { MdPerson, MdSchool, MdClass, MdEmail, MdCalendarToday, MdAccessTime, MdRefresh } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Corretto il percorso di importazione
import studentService from '../utils/studentService';
import { formatDate } from '../utils/formatters';

/**
 * Normalizza i dati dello studente per renderli consistenti
 * @param {Object} data - Dati grezzi ricevuti dall'API
 * @returns {Object} Dati normalizzati
 */
const normalizeStudentData = (data) => {
  if (!data) return null;
  
  console.log('Normalizzazione dati ricevuti:', data);

  // Estrazione delle entità principali con controllo approfondito
  const studentData = data.student || {};
  
  // Gestione più flessibile dei dati di scuola (potrebbero essere in formati diversi)
  let schoolData = data.school || {};
  if (!schoolData || Object.keys(schoolData).length === 0) {
    // Proviamo a trovare i dati della scuola nello studente
    if (studentData.schoolId && typeof studentData.schoolId === 'object') {
      schoolData = studentData.schoolId;
      console.log('Utilizzati dati scuola da studentData.schoolId:', schoolData);
    }
  }
  
  // Gestione più flessibile dei dati di classe (potrebbero essere in formati diversi)
  let classData = data.class || {};
  if (!classData || Object.keys(classData).length === 0) {
    // Proviamo a trovare i dati della classe nello studente
    if (studentData.classId && typeof studentData.classId === 'object') {
      classData = studentData.classId;
      console.log('Utilizzati dati classe da studentData.classId:', classData);
    }
  }

  // Normalizzazione dati studente
  const normalizedStudent = {
    ...studentData,
    id: studentData._id || studentData.id || '',
    firstName: studentData.firstName || '',
    lastName: studentData.lastName || '',
    email: studentData.email || '',
    dateOfBirth: studentData.dateOfBirth || null,
    gender: studentData.gender || '',
    parentEmail: studentData.parentEmail || '',
    fiscalCode: studentData.fiscalCode || '',
    status: studentData.status || 'pending',
    specialNeeds: studentData.specialNeeds || false,
    lastLogin: studentData.lastLogin || null,
    accountCreatedAt: studentData.accountCreatedAt || studentData.createdAt || null,
    username: studentData.username || ''
  };

  // Normalizzazione dati scuola
  const normalizedSchool = {
    ...schoolData,
    id: schoolData._id || schoolData.id || '',
    name: schoolData.name || '',
    code: schoolData.code || '',
    schoolType: schoolData.schoolType || '',
    type: schoolData.type || '',
    city: schoolData.city || '',
    address: schoolData.address || ''
  };

  // Normalizzazione dati classe
  const normalizedClass = {
    ...classData,
    id: classData._id || classData.id || '',
    year: classData.year || '',
    section: classData.section || '',
    name: classData.name || '',
    academicYear: classData.academicYear || ''
  };
  
  const result = {
    student: normalizedStudent,
    school: normalizedSchool,
    class: normalizedClass
  };
  
  console.log('Dati normalizzati:', result);
  return result;
};

/**
 * Pagina del profilo studente che mostra tutte le informazioni personali e scolastiche
 */
const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { student, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Colori
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconColor = useColorModeValue('brand.600', 'brand.300');

  // Carica i dati del profilo dello studente
  useEffect(() => {
    const fetchProfileData = async () => {
      if (authLoading) return; // Aspetta che lo stato di autenticazione sia verificato
      
      if (!isAuthenticated) {
        navigate('/login', { state: { from: { pathname: '/profile' } } });
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Recupera i dati completi dal server
        const response = await studentService.getStudentProfile();
        console.log('Dati profilo ricevuti:', response);
        
        if (response && (response.status === 'success' || response.data)) {
          // Normalizziamo i dati per garantire coerenza
          const normalizedData = normalizeStudentData(response.data);
          setProfileData(normalizedData);
        } else {
          throw new Error('Risposta non valida dal server');
        }
      } catch (err) {
        console.error('Errore nel caricamento del profilo:', err);
        
        // Gestione degli errori migliorata
        const errorMessage = typeof err === 'string' ? err : 
                          err.message || err.error || 'Errore nel caricamento del profilo';
        
        setError(errorMessage);
        
        // Se non riusciamo a caricare i dati dal server, proviamo ad usare i dati del contesto come fallback
        if (student) {
          // Verifichiamo se abbiamo una scuola e una classe nei dati del contesto
          const fallbackData = {
            student: student,
            school: student.schoolId && typeof student.schoolId === 'object' ? student.schoolId : {},
            class: student.classId && typeof student.classId === 'object' ? student.classId : {}
          };
          
          // Normalizziamo anche i dati di fallback
          const normalizedFallback = normalizeStudentData(fallbackData);
          setProfileData(normalizedFallback);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, authLoading, navigate, student]);

  // Funzione per ricaricare i dati
  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    // Ricarica i dati utilizzando lo stesso metodo iniziale per garantire coerenza
    studentService.getStudentProfile()
      .then(response => {
        if (response && (response.status === 'success' || response.data)) {
          // Normalizziamo i dati per garantire coerenza 
          const normalizedData = normalizeStudentData(response.data);
          setProfileData(normalizedData);
        } else {
          throw new Error('Risposta non valida dal server');
        }
      })
      .catch(err => {
        console.error('Errore durante il refresh:', err);
        const errorMessage = err.response?.data?.error?.message || err.message || 'Impossibile aggiornare i dati';
        setError(errorMessage);
      })
      .finally(() => setIsLoading(false));
  };

  // Rendering di un campo del profilo
  const ProfileField = ({ icon, label, value }) => (
    <HStack spacing={2} align="flex-start">
      <Icon as={icon} boxSize={5} color={iconColor} mt={1} />
      <VStack align="flex-start" spacing={0}>
        <Text fontSize="sm" color="gray.500">{label}</Text>
        <Text fontWeight="medium">{value || 'Non disponibile'}</Text>
      </VStack>
    </HStack>
  );

  // Mappa lo stato dello studente a un colore badge
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { color: 'green', label: 'Attivo' },
      pending: { color: 'orange', label: 'In attesa' },
      inactive: { color: 'red', label: 'Inattivo' },
      transferred: { color: 'blue', label: 'Trasferito' },
      graduated: { color: 'purple', label: 'Diplomato' },
      unregistered: { color: 'gray', label: 'Non registrato' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', label: status || 'Non disponibile' };
    return <Badge colorScheme={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  // Renderizza i dettagli della scuola
  const SchoolDetails = ({ school }) => {
    if (!school || Object.keys(school).length === 0) {
      return <Text color="gray.500">Informazioni sulla scuola non disponibili</Text>;
    }
    
    return (
      <VStack align="flex-start" spacing={2}>
        <ProfileField 
          icon={MdSchool} 
          label="Nome Scuola" 
          value={school.name} 
        />
        {school.code && (
          <ProfileField 
            icon={MdSchool} 
            label="Codice Scuola" 
            value={school.code} 
          />
        )}
        <ProfileField 
          icon={MdSchool} 
          label="Tipologia" 
          value={school.schoolType === 'primary' ? 'Scuola Primaria' : 
                 school.schoolType === 'middle' ? 'Scuola Media' : 
                 school.schoolType === 'high' ? 'Scuola Superiore' : 
                 school.type || school.schoolType || 'Non specificata'} 
        />
        {school.city && (
          <ProfileField 
            icon={MdSchool} 
            label="Città" 
            value={school.city} 
          />
        )}
        {school.address && (
          <ProfileField 
            icon={MdSchool} 
            label="Indirizzo" 
            value={school.address} 
          />
        )}
      </VStack>
    );
  };

  // Renderizza i dettagli della classe
  const ClassDetails = ({ classData }) => {
    if (!classData || Object.keys(classData).length === 0) {
      return <Text color="gray.500">Informazioni sulla classe non disponibili</Text>;
    }
    
    return (
      <VStack align="flex-start" spacing={2}>
        <ProfileField 
          icon={MdClass} 
          label="Classe" 
          value={`${classData.year || ''}${classData.section || ''}`} 
        />
        {classData.name && (
          <ProfileField 
            icon={MdClass} 
            label="Nome Classe" 
            value={classData.name} 
          />
        )}
        <ProfileField 
          icon={MdClass} 
          label="Anno Accademico" 
          value={classData.academicYear || 'Corrente'} 
        />
      </VStack>
    );
  };

  // Se siamo in attesa dell'autenticazione, mostra loading
  if (authLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="40px" width="200px" />
          <Skeleton height="200px" />
        </VStack>
      </Container>
    );
  }

  // Renderizzazione condizionale in base allo stato di caricamento
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="40px" width="200px" />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Skeleton height="200px" />
            <Skeleton height="200px" />
          </SimpleGrid>
          <Skeleton height="200px" />
        </VStack>
      </Container>
    );
  }

  // Estrai i dati se disponibili
  const studentData = profileData?.student || student || {};
  const schoolData = profileData?.school || {};
  const classData = profileData?.class || {};

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Il Mio Profilo</Heading>
          <Button 
            leftIcon={<MdRefresh />} 
            colorScheme="blue" 
            size="sm" 
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            Aggiorna
          </Button>
        </HStack>
        
        {/* Visualizza un messaggio di errore se presente, ma mostra comunque i dati disponibili */}
        {error && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Attenzione</AlertTitle>
              <AlertDescription display="block">
                {error}
              </AlertDescription>
            </Box>
          </Alert>
        )}
        
        {/* Card Informazioni Personali */}
        <Card variant="outline" bg={cardBg} borderColor={borderColor}>
          <CardHeader pb={0}>
            <HStack justify="space-between" align="center">
              <HStack spacing={4}>
                <Avatar 
                  size="lg" 
                  name={`${studentData.firstName || ''} ${studentData.lastName || ''}`} 
                  src={studentData.avatarUrl} 
                />
                <VStack align="flex-start" spacing={0}>
                  <Heading size="md">
                    {studentData.firstName || 'Nome'} {studentData.lastName || 'Cognome'}
                  </Heading>
                  <HStack>
                    {getStatusBadge(studentData.status)}
                    {studentData.specialNeeds && <Badge colorScheme="purple">Supporto dedicato</Badge>}
                  </HStack>
                </VStack>
              </HStack>
            </HStack>
          </CardHeader>
          
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
              {/* Prima colonna: Dati personali */}
              <VStack align="flex-start" spacing={4}>
                <Heading size="sm">Dati Personali</Heading>
                <Divider />
                <VStack align="flex-start" spacing={2} width="100%">
                  <ProfileField 
                    icon={MdPerson} 
                    label="Nome Completo" 
                    value={`${studentData.firstName || ''} ${studentData.lastName || ''}`} 
                  />
                  <ProfileField 
                    icon={MdPerson} 
                    label="Genere" 
                    value={studentData.gender === 'M' ? 'Maschile' : 
                           studentData.gender === 'F' ? 'Femminile' : 
                           studentData.gender || 'Non specificato'} 
                  />
                  {studentData.fiscalCode && (
                    <ProfileField 
                      icon={MdPerson} 
                      label="Codice Fiscale" 
                      value={studentData.fiscalCode} 
                    />
                  )}
                  <ProfileField 
                    icon={MdCalendarToday} 
                    label="Data di Nascita" 
                    value={formatDate(studentData.dateOfBirth) || 'Non specificata'} 
                  />
                  <ProfileField 
                    icon={MdEmail} 
                    label="Email" 
                    value={studentData.email || 'Non specificata'} 
                  />
                  {studentData.parentEmail && (
                    <ProfileField 
                      icon={MdEmail} 
                      label="Email Genitore" 
                      value={studentData.parentEmail} 
                    />
                  )}
                </VStack>
              </VStack>
              
              {/* Seconda colonna: Account */}
              <VStack align="flex-start" spacing={4}>
                <Heading size="sm">Informazioni Account</Heading>
                <Divider />
                <VStack align="flex-start" spacing={2} width="100%">
                  <ProfileField 
                    icon={MdPerson} 
                    label="Username" 
                    value={studentData.username || 'Non disponibile'} 
                  />
                  <ProfileField 
                    icon={MdAccessTime} 
                    label="Ultimo Accesso" 
                    value={formatDate(studentData.lastLogin) || 'Mai'} 
                  />
                  {studentData.accountCreatedAt && (
                    <ProfileField 
                      icon={MdAccessTime} 
                      label="Account Creato il" 
                      value={formatDate(studentData.accountCreatedAt)} 
                    />
                  )}
                </VStack>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
        
        {/* Card Informazioni Scolastiche */}
        <Card variant="outline" bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Informazioni Scolastiche</Heading>
          </CardHeader>
          
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {/* Prima colonna: Scuola */}
              <VStack align="flex-start" spacing={4}>
                <Heading size="sm">Scuola</Heading>
                <Divider />
                <SchoolDetails school={schoolData} />
              </VStack>
              
              {/* Seconda colonna: Classe */}
              <VStack align="flex-start" spacing={4}>
                <Heading size="sm">Classe</Heading>
                <Divider />
                <ClassDetails classData={classData} />
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default ProfilePage;