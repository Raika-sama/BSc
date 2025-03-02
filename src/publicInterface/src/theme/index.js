import { extendTheme } from '@chakra-ui/react';
import themeManager from './themeManager';

// Ottiene il tema attuale dal themeManager
const currentTheme = themeManager.getCurrentTheme();

// Crea un tema Chakra UI esteso con le proprietà del tema corrente
const theme = extendTheme({
  colors: currentTheme.colors,
  styles: {
    global: {
      // Applica le transizioni globali
      '*': {
        transition: `all ${currentTheme.transition.duration} ${currentTheme.transition.easing}`,
      },
    },
  },
  fonts: {
    heading: '"Segoe UI", sans-serif',
    body: '"Segoe UI", sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

export default theme;