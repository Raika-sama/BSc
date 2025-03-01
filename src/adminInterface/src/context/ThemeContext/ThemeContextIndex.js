// src/context/ThemeContext/ThemeContextIndex.js
export { ThemeProvider, useTheme } from './ThemeContext';
export { 
    themes, 
    defaultTheme,
    lightenColor,
    darkenColor,
    getContrastText,
    isValidTheme
} from './themes';
export {
    saveTheme,
    getSavedTheme,
    saveDarkMode,
    getSavedDarkMode,
    saveCustomColor,
    getSavedCustomColor,
    saveCustomSecondaryColor,
    getSavedCustomSecondaryColor,
    saveAllPreferences,
    getAllPreferences,
    clearAllPreferences,
    hasStoredPreferences,
    STORAGE_KEYS
} from './ThemeStorage';