// Utility functions per il colore
const lightenColor = (color, amount) => {
    try {
        const hex = color.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        r = Math.min(255, Math.round(r + (255 - r) * amount));
        g = Math.min(255, Math.round(g + (255 - g) * amount));
        b = Math.min(255, Math.round(b + (255 - b) * amount));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        console.error('Error in lightenColor:', e);
        return color;
    }
};

const darkenColor = (color, amount) => {
    try {
        const hex = color.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        r = Math.max(0, Math.round(r * (1 - amount)));
        g = Math.max(0, Math.round(g * (1 - amount)));
        b = Math.max(0, Math.round(b * (1 - amount)));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        console.error('Error in darkenColor:', e);
        return color;
    }
};

const getContrastText = (hexcolor) => {
    try {
        const hex = hexcolor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (e) {
        console.error('Error in getContrastText:', e);
        return '#FFFFFF';
    }
};

const lightTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#2196F3',
            light: '#64B5F6',
            dark: '#1976D2',
            contrastText: '#fff'
        },
        background: {
            default: '#FAFBFD',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#EDF3FA',
            selected: '#E3F2FD',
            text: '#2C3E50'
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
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#E0E0E0'
        }
    }
};

const oceanTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#006D77',
            light: '#83C5BE',
            dark: '#004E57',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#EDF6F9',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#E3F3F6',
            selected: '#B8E1E6',
            text: '#006D77'
        }
    }
};

const oceanDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#83C5BE',
            light: '#A7D5D0',
            dark: '#006D77',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#83C5BE'
        }
    }
};

const sunsetTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#FF6B6B',
            light: '#FFB4A2',
            dark: '#E63946',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#FFF0EB',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#FFE8E0',
            selected: '#FFD5C7',
            text: '#E63946'
        }
    }
};

const sunsetDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#FF6B6B',
            light: '#FFB4A2',
            dark: '#E63946',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#FF6B6B'
        }
    }
};

const forestTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#2D6A4F',
            light: '#74C69D',
            dark: '#1B4332',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#F0F7F4',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#E8F3ED',
            selected: '#D1E7DD',
            text: '#2D6A4F'
        }
    }
};

const forestDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#74C69D',
            light: '#95D5B2',
            dark: '#2D6A4F',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#74C69D'
        }
    }
};

const lavenderTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#7952B3',
            light: '#9F7AEA',
            dark: '#553C9A',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#F3F0FF',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#EBE5FF',
            selected: '#DDD6FE',
            text: '#553C9A'
        }
    }
};

const lavenderDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#9F7AEA',
            light: '#B794F4',
            dark: '#7952B3',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#9F7AEA'
        }
    }
};
const cyberpunkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#00ff9f',      // Verde neon
            light: '#80ffcf',
            dark: '#00cc7f',
            contrastText: '#000000'
        },
        background: {
            default: '#0a0a20',   // Blu scurissimo
            paper: '#1a1a35'      // Blu scuro
        },
        text: {
            primary: '#ffffff',
            secondary: '#00ff9f'
        },
        sidebar: {
            background: '#1a1a35',
            hover: '#2a2a45',
            selected: '#3a3a55',
            text: '#00ff9f'
        }
    }
};

const candyTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#FF69B4',      // Hot pink
            light: '#FFB6C1',     // Light pink
            dark: '#FF1493',      // Deep pink
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#FFF0F5',   // Lavender blush
            paper: '#FFFFFF'
        },
        text: {
            primary: '#FF1493',
            secondary: '#FF69B4'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#FFF0F5',
            selected: '#FFE4E1',
            text: '#FF1493'
        }
    }
};

const retroWaveTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#FF00FF',      // Magenta neon
            light: '#FF66FF',
            dark: '#CC00CC',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#000033',   // Blu notte
            paper: '#1a1a4a'      // Blu elettrico scuro
        },
        text: {
            primary: '#00FFFF',   // Cyan neon
            secondary: '#FF00FF'
        },
        sidebar: {
            background: '#1a1a4a',
            hover: '#2a2a5a',
            selected: '#3a3a6a',
            text: '#00FFFF'
        }
    }
};

const natureTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#4CAF50',      // Verde natura
            light: '#81C784',
            dark: '#388E3C',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#F1F8E9',   // Verde chiaro naturale
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2E7D32',
            secondary: '#558B2F'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#F1F8E9',
            selected: '#DCEDC8',
            text: '#2E7D32'
        }
    }
};

const galaxyTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#7B1FA2',      // Viola galattico
            light: '#9C27B0',
            dark: '#6A1B9A',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#0D0221',   // Blu notte profondo
            paper: '#170B3B'      // Viola scuro
        },
        text: {
            primary: '#E1BEE7',   // Viola chiaro
            secondary: '#BA68C8'
        },
        sidebar: {
            background: '#170B3B',
            hover: '#261448',
            selected: '#351D54',
            text: '#E1BEE7'
        }
    }
};

const sunsetBeachTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#FF6B6B',      // Corallo
            light: '#FFA07A',     // Pesca
            dark: '#FF4757',      // Corallo scuro
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#FFF3E0',   // Sabbia chiara
            paper: '#FFFFFF'
        },
        text: {
            primary: '#FF4757',
            secondary: '#FFA07A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#FFF3E0',
            selected: '#FFE0B2',
            text: '#FF4757'
        }
    }
};

// Nuovi temi bicolore
const blueOrangeTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#1976D2',       // Blu principale
            light: '#64B5F6',
            dark: '#0D47A1',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#FF9800',       // Arancione secondario
            light: '#FFB74D',
            dark: '#F57C00',
            contrastText: '#000000'
        },
        background: {
            default: '#F5F7FA',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#E3F2FD',
            selected: '#BBDEFB',
            text: '#1976D2'
        }
    }
};

const blueOrangeDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#64B5F6',       // Blu chiaro principale
            light: '#90CAF9',
            dark: '#1976D2',
            contrastText: '#000000'
        },
        secondary: {
            main: '#FFB74D',       // Arancione chiaro secondario
            light: '#FFCC80',
            dark: '#FF9800',
            contrastText: '#000000'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#64B5F6'
        }
    }
};

const purpleGreenTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#6A1B9A',       // Viola principale
            light: '#9C27B0',
            dark: '#4A148C',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#2E7D32',       // Verde secondario
            light: '#4CAF50',
            dark: '#1B5E20',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#F9F5FF',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#F3E5F5',
            selected: '#E1BEE7',
            text: '#6A1B9A'
        }
    }
};

const purpleGreenDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#AB47BC',       // Viola chiaro principale
            light: '#CE93D8',
            dark: '#7B1FA2',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#66BB6A',       // Verde chiaro secondario
            light: '#81C784',
            dark: '#388E3C',
            contrastText: '#000000'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#AB47BC'
        }
    }
};

const redTealTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#D32F2F',       // Rosso principale
            light: '#EF5350',
            dark: '#B71C1C',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#00897B',       // Teal secondario
            light: '#26A69A',
            dark: '#00695C',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#FFEBEE',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#FFCDD2',
            selected: '#EF9A9A',
            text: '#D32F2F'
        }
    }
};

const redTealDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#EF5350',       // Rosso chiaro principale
            light: '#E57373',
            dark: '#C62828',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#26A69A',       // Teal chiaro secondario
            light: '#4DB6AC',
            dark: '#00796B',
            contrastText: '#000000'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#EF5350'
        }
    }
};

// Nuovi temi bicolore

// 1. Magenta e Lime
const magentaLimeTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#C2185B',       // Magenta
            light: '#E91E63',
            dark: '#880E4F',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#CDDC39',       // Lime
            light: '#D4E157',
            dark: '#9E9D24',
            contrastText: '#000000'
        },
        background: {
            default: '#FCF4F9',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#FCE4EC',
            selected: '#F8BBD0',
            text: '#C2185B'
        }
    }
};

const magentaLimeDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#E91E63',       // Magenta chiaro
            light: '#F06292',
            dark: '#C2185B',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#DCE775',       // Lime chiaro
            light: '#E6EE9C',
            dark: '#CDDC39',
            contrastText: '#000000'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#E91E63'
        }
    }
};

