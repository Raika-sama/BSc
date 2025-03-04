import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import themeManager from '../theme/themeManager';

// Crea il contesto per il tema dinamico
const DynamicThemeContext = createContext();

/**
 * Provider personalizzato per gestire il tema dinamico dell'applicazione
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componenti figli
 */
export const DynamicThemeProvider = ({ children }) => {
  // Funzione per generare il CSS delle animazioni
  const generateAnimationCSS = (animations) => {
    if (!animations) return { keyframes: {}, animationStyles: {} };
    
    const keyframes = {};
    const animationStyles = {};
    
    if (animations.glow && animations.glow.enabled) {
      keyframes.glow = {
        '0%': { filter: 'brightness(1)' },
        '50%': { filter: `brightness(${1 + (animations.glow.intensity || 0.2)})` },
        '100%': { filter: 'brightness(1)' }
      };
      animationStyles.glow = `glow ${animations.glow.duration || '2s'} infinite`;
    }
    
    if (animations.shine && animations.shine.enabled) {
      keyframes.shine = {
        '0%': { backgroundPosition: '-100%' },
        '100%': { backgroundPosition: '200%' }
      };
      animationStyles.shine = `shine ${animations.shine.duration || '3s'} infinite linear`;
    }
    
    if (animations.pulse && animations.pulse.enabled) {
      keyframes.pulse = {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: `scale(${1 + (animations.pulse.intensity || 0.02)})` },
        '100%': { transform: 'scale(1)' }
      };
      animationStyles.pulse = `pulse ${animations.pulse.duration || '2s'} infinite`;
    }
    
    return { keyframes, animationStyles };
  };
  
  // Funzione per generare il tema Chakra UI
  const generateChakraTheme = (theme) => {
    if (!theme || !theme.colors) {
      // Fallback al tema predefinito se il tema è invalido
      return extendTheme({});
    }

    const { keyframes, animationStyles } = generateAnimationCSS(theme.animations);
    
    // Imposta i colori del layout predefiniti se non esistono
    // Usa versioni più chiare dei colori per Sidebar, Header e Footer
    const layoutColors = theme.layout?.colors || {
      sidebar: theme.colors.brand[100],    // Prima era 700
      topMenu: theme.colors.brand[100],    // Prima era 600
      footer: theme.colors.brand[100],     // Prima era 800
      background: theme.colors.brand[50],
    };

    return extendTheme({
      colors: {
        ...theme.colors,
        layout: layoutColors
      },
      styles: {
        global: {
          '*': {
            transition: `all ${theme.transition?.duration || '0.2s'} ${theme.transition?.easing || 'ease'}`,
          },
          '@keyframes shine': {
            '0%': {
              backgroundPosition: '-100%'
            },
            '100%': {
              backgroundPosition: '200%'
            }
          },
          // Utilizza un operatore safe per evitare errori quando keyframes è vuoto
          ...(Object.keys(keyframes).length > 0 
            ? Object.entries(keyframes).reduce((acc, [name, frames]) => ({
                ...acc,
                [`@keyframes ${name}`]: frames
              }), {}) 
            : {}
          ),
          '.sidebar': {
            background: theme.layout?.type === 'gradient' && theme.layout?.gradient?.sidebar
              ? `linear-gradient(${theme.layout.gradient.sidebar.direction || '135deg'}, ${theme.layout.gradient.sidebar.colors.map(color => {
                  // Schiarisci i colori del gradiente
                  const match = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
                  if (match) {
                    // Converti il colore in RGB e schiariscilo del 50%
                    const r = parseInt(match[1], 16);
                    const g = parseInt(match[2], 16);
                    const b = parseInt(match[3], 16);
                    // Calcola il valore più chiaro (media con il bianco)
                    const newR = Math.floor((r + 255) / 2);
                    const newG = Math.floor((g + 255) / 2);
                    const newB = Math.floor((b + 255) / 2);
                    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
                  }
                  return color;
                }).join(', ')})`
              : `var(--chakra-colors-layout-sidebar)`,
            ...(theme.animations?.shine?.enabled && {
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                backgroundSize: '200% 100%',
                animation: animationStyles.shine,
                pointerEvents: 'none'
              }
            })
          },
          '.topMenu': {
            background: theme.layout?.type === 'gradient' && theme.layout?.gradient?.topMenu
              ? `linear-gradient(${theme.layout.gradient.topMenu.direction || '90deg'}, ${theme.layout.gradient.topMenu.colors.map(color => {
                  // Schiarisci i colori del gradiente
                  const match = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
                  if (match) {
                    const r = parseInt(match[1], 16);
                    const g = parseInt(match[2], 16);
                    const b = parseInt(match[3], 16);
                    const newR = Math.floor((r + 255) / 2);
                    const newG = Math.floor((g + 255) / 2);
                    const newB = Math.floor((b + 255) / 2);
                    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
                  }
                  return color;
                }).join(', ')})`
              : `var(--chakra-colors-layout-topMenu)`,
            ...(theme.animations?.glow?.enabled && {
              animation: animationStyles.glow
            })
          },
          '.footer': {
            background: theme.layout?.type === 'gradient' && theme.layout?.gradient?.footer
              ? `linear-gradient(${theme.layout.gradient.footer.direction || '90deg'}, ${theme.layout.gradient.footer.colors.map(color => {
                  // Schiarisci i colori del gradiente
                  const match = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
                  if (match) {
                    const r = parseInt(match[1], 16);
                    const g = parseInt(match[2], 16);
                    const b = parseInt(match[3], 16);
                    const newR = Math.floor((r + 255) / 2);
                    const newG = Math.floor((g + 255) / 2);
                    const newB = Math.floor((b + 255) / 2);
                    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
                  }
                  return color;
                }).join(', ')})`
              : `var(--chakra-colors-layout-footer)`
          },
          '.mainContent': {
            background: theme.layout?.type === 'gradient' && theme.layout?.gradient?.background
              ? `linear-gradient(${theme.layout.gradient.background.direction || '135deg'}, ${theme.layout.gradient.background.colors.join(', ')})`
              : `var(--chakra-colors-layout-background)`,
            ...(theme.animations?.pulse?.enabled && {
              animation: animationStyles.pulse
            })
          },
          '.gradient-text': theme.layout?.type === 'gradient' && theme.layout?.gradient?.text ? {
            backgroundImage: `linear-gradient(${theme.layout.gradient.text.direction || '45deg'}, ${theme.layout.gradient.text.colors.join(', ')})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          } : {}
        }
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
  };
  
  // Carica il tema iniziale
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      return themeManager.getCurrentTheme() || themeManager.getDefaultTheme();
    } catch (error) {
      console.error('Errore durante il caricamento del tema:', error);
      return {
        id: 'fallback',
        name: 'Tema Fallback',
        colors: {
          brand: {
            50: '#f2f2f2',
            100: '#d9d9d9',
            200: '#bfbfbf',
            300: '#a6a6a6',
            400: '#8c8c8c',
            500: '#737373',
            600: '#595959',
            700: '#404040',
            800: '#262626',
            900: '#0d0d0d',
          },
          accent: {
            50: '#f2f2f2',
            100: '#d9d9d9',
            500: '#737373',
            700: '#404040',
            900: '#0d0d0d',
          }
        },
        transition: {
          duration: '0.2s',
          easing: 'ease'
        }
      };
    }
  });
  
  // Crea un tema Chakra UI esteso con le proprietà del tema corrente
  const [chakraTheme, setChakraTheme] = useState(() => {
    return generateChakraTheme(currentTheme);
  });
  
  // Funzione per cambiare il tema
  const changeTheme = (theme) => {
    if (!theme) return;
    
    // Salva il tema nel localStorage
    try {
      themeManager.applyTheme(theme);
    } catch (error) {
      console.error('Errore durante il salvataggio del tema:', error);
    }
    
    // Aggiorna lo stato del tema corrente
    setCurrentTheme(theme);
    
    // Aggiorna il tema Chakra UI
    setChakraTheme(generateChakraTheme(theme));
  };
  
  // Funzione per eliminare un tema personalizzato
  const deleteCustomTheme = (themeId) => {
    // Recupera i temi personalizzati dal localStorage
    try {
      const storedThemes = localStorage.getItem('customThemes');
      if (storedThemes) {
        const customThemes = JSON.parse(storedThemes);
        
        // Filtra il tema da eliminare
        const updatedThemes = customThemes.filter(theme => theme.id !== themeId);
        
        // Salva i temi aggiornati
        localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
        
        // Se il tema corrente è quello eliminato, passa al tema predefinito
        if (currentTheme.id === themeId) {
          const defaultTheme = themeManager.getDefaultTheme();
          changeTheme(defaultTheme);
        }
        
        // Emetti un evento per notificare altri componenti del cambiamento
        window.dispatchEvent(new CustomEvent('customThemesChanged'));
        
        return true;
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione del tema:', error);
    }
    
    return false;
  };
  
  // Listener per eventi di cambio tema esterni
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'currentThemeId') {
        try {
          const newTheme = themeManager.getCurrentTheme();
          if (newTheme) {
            changeTheme(newTheme);
          }
        } catch (error) {
          console.error('Errore durante la gestione del cambio tema:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Valore del contesto
  const contextValue = {
    currentTheme,
    changeTheme,
    deleteCustomTheme
  };
  
  return (
    <DynamicThemeContext.Provider value={contextValue}>
      <ChakraProvider theme={chakraTheme}>
        {children}
      </ChakraProvider>
    </DynamicThemeContext.Provider>
  );
};

/**
 * Hook per utilizzare il contesto del tema dinamico
 * @returns {Object} Contesto del tema dinamico
 */
export const useDynamicTheme = () => {
  const context = useContext(DynamicThemeContext);
  if (context === undefined) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
};

export default DynamicThemeContext;