// ThemeStorage.js
// Utility per gestire la persistenza delle impostazioni dei temi nel localStorage

// Chiavi utilizzate nel localStorage
const STORAGE_KEYS = {
    THEME: 'theme',
    DARK_MODE: 'darkMode',
    CUSTOM_COLOR: 'customThemeColor',
    CUSTOM_SECONDARY_COLOR: 'customThemeSecondaryColor',
    FONT_SIZE: 'fontSize',
    USER_PREFERENCES: 'userThemePreferences'
};

/**
 * Salva il tema corrente nel localStorage
 * @param {string} themeName - Il nome del tema da salvare
 */
export const saveTheme = (themeName) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.THEME, themeName);
    }
};

/**
 * Recupera il tema salvato dal localStorage
 * @param {string} defaultTheme - Il tema di default da usare se nessun tema è salvato
 * @returns {string} Il nome del tema salvato o il tema di default
 */
export const getSavedTheme = (defaultTheme) => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEYS.THEME) || defaultTheme;
    }
    return defaultTheme;
};

/**
 * Salva la modalità scura nel localStorage
 * @param {boolean} isDarkMode - Se la modalità scura è attiva
 */
export const saveDarkMode = (isDarkMode) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
    }
};

/**
 * Recupera la modalità scura dal localStorage
 * @param {boolean} defaultValue - Il valore di default da usare se non c'è nulla nel localStorage
 * @returns {boolean} Se la modalità scura è attiva
 */
export const getSavedDarkMode = (defaultValue = false) => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
        return saved !== null ? saved === 'true' : defaultValue;
    }
    return defaultValue;
};

/**
 * Salva il colore personalizzato nel localStorage
 * @param {string} color - Il colore personalizzato in formato esadecimale (es. #FF0000)
 */
export const saveCustomColor = (color) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_COLOR, color);
    }
};



/**
 * Recupera il colore personalizzato dal localStorage
 * @param {string} defaultColor - Il colore di default da usare se non c'è nulla nel localStorage
 * @returns {string} Il colore personalizzato
 */
export const getSavedCustomColor = (defaultColor = '#64B5F6') => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEYS.CUSTOM_COLOR) || defaultColor;
    }
    return defaultColor;
};

/**
 * Salva il colore secondario personalizzato nel localStorage
 * @param {string|null} color - Il colore secondario personalizzato in formato esadecimale o null per rimuoverlo
 */
export const saveCustomSecondaryColor = (color) => {
    if (typeof window !== 'undefined') {
        if (color === null) {
            localStorage.removeItem(STORAGE_KEYS.CUSTOM_SECONDARY_COLOR);
        } else {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_SECONDARY_COLOR, color);
        }
    }
};


/**
 * Recupera il colore secondario personalizzato dal localStorage
 * @param {string|null} defaultColor - Il colore di default da usare se non c'è nulla nel localStorage, null per nessun colore secondario
 * @returns {string|null} Il colore secondario personalizzato o null
 */
export const getSavedCustomSecondaryColor = (defaultColor = null) => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_SECONDARY_COLOR);
        return saved !== null ? saved : defaultColor;
    }
    return defaultColor;
};

/**
 * Salva la dimensione del font nel localStorage
 * @param {string} fontSize - La dimensione del font (es. 'small', 'medium', 'large')
 */
export const saveFontSize = (fontSize) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
    }
};

/**
 * Recupera la dimensione del font dal localStorage
 * @param {string} defaultSize - La dimensione di default da usare se non c'è nulla nel localStorage
 * @returns {string} La dimensione del font
 */
export const getSavedFontSize = (defaultSize = 'medium') => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || defaultSize;
    }
    return defaultSize;
};

/**
 * Salva tutte le preferenze del tema in una volta sola
 * @param {Object} preferences - Oggetto con tutte le preferenze
 * @param {string} preferences.theme - Il nome del tema
 * @param {boolean} preferences.darkMode - Se la modalità scura è attiva
 * @param {string} preferences.customColor - Il colore personalizzato
 * @param {string} preferences.customSecondaryColor - Il colore secondario personalizzato
 * @param {string} preferences.fontSize - La dimensione del font
 */
export const saveAllPreferences = ({ theme, darkMode, customColor, customSecondaryColor, fontSize }) => {
    if (theme) saveTheme(theme);
    if (darkMode !== undefined) saveDarkMode(darkMode);
    if (customColor) saveCustomColor(customColor);
    if (customSecondaryColor) saveCustomSecondaryColor(customSecondaryColor);
    if (fontSize) saveFontSize(fontSize);
};

/**
 * Recupera tutte le preferenze del tema dal localStorage
 * @param {Object} defaults - Valori di default
 * @returns {Object} Tutte le preferenze del tema
 */
export const getAllPreferences = (defaults = {}) => {
    return {
        theme: getSavedTheme(defaults.theme || 'light'),
        darkMode: getSavedDarkMode(defaults.darkMode),
        customColor: getSavedCustomColor(defaults.customColor),
        customSecondaryColor: getSavedCustomSecondaryColor(defaults.customSecondaryColor),
        fontSize: getSavedFontSize(defaults.fontSize)
    };
};

/**
 * Cancella tutte le preferenze del tema dal localStorage
 */
export const clearAllPreferences = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.THEME);
        localStorage.removeItem(STORAGE_KEYS.DARK_MODE);
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_COLOR);
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_SECONDARY_COLOR);
        localStorage.removeItem(STORAGE_KEYS.FONT_SIZE);
    }
};

/**
 * Verifica se ci sono preferenze salvate nel localStorage
 * @returns {boolean} True se ci sono preferenze salvate
 */
export const hasStoredPreferences = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEYS.THEME) !== null ||
               localStorage.getItem(STORAGE_KEYS.DARK_MODE) !== null ||
               localStorage.getItem(STORAGE_KEYS.CUSTOM_COLOR) !== null ||
               localStorage.getItem(STORAGE_KEYS.CUSTOM_SECONDARY_COLOR) !== null ||
               localStorage.getItem(STORAGE_KEYS.FONT_SIZE) !== null;
    }
    return false;
};

// Esporta anche le chiavi di storage
export { STORAGE_KEYS };