// 2. Ambra e Indaco
const amberIndigoTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#FFC107',       // Ambra
            light: '#FFD54F',
            dark: '#FFA000',
            contrastText: '#000000'
        },
        secondary: {
            main: '#3F51B5',       // Indaco
            light: '#5C6BC0',
            dark: '#303F9F',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#FFF8E1',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#FFF8E1',
            selected: '#FFECB3',
            text: '#FFA000'
        }
    }
};

const amberIndigoDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#FFD54F',       // Ambra chiaro
            light: '#FFE082',
            dark: '#FFC107',
            contrastText: '#000000'
        },
        secondary: {
            main: '#5C6BC0',       // Indaco chiaro
            light: '#7986CB',
            dark: '#3F51B5',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#FFD54F'
        }
    }
};

// 3. Teal e Rosa
const tealPinkTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#009688',       // Teal
            light: '#4DB6AC',
            dark: '#00796B',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#EC407A',       // Rosa
            light: '#F48FB1',
            dark: '#D81B60',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#E0F2F1',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#2C3E50',
            secondary: '#546E7A'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#E0F2F1',
            selected: '#B2DFDB',
            text: '#00796B'
        }
    }
};

const tealPinkDarkTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#4DB6AC',       // Teal chiaro
            light: '#80CBC4',
            dark: '#009688',
            contrastText: '#000000'
        },
        secondary: {
            main: '#F48FB1',       // Rosa chiaro
            light: '#F8BBD0',
            dark: '#EC407A',
            contrastText: '#000000'
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E'
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5'
        },
        sidebar: {
            background: '#1E1E1E',
            hover: '#2C2C2C',
            selected: '#383838',
            text: '#4DB6AC'
        }
    }
};

// Nuovi temi pazzerelli

// 1. Neon Party
const neonPartyTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#FF00FF',      // Magenta neon
            light: '#FF33FF',
            dark: '#CC00CC',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#00FFFF',      // Cyan neon
            light: '#33FFFF',
            dark: '#00CCCC',
            contrastText: '#000000'
        },
        background: {
            default: '#000000',   // Nero
            paper: '#121212'      // Nero più chiaro
        },
        text: {
            primary: '#FFFFFF',   // Bianco
            secondary: '#FFFF00'  // Giallo neon
        },
        sidebar: {
            background: '#121212',
            hover: '#1E1E1E',
            selected: '#2A2A2A',
            text: '#00FF00'       // Verde neon
        }
    }
};

// 2. Pastello
const pastelTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#FFB6C1',      // Rosa pastello
            light: '#FFC1E3',
            dark: '#FF99B3',
            contrastText: '#000000'
        },
        secondary: {
            main: '#B0E0E6',      // Azzurro pastello
            light: '#CCF2F4',
            dark: '#97D2D9',
            contrastText: '#000000'
        },
        background: {
            default: '#F8F9FA',   // Bianco sporco
            paper: '#FFFFFF'      // Bianco
        },
        text: {
            primary: '#6C757D',   // Grigio scuro
            secondary: '#ADB5BD'  // Grigio chiaro
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#F8F9FA',
            selected: '#FFE4E1',  // Misty rose
            text: '#FF99B3'
        }
    }
};

// 3. Minecraft
const minecraftTheme = {
    palette: {
        mode: 'light',
        primary: {
            main: '#5D7C15',      // Verde Minecraft
            light: '#7BAA20',
            dark: '#435C08',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#825432',      // Marrone terra
            light: '#9C6B42',
            dark: '#5F3E25',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#90A4AE',   // Grigio cielo
            paper: '#B0BEC5'      // Grigio chiaro
        },
        text: {
            primary: '#212121',   // Quasi nero
            secondary: '#4E342E'  // Marrone scuro
        },
        sidebar: {
            background: '#78909C', // Grigio bluastro
            hover: '#607D8B',
            selected: '#546E7A',
            text: '#FFFFFF'
        }
    }
};

