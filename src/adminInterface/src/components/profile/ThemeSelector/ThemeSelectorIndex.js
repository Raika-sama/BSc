import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { LightMode, DarkMode, Palette } from '@mui/icons-material';
import { 
    useTheme,
    lightenColor,
    darkenColor,
    getContrastText 
} from '../../../context/ThemeContext/ThemeContextIndex';
import ThemePreview from './ThemePreview';
import { motion } from 'framer-motion';
import { themes } from '../../../context/ThemeContext/themes';

const ThemeSelectorIndex = () => {
    const { currentTheme, changeTheme, customColor, setCustomThemeColor, toggleTheme, darkMode } = useTheme();

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
        custom: 'Personalizzato'
    };

    // Helper per ottenere il tema base senza "Dark"
    const getBaseThemeName = (themeName) => {
        return themeName.replace('Dark', '');
    };

    // Prepara i temi per la preview
    const baseThemes = Object.keys(themes)
        .filter(key => key !== 'getCustomTheme' && !key.includes('Dark'))
        .reduce((acc, key) => {
            // Verifica se esiste una variante scura
            const darkKey = `${key}Dark`;
            const hasDarkVariant = themes[darkKey] !== undefined;
            
            return {
                ...acc,
                [key]: {
                    palette: {
                        ...themes[key].palette,
                        mode: 'light'
                    },
                    name: themeNames[key] || key,
                    hasDarkVariant
                }
            };
        }, {});

    // Aggiungi il tema personalizzato
    baseThemes.custom = {
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: customColor,
                light: lightenColor(customColor, 0.2),
                dark: darkenColor(customColor, 0.2),
                contrastText: getContrastText(customColor)
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
        hasDarkVariant: true
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

                {/* Theme Previews */}
                <Grid container spacing={3}>
                    {Object.entries(baseThemes).map(([key, theme]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
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

                {/* Custom Theme Color Picker */}
                {currentTheme === 'custom' && (
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        sx={{ mt: 3 }}
                    >
                        <Typography variant="subtitle2" gutterBottom>
                            Colore Personalizzato
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Palette color="primary" />
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomThemeColor(e.target.value)}
                                style={{ width: '100px', height: '40px' }}
                            />
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default ThemeSelectorIndex;