import React from 'react';
import { createRoot } from 'react-dom/client';
import { ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import theme from './theme';
import { DynamicThemeProvider } from './context/DynamicThemeContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <DynamicThemeProvider>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
      </DynamicThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);