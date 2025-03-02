import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

/**
 * Componente per proteggere le rotte accessibili solo a utenti autenticati
 */
const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Mostra spinner durante il caricamento dello stato di autenticazione
  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Verifica accesso in corso...</Text>
        </VStack>
      </Center>
    );
  }

  // Reindirizza al login se l'utente non è autenticato
  if (!isAuthenticated) {
    // Usa state per ricordare la pagina originale richiesta
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Renderizza il contenuto se l'utente è autenticato
  return <Outlet />;
};

export default PrivateRoute;