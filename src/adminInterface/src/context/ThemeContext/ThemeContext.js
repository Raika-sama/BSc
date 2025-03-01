import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material';
import { themes, defaultTheme, isValidTheme } from './themes';
import {
    saveTheme,
    getSavedTheme,
    saveDarkMode,
    getSavedDarkMode,
    saveCustomColor,
    getSavedCustomColor,
    saveCustomSecondaryColor,
    getSavedCustomSecondaryColor,
    getAllPreferences
} from './ThemeStorage';

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
    // Recupera le preferenze salvate
    const savedPreferences = getAllPreferences({ theme: defaultTheme });
    
    // Stato per il tema corrente
    const [currentTheme, setCurrentTheme] = useState(savedPreferences.theme);

    // Stato per la modalità (light/dark)
    const [darkMode, setDarkMode] = useState(() => {
        // Se il tema salvato contiene "Dark", impostiamo darkMode a true
        if (savedPreferences.darkMode !== undefined) {
            return savedPreferences.darkMode;
        }
        // Altrimenti verifichiamo se il tema corrente contiene "Dark"
        return savedPreferences.theme.includes('Dark');
    });

    // Stato per il colore personalizzato primario (per il tema custom)
    const [customColor, setCustomColor] = useState(savedPreferences.customColor);
    
    // Stato per il colore personalizzato secondario
    const [customSecondaryColor, setCustomSecondaryColor] = useState(savedPreferences.customSecondaryColor);

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

    // Funzione per verificare se un tema è bicolore
    const isBicolorTheme = (themeName) => {
        if (themeName === 'custom') {
            return customSecondaryColor !== null && customSecondaryColor !== undefined;
        }
        
        const baseTheme = getBaseTheme(themeName);
        const themeObj = themes[baseTheme] || themes[themeName];
        return themeObj?.palette?.secondary?.main !== undefined;
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
            
            // Crea il tema con getCustomTheme
            // Passiamo il colore secondario solo se è effettivamente specificato
            const themeConfig = themes.getCustomTheme(customColor, customSecondaryColor, mode);
            
            console.log('Creating Material-UI theme with config:', themeConfig);
            return createTheme(themeConfig);
        }
        
        return createTheme(themes[effectiveTheme]);
    }, [currentTheme, customColor, customSecondaryColor, darkMode]);

    // Funzione per cambiare tema
    const changeTheme = (newTheme) => {
        if (isValidTheme(newTheme)) {
            const isNewThemeDark = newTheme.includes('Dark');
            saveTheme(newTheme);
            saveDarkMode(isNewThemeDark);
            setCurrentTheme(newTheme);
            setDarkMode(isNewThemeDark);
        } else if (newTheme === 'custom') {
            // Per il tema personalizzato
            saveTheme(newTheme);
            setCurrentTheme('custom');
        }
    };

    // Funzione per toggleTheme che supporta tutti i temi
    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        saveDarkMode(newDarkMode);
        setDarkMode(newDarkMode);
        
        // Se non è un tema personalizzato, aggiorna anche il tema corrente
        if (currentTheme !== 'custom') {
            const baseTheme = getBaseTheme(currentTheme);
            const newTheme = newDarkMode ? `${baseTheme}Dark` : baseTheme;
            
            // Verifica se il nuovo tema esiste
            if (isValidTheme(newTheme)) {
                saveTheme(newTheme);
                setCurrentTheme(newTheme);
            }
        }
    };

    // Funzione per impostare un colore primario personalizzato
    const setCustomThemeColor = (color) => {
        setCustomColor(color);
        saveCustomColor(color);
        if (currentTheme !== 'custom') {
            changeTheme('custom');
        }
    };

    // Funzione per impostare un colore secondario personalizzato
// Funzione per impostare un colore secondario personalizzato
const setCustomThemeSecondaryColor = (color) => {
    console.log('Setting custom secondary color:', color);
    
    // Validazione del colore
    if (color !== null && (!color.startsWith('#') || color.length !== 7)) {
        console.warn('Invalid color format:', color);
        return;
    }
    
    setCustomSecondaryColor(color);
    saveCustomSecondaryColor(color);
    
    // Sempre cambio a tema personalizzato quando si imposta un colore
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
            if (e.key === 'customThemeColor') {
                setCustomColor(e.newValue);
            }
            if (e.key === 'customThemeSecondaryColor') {
                setCustomSecondaryColor(e.newValue);
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
        customColor,           // Colore primario personalizzato corrente
        customSecondaryColor,  // Colore secondario personalizzato corrente
        changeTheme,          // Funzione per cambiare tema
        toggleTheme,          // Funzione per alternare tra light e dark
        setCustomThemeColor,  // Funzione per impostare un colore personalizzato primario
        setCustomThemeSecondaryColor, // Funzione per impostare un colore personalizzato secondario
        isValidTheme,        // Utility function per validare i temi
        isDarkTheme,          // Utility function per verificare se un tema è dark
        isBicolorTheme       // Utility function per verificare se un tema è bicolore
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};