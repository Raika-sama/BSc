import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Card, 
  CardBody, 
  Image, 
  Flex, 
  useToast,
  Center
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import FirstAccessForm from '../components/FirstAccessForm';
import { useAuth } from '../hooks/useAuth';

/**
 * Pagina di login per gli studenti
 */
const LoginPage = () => {
  const { login, handleFirstAccess, error } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [firstAccessMode, setFirstAccessMode] = useState(false);
  const [firstAccessData, setFirstAccessData] = useState({
    studentId: '',
    temporaryPassword: ''
  });
  const navigate = useNavigate();
  const toast = useToast();

  /**
   * Gestisce il processo di login
   */
  const handleLogin = async (username, password) => {
    try {
      setLoginError('');
      const result = await login(username, password);
      
      if (result.isFirstAccess) {
        // Salva temporaneamente i dati per il form di primo accesso
        setFirstAccessData({
          studentId: result.studentId || '',
          temporaryPassword: password
        });
        setFirstAccessMode(true);
        return;
      }
      
      if (result.success) {
        toast({
          title: 'Login effettuato',
          description: 'Benvenuto nel sistema di test',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/'); // Reindirizza alla home dopo il login
      } else {
        setLoginError(result.error || 'Errore durante il login');
      }
    } catch (err) {
      setLoginError(err.message || 'Errore durante il login');
    }
  };

  /**
   * Gestisce il cambio password al primo accesso
   */
  const handleFirstPasswordChange = async (studentId, tempPassword, newPassword) => {
    try {
      const result = await handleFirstAccess(studentId, tempPassword, newPassword);
      
      if (result.success) {
        toast({
          title: 'Password cambiata con successo',
          description: 'Ora puoi accedere con la tua nuova password',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setFirstAccessMode(false);
      } else {
        setLoginError(result.error || 'Errore durante l\'aggiornamento della password');
      }
    } catch (err) {
      setLoginError(err.message || 'Errore durante l\'aggiornamento della password');
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg="gray.50" 
      py={12} 
      px={4}
    >
      <Container maxW="md">
        <Flex direction="column" align="center" mb={8}>
          <Center mb={6}>
            <Image 
              src="/logo.png" 
              alt="BrainScanner Logo" 
              maxH="80px" 
              fallbackSrc="https://via.placeholder.com/150x80?text=BrainScanner"
            />
          </Center>
        </Flex>
        
        <Card 
          boxShadow="xl" 
          p={4} 
          borderRadius="xl" 
          bg="white"
        >
          <CardBody>
            {firstAccessMode ? (
              <FirstAccessForm 
                onSubmit={handleFirstPasswordChange}
                error={loginError}
                studentId={firstAccessData.studentId}
                temporaryPassword={firstAccessData.temporaryPassword}
              />
            ) : (
              <LoginForm 
                onLogin={handleLogin}
                error={loginError || error}
              />
            )}
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;