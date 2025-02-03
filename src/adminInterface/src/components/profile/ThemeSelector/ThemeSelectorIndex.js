// src/components/profile/ThemeSelector/ThemeSelectorIndex.js
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

const ThemeSelectorIndex = () => {
    const { currentTheme, changeTheme, customColor, setCustomThemeColor } = useTheme();

    // Definiamo i temi direttamente qui per essere sicuri della struttura
    const themeOptions = {
        light: {
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
                text: {
                    primary: '#37474F'
                }
            },
            name: 'Chiaro'
        },
        dark: {
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
                    primary: '#E0E0E0'
                }
            },
            name: 'Scuro'
        },
        custom: {
            palette: {
                mode: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
                primary: {
                    main: customColor,
                    light: lightenColor(customColor, 0.2),
                    dark: darkenColor(customColor, 0.2),
                    contrastText: getContrastText(customColor)
                },
                background: {
                    default: localStorage.getItem('theme') === 'dark' ? '#121212' : '#F5F7FA',
                    paper: localStorage.getItem('theme') === 'dark' ? '#1E1E1E' : '#FFFFFF'
                },
                text: {
                    primary: localStorage.getItem('theme') === 'dark' ? '#E0E0E0' : '#37474F'
                }
            },
            name: 'Personalizzato'
        }
    };

    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Personalizzazione Tema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Scegli il tema che preferisci per personalizzare l'interfaccia
                    </Typography>
                </Box>

                {/* Light/Dark Mode Switch */}
                <Box sx={{ mb: 4 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localStorage.getItem('theme') === 'dark'}
                                onChange={(e) => {
                                    const newMode = e.target.checked ? 'dark' : 'light';
                                    localStorage.setItem('theme', newMode);
                                    // Se siamo in tema personalizzato, forza un re-render
                                    if (currentTheme === 'custom') {
                                        // Forza l'aggiornamento del tema
                                        const currentColor = localStorage.getItem('customThemeColor') || '#64B5F6';
                                        setCustomThemeColor(currentColor);
                                    } else {
                                        changeTheme(newMode);
                                    }
                                }}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {currentTheme === 'dark' ? <DarkMode /> : <LightMode />}
                                <Typography>
                                    {currentTheme === 'dark' ? 'Modalità Scura' : 'Modalità Chiara'}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Theme Previews */}
                <Grid container spacing={2}>
                    {Object.entries(themeOptions).map(([key, theme]) => (
                        <Grid item xs={12} sm={4} key={key}>
                            <ThemePreview
                                themeData={theme}
                                themeName={theme.name}
                                selected={currentTheme === key}
                                onClick={() => changeTheme(key)}
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