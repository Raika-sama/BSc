// src/context/ThemeContext/themes.js

const lightTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#64B5F6',
            light: '#90CAF9',
            dark: '#42A5F5',
            contrastText: '#fff'
        },
        background: {
            default: '#F5F7FA',
            paper: '#FFFFFF'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#E3F2FD',
            selected: '#BBDEFB',
            text: '#37474F'
        }
    }
};

const darkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#64B5F6',
            light: '#90CAF9',
            dark: '#42A5F5',
            contrastText: '#fff'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#E0E0E0'
        }
    }
};

const getCustomTheme = (primaryColor) => ({
    palette: {
        ...(darkTheme.palette.mode === 'dark' ? darkTheme.palette : lightTheme.palette),
        primary: {
            main: primaryColor,
            // Calcolare automaticamente light/dark/contrastText basati sul colore principale
        }
    }
});

export const themes = {
    light: lightTheme,
    dark: darkTheme,
    getCustomTheme
};

// Utility per verificare se un tema è valido
export const isValidTheme = (themeName) => {
    return ['light', 'dark'].includes(themeName);
};

// Tema di default
export const defaultTheme = 'light';