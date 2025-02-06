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

const getCustomTheme = (primaryColor, mode = 'light') => ({
    palette: {
        ...(mode === 'dark' ? darkTheme.palette : lightTheme.palette),
        mode: mode,
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
