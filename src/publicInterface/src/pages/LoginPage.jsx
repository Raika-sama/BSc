import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Card, 
  CardBody, 
  Image, 
  Flex, 
  useToast,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  CloseButton
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import FirstAccessForm from '../components/FirstAccessForm';
import { useAuth } from '../hooks/useAuth';

/**
 * Pagina di login per gli studenti
 */
const LoginPage = () => {
  const { login, handleFirstAccess, error, isAuthenticated, loading, logoutSuccess, setLogoutSuccess } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [firstAccessMode, setFirstAccessMode] = useState(false);
  const [firstAccessData, setFirstAccessData] = useState({
    studentId: '',
    temporaryPassword: ''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Effettua il redirect alla home se già autenticato
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Naviga alla pagina originale richiesta (se disponibile) o alla home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Reset del messaggio di logout quando la pagina viene chiusa
  useEffect(() => {
    return () => {
      if (logoutSuccess) {
        setLogoutSuccess(false);
      }
    };
  }, [logoutSuccess, setLogoutSuccess]);

  /**
   * Gestisce il processo di login
   */
  const handleLogin = async (username, password) => {
    try {
      setLoginError('');
      console.log("Tentativo di login con:", username);
      
      const result = await login(username, password);
      console.log("Risultato login:", result);
      
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
        
        // Naviga alla pagina originale richiesta (se disponibile) o alla home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setLoginError(result.error || 'Errore durante il login');
      }
    } catch (err) {
      console.error("Errore nel gestore login:", err);
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
        {/* Notifica di logout effettuato */}
        {logoutSuccess && (
          <Alert 
            status="success" 
            mb={6} 
            borderRadius="md"
            boxShadow="sm"
          >
            <AlertIcon />
            <AlertTitle mr={2}>Logout effettuato con successo</AlertTitle>
            <CloseButton 
              position="absolute" 
              right="8px" 
              top="8px" 
              onClick={() => setLogoutSuccess(false)} 
            />
          </Alert>
        )}
        
        <Flex direction="column" align="center" mb={8}>
          <Center mb={6}>
            <Image 
              src="/brainscanner-logo.png" 
              alt="BrainScanner Logo" 
              maxH="80px" 
              fallbackSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAA8CAMAAACzWLMAAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABjUExURUdwTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF5P6ysAAAAgdFJOUwAQIDBAUGBwgI+fr7/P3+8ghHDvv2AQn1CfMDCPQI9YCI2NAAAB+ElEQVRo3u3Y2XKjMBAF0JuQkZAQO2aH8f9/5yQzlQcvDSGpSiWZ86bC7XuFcLfk5SUWi8VisVgsFuv/0efn8/l5v4fx8PRvXv/j3ZKm6dvbW5e3P++WOK31MAxKa63Gan753tLcEkSIGQxL0hgjhBhjnMcagSW1YwkijdZ5lqb9h+pvS3t76WF0znvvDbpKKQmsjBxrami89yaSRkBmYUlgjYiSWIMxxgfrNarjWBxZztpgA0uCJHCtWifQJixeCZZWyrlxdOjpmJVwrBqvzK0sS0Cs933XDV3nPbZ0HEsIS7GySrAahA1DNwyjjWMVedYDSyqllbIWhXP4Cw7qMJZkLFmWRpZSL609OBYbbGPLNucTXBeytA5jMRZg5RBmOYZBxLESf6XrPM+R5c95EcfyyGpUtU6ASieeSnEsTl8Va9s2YDWnc2WOY+2x1YJgDdeFWT/ACmAdKrgK1uuNWWGsgiQRwrGK87l+gXU6lRhYe+dSBscKp1LOKI7VxLLKy6W63YBVvZ/PR7Aqhh0UC11qFSJg1Q+w6ucLfjTGsQbgCOGciyaBtUcIYwVWDafbCVgvOLMOY9W8zdbMgrsSskRZNcbC4vGlKNELbTYQdRTLhuV+v9/vA8MsdBkGZZj1fvQ+WlUVwF5svnFUr1ePrxOo83y/+g/L9+MSi8VisVgsFot1vL4ASOdwgZiMYDsAAAAASUVORK5CYII="
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