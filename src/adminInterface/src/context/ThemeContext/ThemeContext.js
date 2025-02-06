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

    // Stato per il colore personalizzato (per il tema custom)
    const [customColor, setCustomColor] = useState(() => {
        return localStorage.getItem('customThemeColor') || '#64B5F6';
    });

    // Genera il tema Material-UI
    const theme = React.useMemo(() => {
        if (currentTheme === 'custom') {
            // Per il tema personalizzato, determina la modalità basandosi sul tema corrente
            const baseTheme = localStorage.getItem('theme') || defaultTheme;
            const mode = baseTheme.includes('Dark') ? 'dark' : 'light';
            return createTheme(themes.getCustomTheme(customColor, mode));
        }
        return createTheme(themes[currentTheme]);
    }, [currentTheme, customColor]);

    // Funzione per cambiare tema
    const changeTheme = (newTheme) => {
        if (isValidTheme(newTheme)) {
            localStorage.setItem('theme', newTheme);
            setCurrentTheme(newTheme);
        } else if (newTheme === 'custom') {
            // Per il tema personalizzato, mantieni la modalità corrente
            setCurrentTheme('custom');
        }
    };

    // Funzione per determinare se un tema è in modalità dark
    const isDarkTheme = (themeName) => {
        return themeName.includes('Dark');
    };

    // Funzione per ottenere la versione light/dark di un tema
    const getThemeVariant = (themeName, wantDark) => {
        if (themeName === 'custom') return themeName;
        
        const baseTheme = themeName.replace('Dark', '');
        return wantDark ? `${baseTheme}Dark` : baseTheme;
    };

    // Funzione per toggleTheme che supporta i nuovi temi
    const toggleTheme = () => {
        const currentIsDark = isDarkTheme(currentTheme);
        if (currentTheme === 'custom') {
            // Per il tema custom, toggle tra light e dark mantenendo il colore personalizzato
            const newMode = currentIsDark ? 'light' : 'dark';
            localStorage.setItem('theme', newMode);
            setCurrentTheme('custom');
        } else {
            // Per i temi predefiniti, passa tra le versioni light e dark
            const newTheme = getThemeVariant(currentTheme, !currentIsDark);
            changeTheme(newTheme);
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