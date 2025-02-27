import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material';
import { themes, defaultTheme, isValidTheme } from './themes';

// Creiamo il context
const ThemeContext = createContext();

// Custom hook per utilizzare il theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme deve essere usato all\'interno di un ThemeProvider');
    }
    return context;
};

// Theme Provider component
export const ThemeProvider = ({ children }) => {
    // Stato per il tema corrente
    const [currentTheme, setCurrentTheme] = useState(() => {
        // Recupera il tema salvato dal localStorage o usa il default
        const savedTheme = localStorage.getItem('theme');
        return isValidTheme(savedTheme) ? savedTheme : defaultTheme;
    });

    // Stato per la modalità (light/dark)
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        // Se il tema salvato contiene "Dark", impostiamo darkMode a true
        if (savedMode !== null) {
            return savedMode === 'true';
        }
        // Altrimenti verifichiamo se il tema corrente contiene "Dark"
        return currentTheme.includes('Dark');
    });

    // Stato per il colore personalizzato (per il tema custom)
    const [customColor, setCustomColor] = useState(() => {
        return localStorage.getItem('customThemeColor') || '#64B5F6';
    });

    // Funzione per ottenere il nome del tema base (senza "Dark")
    const getBaseTheme = (themeName) => {
        return themeName.replace('Dark', '');
    };

    // Funzione per ottenere il nome del tema con o senza "Dark"
    const getThemeVariant = (themeName, wantDark) => {
        if (themeName === 'custom') return themeName;
        
        const baseTheme = getBaseTheme(themeName);
        return wantDark ? `${baseTheme}Dark` : baseTheme;
    };

    // Funzione per determinare se un tema è in modalità dark
    const isDarkTheme = (themeName) => {
        if (themeName === 'custom') {
            return darkMode;
        }
        return themeName.includes('Dark');
    };

    // Determina il tema effettivo da utilizzare basandosi sul tema corrente e sulla modalità dark
    const getEffectiveTheme = () => {
        if (currentTheme === 'custom') {
            return 'custom';
        }
        
        const baseTheme = getBaseTheme(currentTheme);
        const darkVariant = `${baseTheme}Dark`;
        
        // Verifica se esiste la variante desiderata
        if (darkMode) {
            return isValidTheme(darkVariant) ? darkVariant : currentTheme;
        } else {
            return isValidTheme(baseTheme) ? baseTheme : currentTheme;
        }
    };

    // Genera il tema Material-UI
    const theme = React.useMemo(() => {
        const effectiveTheme = getEffectiveTheme();
        
        if (effectiveTheme === 'custom') {
            // Per il tema personalizzato, usa la modalità corrente
            const mode = darkMode ? 'dark' : 'light';
            return createTheme(themes.getCustomTheme(customColor, mode));
        }
        
        return createTheme(themes[effectiveTheme]);
    }, [currentTheme, customColor, darkMode]);

    // Funzione per cambiare tema
    const changeTheme = (newTheme) => {
        if (isValidTheme(newTheme)) {
            const isNewThemeDark = newTheme.includes('Dark');
            localStorage.setItem('theme', newTheme);
            localStorage.setItem('darkMode', isNewThemeDark.toString());
            setCurrentTheme(newTheme);
            setDarkMode(isNewThemeDark);
        } else if (newTheme === 'custom') {
            // Per il tema personalizzato
            localStorage.setItem('theme', newTheme);
            setCurrentTheme('custom');
        }
    };

    // Funzione per toggleTheme che supporta tutti i temi
    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        localStorage.setItem('darkMode', newDarkMode.toString());
        setDarkMode(newDarkMode);
        
        // Se non è un tema personalizzato, aggiorna anche il tema corrente
        if (currentTheme !== 'custom') {
            const baseTheme = getBaseTheme(currentTheme);
            const newTheme = newDarkMode ? `${baseTheme}Dark` : baseTheme;
            
            // Verifica se il nuovo tema esiste
            if (isValidTheme(newTheme)) {
                localStorage.setItem('theme', newTheme);
                setCurrentTheme(newTheme);
            }
        }
    };

    // Funzione per impostare un colore personalizzato
    const setCustomThemeColor = (color) => {
        setCustomColor(color);
        localStorage.setItem('customThemeColor', color);
        if (currentTheme !== 'custom') {
            changeTheme('custom');
        }
    };

    // Effetto per sincronizzare il tema con il localStorage
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme' && e.newValue !== currentTheme) {
                setCurrentTheme(isValidTheme(e.newValue) ? e.newValue : defaultTheme);
            }
            if (e.key === 'darkMode') {
                setDarkMode(e.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentTheme]);

    // Effetto per applicare il tema al body
    useEffect(() => {
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.color = theme.palette.text.primary;
        
        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
        };
    }, [theme]);

    const value = {
        theme,                  // Il tema Material-UI corrente
        currentTheme,          // Nome del tema corrente
        darkMode,              // Se la modalità scura è attiva
        customColor,           // Colore personalizzato corrente
        changeTheme,          // Funzione per cambiare tema
        toggleTheme,          // Funzione per alternare tra light e dark
        setCustomThemeColor,  // Funzione per impostare un colore personalizzato
        isValidTheme,        // Utility function per validare i temi
        isDarkTheme          // Utility function per verificare se un tema è dark
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};