import React from 'react';
import { Box, Paper, Typography, useTheme, Tooltip } from '@mui/material';
import { Check, Brightness3, BrightnessHigh } from '@mui/icons-material';

const ThemePreview = ({ themeData, themeName, selected, onClick, disabled = false }) => {
    const currentTheme = useTheme();

    // Verifica che themeData abbia le proprietà necessarie
    if (!themeData?.palette?.primary?.main) {
        console.warn('Theme data is missing required properties:', themeName);
        return null;
    }

    // Contenuto della preview
    const previewContent = (
        <Paper
            onClick={disabled ? undefined : onClick}
            sx={{
                p: 2,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: selected ? `2px solid ${currentTheme.palette.primary.main}` : '2px solid transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: disabled ? 'none' : 'scale(1.02)',
                    boxShadow: disabled ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
                },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                minWidth: 120,
                backgroundColor: themeData.palette.background?.default || '#ffffff',
                opacity: disabled ? 0.5 : 1,
                position: 'relative'
            }}
        >
            {/* Indicatore se il tema ha variante scura */}
            {themeData.hasDarkVariant && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }}
                >
                    <BrightnessHigh sx={{ fontSize: 14, color: themeData.palette.text?.secondary }} />
                    <Brightness3 sx={{ fontSize: 14, color: themeData.palette.text?.secondary }} />
                </Box>
            )}
            
            {/* Indicatore se selezionato */}
            {selected && (
                <Box 
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: currentTheme.palette.primary.main,
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Check sx={{ color: 'white', fontSize: 18 }} />
                </Box>
            )}
            
            {/* Colori del tema */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Colore principale */}
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: themeData.palette.primary.main,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />
                {/* Colore secondario (light o dark in base al tema) */}
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: themeData.palette.mode === 'dark' 
                            ? themeData.palette.primary.light 
                            : themeData.palette.primary.dark,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />
            </Box>

            <Typography 
                variant="caption"
                sx={{
                    fontWeight: selected ? 'bold' : 'normal',
                    color: themeData.palette.text?.primary
                }}
            >
                {themeName}
            </Typography>
        </Paper>
    );

    // Se il tema è disabilitato, mostra un tooltip
    if (disabled) {
        return (
            <Tooltip title="Questo tema non ha una variante scura" arrow>
                <Box sx={{ width: '100%' }}>{previewContent}</Box>
            </Tooltip>
        );
    }

    return previewContent;
};

export default ThemePreview;