import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ColorModeScript } from '@chakra-ui/react';
import { DynamicThemeProvider } from './context/DynamicThemeContext';
import { AuthProvider } from './hooks/useAuth'; // Modificato il percorso di importazione
import App from './App';
import theme from './theme';

/**
 * Componente root dell'applicazione che gestisce la gerarchia dei provider
 * Questo approccio garantisce che i provider siano inizializzati nell'ordine corretto
 */
const AppRoot = () => {
  return (
    <BrowserRouter>
      <DynamicThemeProvider>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        {/* Importante: AuthProvider ora viene importato dal percorso corretto */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </DynamicThemeProvider>
    </BrowserRouter>
  );
};

export default AppRoot;