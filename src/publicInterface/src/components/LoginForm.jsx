import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  InputGroup,
  InputRightElement,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

/**
 * Componente per il form di login studenti
 */
const LoginForm = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: ''
  });

  /**
   * Formatta il messaggio di errore, gestendo sia stringhe che oggetti
   */
  const formatErrorMessage = (error) => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return 'Si è verificato un errore durante il login';
  };

  /**
   * Valida i campi del form
   * @returns {boolean} True se la validazione passa, false altrimenti
   */
  const validateForm = () => {
    const errors = {
      username: '',
      password: ''
    };
    
    let isValid = true;

    if (!username.trim()) {
      errors.username = 'Email richiesta';
      isValid = false;
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(username)) {
      errors.username = 'Formato email non valido';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password richiesta';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Gestisce l'invio del form
   * @param {Event} e - L'evento del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onLogin(username, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatta il messaggio di errore
  const errorMessage = formatErrorMessage(error);

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="lg" textAlign="center">
          Accesso Studenti
        </Heading>
        
        <Text textAlign="center" color="gray.600" mb={4}>
          Inserisci le tue credenziali per accedere ai test
        </Text>
        
        {errorMessage && (
          <Alert status="error" rounded="md">
            <AlertIcon />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <FormControl isInvalid={!!formErrors.username}>
          <FormLabel htmlFor="username">Email</FormLabel>
          <Input
            id="username"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="La tua email di studente"
            autoComplete="username"
          />
          <FormErrorMessage>{formErrors.username}</FormErrorMessage>
        </FormControl>
        
        <FormControl isInvalid={!!formErrors.password}>
          <FormLabel htmlFor="password">Password</FormLabel>
          <InputGroup>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
            <InputRightElement width="3rem">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <ViewOffIcon /> : <ViewIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formErrors.password}</FormErrorMessage>
        </FormControl>
        
        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          width="100%"
          mt={6}
          isLoading={isSubmitting}
          loadingText="Accesso in corso..."
        >
          Accedi
        </Button>
      </VStack>
    </Box>
  );
};

export default LoginForm;