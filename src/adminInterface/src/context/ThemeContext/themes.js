// src/context/ThemeContext/themes.js
// Aggiungiamo le utility functions per il colore
const lightenColor = (color, amount) => {
    try {
        // Rimuoviamo il carattere # se presente
        const hex = color.replace('#', '');
        
        // Convertiamo in RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        // Schiarisce i valori RGB
        r = Math.min(255, Math.round(r + (255 - r) * amount));
        g = Math.min(255, Math.round(g + (255 - g) * amount));
        b = Math.min(255, Math.round(b + (255 - b) * amount));
        
        // Converti di nuovo in hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        console.error('Error in lightenColor:', e);
        return color; // Ritorna il colore originale in caso di errore
    }
};

const darkenColor = (color, amount) => {
    try {
        // Rimuoviamo il carattere # se presente
        const hex = color.replace('#', '');
        
        // Convertiamo in RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        // Scurisce i valori RGB
        r = Math.max(0, Math.round(r * (1 - amount)));
        g = Math.max(0, Math.round(g * (1 - amount)));
        b = Math.max(0, Math.round(b * (1 - amount)));
        
        // Converti di nuovo in hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        console.error('Error in darkenColor:', e);
        return color; // Ritorna il colore originale in caso di errore
    }
};

const getContrastText = (hexcolor) => {
    try {
        // Rimuovi il carattere # se presente
        const hex = hexcolor.replace('#', '');
        
        // Converti in RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Calcola la luminosità percepita
        // Usando la formula: (0.299*R + 0.587*G + 0.114*B)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Se la luminosità è maggiore di 0.5, il testo sarà nero, altrimenti bianco
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (e) {
        console.error('Error in getContrastText:', e);
        return '#FFFFFF'; // Ritorna bianco come fallback
    }
};

const lightTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#2196F3',        // Un blu più scuro e meno brillante (era '#64B5F6')
            light: '#64B5F6',       // Mantenuto come colore chiaro
            dark: '#1976D2',        // Un blu ancora più scuro (era '#42A5F5')
            contrastText: '#fff'
        },
        background: {
            default: '#FAFBFD',     // Un grigio molto chiaro e più neutro (era '#F5F7FA')
            paper: '#FFFFFF'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#EDF3FA',       // Un blu più tenue per l'hover (era '#E3F2FD')
            selected: '#E3F2FD',    // Un blu più leggero per la selezione (era '#BBDEFB')
            text: '#2C3E50'         // Un grigio più scuro per il testo (era '#37474F')
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

const getCustomTheme = (primaryColor, mode = 'light') => ({
    palette: {
        ...(mode === 'dark' ? darkTheme.palette : lightTheme.palette),
        mode: mode,  // Assicuriamoci che la modalità sia correttamente impostata
        primary: {
            main: primaryColor,
            light: lightenColor(primaryColor, 0.2),
            dark: darkenColor(primaryColor, 0.2),
            contrastText: getContrastText(primaryColor)
        }
    }
});

export const themes = {
    light: lightTheme,
    dark: darkTheme,
    getCustomTheme
};

// Esporta anche le funzioni di utilità
export {
    lightenColor,
    darkenColor,
    getContrastText
};

// Utility per verificare se un tema è valido
export const isValidTheme = (themeName) => {
    return ['light', 'dark'].includes(themeName);
};

// Tema di default
export const defaultTheme = 'light';