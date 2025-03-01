import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Switch,
    FormControlLabel,
    Button,
    Alert,
    AlertTitle,
    Divider,
    Paper
} from '@mui/material';
import { 
    LightMode, 
    DarkMode, 
    Palette, 
    ColorLens, 
    DeleteOutline, 
    Cancel,
    Check
} from '@mui/icons-material';
import { 
    useTheme,
    lightenColor,
    darkenColor,
    getContrastText 
} from '../../../context/ThemeContext/ThemeContextIndex';
import ThemePreview from './ThemePreview';
import ThemeTester from './ThemeTester'; // Importa il componente di test
import { motion } from 'framer-motion';
import { themes } from '../../../context/ThemeContext/themes';

// Componente di anteprima del tema personalizzato
const ThemeColorPreview = () => {
    const { theme } = useTheme();
    
    return (
        <Box sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Anteprima del Tema
            </Typography>
            
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" display="block" gutterBottom>
                        Colore Primario
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" color="primary">
                            Primario
                        </Button>
                        <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.contrastText',
                            fontSize: '0.7rem'
                        }}>
                            Main
                        </Box>
                        <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'primary.light',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.contrastText',
                            fontSize: '0.7rem'
                        }}>
                            Light
                        </Box>
                        <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'primary.dark',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.contrastText',
                            fontSize: '0.7rem'
                        }}>
                            Dark
                        </Box>
                    </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Typography variant="caption" display="block" gutterBottom>
                        Colore Secondario
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" color="secondary">
                            Secondario
                        </Button>
                        <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'secondary.main',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'secondary.contrastText',
                            fontSize: '0.7rem'
                        }}>
                            Main
                        </Box>
                        <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'secondary.light',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'secondary.contrastText',
                            fontSize: '0.7rem'
                        }}>
                            Light
                        </Box>
                        <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'secondary.dark',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'secondary.contrastText',
                            fontSize: '0.7rem'
                        }}>
                            Dark
                        </Box>
                    </Box>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" display="block" gutterBottom>
                        Esempi di utilizzo componenti
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button variant="contained" color="primary">Primary Button</Button>
                        <Button variant="contained" color="secondary">Secondary Button</Button>
                        <Button variant="outlined" color="primary">Outlined Primary</Button>
                        <Button variant="outlined" color="secondary">Outlined Secondary</Button>
                        <FormControlLabel 
                            control={<Switch color="primary" defaultChecked />} 
                            label="Switch primario" 
                        />
                        <FormControlLabel 
                            control={<Switch color="secondary" defaultChecked />} 
                            label="Switch secondario" 
                        />
                    </Box>
                </Grid>
                
                <Grid item xs={12}>
                    <Alert severity="success" sx={{ mt: 2 }}>
                        <AlertTitle>Alert con colore primario</AlertTitle>
                        Esempio di un alert che utilizza le tonalità del colore primario.
                    </Alert>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>Alert con colore secondario</AlertTitle>
                        Esempio di un alert che utilizza altre tonalità di colore.
                    </Alert>
                </Grid>
                
                {/* Dettagli tecnici per il debug */}
                <Grid item xs={12} sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                        primary.main: {theme.palette.primary.main}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                        secondary.main: {theme.palette.secondary?.main || 'non impostato'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                        mode: {theme.palette.mode}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

const ThemeSelectorIndex = () => {
    const { 
        theme,
        currentTheme, 
        changeTheme, 
        customColor, 
        customSecondaryColor,
        setCustomThemeColor, 
        setCustomThemeSecondaryColor,
        toggleTheme, 
        darkMode,
        isBicolorTheme
    } = useTheme();

    // Mapping dei nomi dei temi in italiano
    const themeNames = {
        light: 'Chiaro',
        dark: 'Scuro',
        ocean: 'Oceano',
        oceanDark: 'Oceano Scuro',
        sunset: 'Tramonto',
        sunsetDark: 'Tramonto Scuro',
        forest: 'Foresta',
        forestDark: 'Foresta Scura',
        lavender: 'Lavanda',
        lavenderDark: 'Lavanda Scura',
        cyberpunk: 'Cyberpunk',
        candy: 'Candy',
        retroWave: 'Retrowave',
        nature: 'Nature',
        galaxy: 'Galaxy',
        sunsetBeach: 'Sunset Beach',
        custom: 'Personalizzato',
        // Temi bicolore esistenti
        blueOrange: 'Blu & Arancio',
        blueOrangeDark: 'Blu & Arancio Scuro',
        purpleGreen: 'Viola & Verde',
        purpleGreenDark: 'Viola & Verde Scuro',
        redTeal: 'Rosso & Teal',
        redTealDark: 'Rosso & Teal Scuro',
        // Nuovi temi bicolore
        magentaLime: 'Magenta & Lime',
        magentaLimeDark: 'Magenta & Lime Scuro',
        amberIndigo: 'Ambra & Indaco',
        amberIndigoDark: 'Ambra & Indaco Scuro',
        tealPink: 'Teal & Rosa',
        tealPinkDark: 'Teal & Rosa Scuro',
        // Nuovi temi pazzerelli
        neonParty: 'Neon Party',
        pastel: 'Pastello',
        minecraft: 'Minecraft',
        cosmic: 'Cosmico'
    };

    // Helper per ottenere il tema base senza "Dark"
    const getBaseThemeName = (themeName) => {
        return themeName.replace('Dark', '');
    };

    const handleRemoveSecondaryColor = () => {
        setCustomThemeSecondaryColor(null);
    };

    // Prepara i temi per la preview
    const baseThemes = Object.keys(themes)
        .filter(key => key !== 'getCustomTheme' && !key.includes('Dark'))
        .reduce((acc, key) => {
            // Verifica se esiste una variante scura
            const darkKey = `${key}Dark`;
            const hasDarkVariant = themes[darkKey] !== undefined;
            
            // Ottieni il colore secondario se presente
            const hasSecondaryColor = themes[key]?.palette?.secondary?.main !== undefined;
            
            return {
                ...acc,
                [key]: {
                    palette: {
                        ...themes[key].palette,
                        mode: 'light'
                    },
                    name: themeNames[key] || key,
                    hasDarkVariant,
                    hasSecondaryColor
                }
            };
        }, {});

    // Aggiungi il tema personalizzato
    // Assicuriamoci che abbia esattamente la stessa struttura dei temi predefiniti
    baseThemes.custom = {
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: customColor,
                light: lightenColor(customColor, 0.2),
                dark: darkenColor(customColor, 0.2),
                contrastText: getContrastText(customColor)
            },
            // Assicuriamoci che secondary sia SEMPRE definito, ma impostiamo hasSecondaryColor in base a customSecondaryColor
            secondary: customSecondaryColor ? {
                main: customSecondaryColor,
                light: lightenColor(customSecondaryColor, 0.2),
                dark: darkenColor(customSecondaryColor, 0.2),
                contrastText: getContrastText(customSecondaryColor)
            } : {
                // Un colore dummy che non verrà mostrato ma manterrà la struttura coerente
                main: darkMode ? '#454545' : '#E0E0E0',
                light: darkMode ? '#656565' : '#F5F5F5',
                dark: darkMode ? '#252525' : '#BDBDBD',
                contrastText: darkMode ? '#FFFFFF' : '#000000'
            },
            background: {
                default: darkMode ? '#121212' : '#FFFFFF',
                paper: darkMode ? '#1E1E1E' : '#FFFFFF'
            },
            text: {
                primary: darkMode ? '#FFFFFF' : '#000000',
                secondary: darkMode ? '#B0BEC5' : '#546E7A'
            }
        },
        name: 'Personalizzato',
        hasDarkVariant: true,
        hasSecondaryColor: !!customSecondaryColor
    };

    // Theme change handler
    const handleThemeChange = (newTheme) => {
        // Se in modalità scura e il tema ha una variante scura, usa quella
        if (darkMode && baseThemes[newTheme]?.hasDarkVariant && newTheme !== 'custom') {
            changeTheme(`${newTheme}Dark`);
        } else {
            changeTheme(newTheme);
        }
    };

    // Ottieni il tema base corrente (senza il suffisso "Dark")
    const currentBaseTheme = currentTheme === 'custom' ? 'custom' : getBaseThemeName(currentTheme);
    
    // Determina se il tema corrente è bicolore
    const isCurrentThemeBicolor = currentTheme === 'custom' 
        ? !!customSecondaryColor
        : isBicolorTheme(currentTheme);
    
    // Funzione per generare colori preset per il selettore
    const colorPresets = [
        '#f44336', // Red
        '#E91E63', // Pink
        '#9C27B0', // Purple
        '#673AB7', // Deep Purple
        '#3F51B5', // Indigo
        '#2196F3', // Blue
        '#03A9F4', // Light Blue
        '#00BCD4', // Cyan
        '#009688', // Teal
        '#4CAF50', // Green
        '#8BC34A', // Light Green
        '#CDDC39', // Lime
        '#FFEB3B', // Yellow
        '#FFC107', // Amber
        '#FF9800', // Orange
        '#FF5722', // Deep Orange
        '#795548', // Brown
        '#607D8B'  // Blue Grey
    ];

    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Box sx={{ mb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Seleziona il Tema
                    </Typography>
                </Box>

                {/* Light/Dark Mode Switch */}
                <Box sx={{ mb: 4 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={darkMode}
                                onChange={toggleTheme}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {darkMode ? <DarkMode /> : <LightMode />}
                                <Typography>
                                    {darkMode ? 'Modalità Scura' : 'Modalità Chiara'}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Category titles */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Temi Monocolore
                    </Typography>
                </Box>

                {/* Single Color Theme Previews */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {Object.entries(baseThemes)
                        .filter(([_, theme]) => !theme.hasSecondaryColor && _ !== 'custom')
                        .map(([key, theme]) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                                <ThemePreview
                                    themeData={theme}
                                    themeName={theme.name}
                                    selected={currentBaseTheme === key}
                                    onClick={() => handleThemeChange(key)}
                                    disabled={darkMode && !theme.hasDarkVariant}
                                />
                            </Grid>
                        ))}
                </Grid>

                {/* Bicolor themes section */}
                <Box sx={{ mb: 2, mt: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Temi Bicolore
                    </Typography>
                </Box>

                {/* Bicolor Theme Previews */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {Object.entries(baseThemes)
                        .filter(([_, theme]) => theme.hasSecondaryColor && _ !== 'custom')
                        .map(([key, theme]) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                                <ThemePreview
                                    themeData={theme}
                                    themeName={theme.name}
                                    selected={currentBaseTheme === key}
                                    onClick={() => handleThemeChange(key)}
                                    disabled={darkMode && !theme.hasDarkVariant}
                                    isBicolor={true}
                                />
                            </Grid>
                        ))}
                </Grid>

                {/* Custom theme section */}
                <Box sx={{ mb: 2, mt: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Tema Personalizzato
                    </Typography>
                </Box>

                {/* Custom Theme Preview - posizionato nella stessa griglia degli altri temi */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <ThemePreview
                            themeData={baseThemes['custom']}
                            themeName={baseThemes['custom'].name}
                            selected={currentBaseTheme === 'custom'}
                            onClick={() => handleThemeChange('custom')}
                            disabled={false}
                            isBicolor={!!customSecondaryColor}
                        />
                    </Grid>
                </Grid>

                {/* Custom Theme Color Picker */}
                {currentTheme === 'custom' && (
                <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                    <Typography variant="h6" gutterBottom>
                        Personalizza il tuo tema
                    </Typography>
                    
                    {/* Colore primario */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Colore Primario
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Palette color="primary" />
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                backgroundColor: customColor,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                border: '2px solid #fff'
                            }} />
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomThemeColor(e.target.value)}
                                style={{ width: '100px', height: '40px', cursor: 'pointer' }}
                            />
                        </Box>
                        
                        {/* Preset colori primari */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {colorPresets.map((color) => (
                                <Box 
                                    key={`primary-${color}`}
                                    onClick={() => setCustomThemeColor(color)}
                                    sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        bgcolor: color, 
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        border: customColor === color ? '2px solid' : '1px solid #ddd',
                                        borderColor: customColor === color ? 'primary.main' : 'divider',
                                        '&:hover': { transform: 'scale(1.1)' },
                                        transition: 'transform 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {customColor === color && (
                                        <Check sx={{ fontSize: 16, color: getContrastText(color) }} />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Colore secondario */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Colore Secondario
                            </Typography>
                            {customSecondaryColor && (
                                <Button 
                                    size="small" 
                                    onClick={handleRemoveSecondaryColor}
                                    startIcon={<DeleteOutline />}
                                    color="error"
                                    variant="outlined"
                                >
                                    Rimuovi
                                </Button>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ColorLens color="secondary" />
                            {customSecondaryColor ? (
                                <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: '50%', 
                                    backgroundColor: customSecondaryColor,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    border: '2px solid #fff'
                                }} />
                            ) : (
                                <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: '50%', 
                                    backgroundColor: '#e0e0e0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#9e9e9e'
                                }}>
                                    <Cancel fontSize="small" />
                                </Box>
                            )}
                            <input
                                type="color"
                                value={customSecondaryColor || '#FF9800'}
                                onChange={(e) => setCustomThemeSecondaryColor(e.target.value)}
                                style={{ width: '100px', height: '40px', cursor: 'pointer' }}
                            />
                        </Box>
                        
                        {/* Preset colori secondari */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {colorPresets.map((color) => (
                                <Box 
                                    key={`secondary-${color}`}
                                    onClick={() => setCustomThemeSecondaryColor(color)}
                                    sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        bgcolor: color, 
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        border: customSecondaryColor === color ? '2px solid' : '1px solid #ddd',
                                        borderColor: customSecondaryColor === color ? 'secondary.main' : 'divider',
                                        '&:hover': { transform: 'scale(1.1)' },
                                        transition: 'transform 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {customSecondaryColor === color && (
                                        <Check sx={{ fontSize: 16, color: getContrastText(color) }} />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <AlertTitle>Tema bicolore</AlertTitle>
                        Il colore primario viene utilizzato per elementi principali come pulsanti e appbar.
                        Il colore secondario viene utilizzato per evidenziare elementi importanti.
                    </Alert>
                    
                    {/* Aggiungi il componente di anteprima */}
                    <ThemeColorPreview />
                </Box>
            )}
            
            {/* Aggiungi il componente di test del tema */}
            {currentTheme === 'custom' && <ThemeTester />}
            </CardContent>
        </Card>
    );
};

export default ThemeSelectorIndex;