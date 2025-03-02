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
 * Componente per il cambio password al primo accesso
 */
const FirstAccessForm = ({ onSubmit, error, studentId, temporaryPassword }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  /**
   * Formatta il messaggio di errore, gestendo sia stringhe che oggetti
   */
  const formatErrorMessage = (error) => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return 'Si è verificato un errore';
  };

  /**
   * Valida i campi del form
   * @returns {boolean} True se la validazione passa, false altrimenti
   */
  const validateForm = () => {
    const errors = {
      newPassword: '',
      confirmPassword: ''
    };
    
    let isValid = true;

    if (!newPassword) {
      errors.newPassword = 'Nuova password richiesta';
      isValid = false;
    } else if (newPassword.length < 8) {
      errors.newPassword = 'La password deve contenere almeno 8 caratteri';
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Conferma password richiesta';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono';
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
      await onSubmit(studentId, temporaryPassword, newPassword);
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
          Primo Accesso
        </Heading>
        
        <Text textAlign="center" color="gray.600" mb={4}>
          Devi cambiare la tua password temporanea prima di accedere
        </Text>
        
        {errorMessage && (
          <Alert status="error" rounded="md">
            <AlertIcon />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <FormControl isInvalid={!!formErrors.newPassword}>
          <FormLabel htmlFor="newPassword">Nuova Password</FormLabel>
          <InputGroup>
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nuova password"
              autoComplete="new-password"
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
          <FormErrorMessage>{formErrors.newPassword}</FormErrorMessage>
        </FormControl>
        
        <FormControl isInvalid={!!formErrors.confirmPassword}>
          <FormLabel htmlFor="confirmPassword">Conferma Password</FormLabel>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Conferma nuova password"
            autoComplete="new-password"
          />
          <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
        </FormControl>
        
        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          width="100%"
          mt={6}
          isLoading={isSubmitting}
          loadingText="Aggiornamento in corso..."
        >
          Cambia Password e Accedi
        </Button>
      </VStack>
    </Box>
  );
};

export default FirstAccessForm;