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
    const { currentTheme, changeTheme, customColor, setCustomThemeColor } = useTheme();

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
        cyberpunk: 'cyberpunkTheme',
        candy: 'candyTheme',
        retrowave: 'retroWaveTheme',
        nature: 'natureTheme',
        galaxy: 'galaxyTheme',
        sunsetBeach: 'sunsetBeachTheme',
        custom: 'Personalizzatoo'
    };

    const isDarkMode = currentTheme.toLowerCase().includes('dark');

    // Prepara i temi per la preview
    const themeOptions = Object.keys(themes)
        .filter(key => key !== 'getCustomTheme')
        .reduce((acc, key) => ({
            ...acc,
            [key]: {
                palette: {
                    ...themes[key].palette,
                    mode: key.toLowerCase().includes('dark') ? 'dark' : 'light'
                },
                name: themeNames[key] || key
            }
        }), {});

    // Aggiungi il tema personalizzato
    themeOptions.custom = {
        palette: {
            mode: isDarkMode ? 'dark' : 'light',
            primary: {
                main: customColor,
                light: lightenColor(customColor, 0.2),
                dark: darkenColor(customColor, 0.2),
                contrastText: getContrastText(customColor)
            },
            background: {
                default: isDarkMode ? '#121212' : '#FFFFFF',
                paper: isDarkMode ? '#1E1E1E' : '#FFFFFF'
            },
            text: {
                primary: isDarkMode ? '#FFFFFF' : '#000000',
                secondary: isDarkMode ? '#B0BEC5' : '#546E7A'
            }
        },
        name: 'Personalizzato'
    };

    // Theme change handler
    const handleThemeChange = (newTheme) => {
        changeTheme(newTheme);
    };

    // Dark mode toggle handler
    const handleDarkModeToggle = (e) => {
        const isCurrentlyDark = e.target.checked;
        const baseTheme = currentTheme.replace(/Dark$/, '');
        const newTheme = isCurrentlyDark ? `${baseTheme}Dark` : baseTheme;
        changeTheme(newTheme);
    };

    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Box sx={{ mb: 1 }}>
                  
                </Box>

                {/* Light/Dark Mode Switch */}
                <Box sx={{ mb: 4 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isDarkMode}
                                onChange={handleDarkModeToggle}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isDarkMode ? <DarkMode /> : <LightMode />}
                                <Typography>
                                    {isDarkMode ? 'Modalità Scura' : 'Modalità Chiara'}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Theme Previews */}
                <Grid container spacing={3}>
                    {Object.entries(themeOptions)
                        .filter(([key]) => {
                            if (key === 'custom') return true;
                            const isDark = key.toLowerCase().includes('dark');
                            return isDarkMode ? isDark : !isDark;
                        })
                        .map(([key, theme]) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <ThemePreview
                                    themeData={theme}
                                    themeName={theme.name}
                                    selected={currentTheme === key}
                                    onClick={() => handleThemeChange(key)}
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