// 4. Cosmic
const cosmicTheme = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#673AB7',      // Viola cosmico
            light: '#9575CD',
            dark: '#4527A0',
            contrastText: '#FFFFFF'
        },
        secondary: {
            main: '#FF4081',      // Rosa cosmico
            light: '#FF80AB',
            dark: '#C51162',
            contrastText: '#FFFFFF'
        },
        background: {
            default: '#0B0B19',   // Blu spazio profondo
            paper: '#171732'      // Blu notte
        },
        text: {
            primary: '#F5F5F5',   // Quasi bianco
            secondary: '#B39DDB'  // Lavanda
        },
        sidebar: {
            background: '#171732',
            hover: '#232347',
            selected: '#2E2E5A',
            text: '#F5F5F5'
        }
    }
};

const getCustomTheme = (primaryColor, secondaryColor = null, mode = 'light') => {
    console.log('Creating custom theme with:', { primaryColor, secondaryColor, mode });
    
    // Verifica che i colori siano validi
    if (!primaryColor || typeof primaryColor !== 'string' || !primaryColor.startsWith('#')) {
        console.warn('Primary color is invalid:', primaryColor);
        primaryColor = mode === 'dark' ? '#64B5F6' : '#2196F3';
    }

    // Base theme to start from
    const baseTheme = mode === 'dark' ? darkTheme : lightTheme;
    
    // Create theme config starting from a base theme completo
    const themeConfig = {
        ...JSON.parse(JSON.stringify(baseTheme)), // Clone profondo del tema base
        palette: {
            ...JSON.parse(JSON.stringify(baseTheme.palette)), // Clone profondo della palette
            mode: mode,
            primary: {
                main: primaryColor,
                light: lightenColor(primaryColor, 0.2),
                dark: darkenColor(primaryColor, 0.2),
                contrastText: getContrastText(primaryColor)
            }
        }
    };
    
    // Assicuriamoci che il tema abbia sempre una palette secondary
    if (secondaryColor && typeof secondaryColor === 'string' && secondaryColor.startsWith('#')) {
        console.log('Setting custom secondary color:', secondaryColor);
        themeConfig.palette.secondary = {
            main: secondaryColor,
            light: lightenColor(secondaryColor, 0.2),
            dark: darkenColor(secondaryColor, 0.2),
            contrastText: getContrastText(secondaryColor)
        };
    } else {
        // Lasciamo il colore secondario del tema base
        console.log('Using default secondary color from base theme');
    }
    
    console.log('Final theme config:', themeConfig);
    return themeConfig;
};

export const themes = {
    light: lightTheme,
    dark: darkTheme,
    ocean: oceanTheme,
    oceanDark: oceanDarkTheme,
    sunset: sunsetTheme,
    sunsetDark: sunsetDarkTheme,
    forest: forestTheme,
    forestDark: forestDarkTheme,
    lavender: lavenderTheme,
    lavenderDark: lavenderDarkTheme,
    cyberpunk: cyberpunkTheme,
    candy: candyTheme,
    retroWave: retroWaveTheme,
    nature: natureTheme,
    galaxy: galaxyTheme,
    sunsetBeach: sunsetBeachTheme,
    blueOrange: blueOrangeTheme,
    blueOrangeDark: blueOrangeDarkTheme,
    purpleGreen: purpleGreenTheme,
    purpleGreenDark: purpleGreenDarkTheme,
    redTeal: redTealTheme,
    redTealDark: redTealDarkTheme,
    // Nuovi temi bicolore
    magentaLime: magentaLimeTheme,
    magentaLimeDark: magentaLimeDarkTheme,
    amberIndigo: amberIndigoTheme,
    amberIndigoDark: amberIndigoDarkTheme,
    tealPink: tealPinkTheme,
    tealPinkDark: tealPinkDarkTheme,
    // Nuovi temi pazzerelli
    neonParty: neonPartyTheme,
    pastel: pastelTheme,
    minecraft: minecraftTheme,
    cosmic: cosmicTheme,
    getCustomTheme
};

export {
    lightenColor,
    darkenColor,
    getContrastText
};

export const isValidTheme = (themeName) => {
    return Object.keys(themes).includes(themeName);
};

export const defaultTheme = 'light';
