import React from 'react';
import { Box, Paper, Typography, useTheme, Tooltip } from '@mui/material';
import { Check, Brightness3, BrightnessHigh, ColorLens } from '@mui/icons-material';

const ThemePreview = ({ themeData, themeName, selected, onClick, disabled = false, isBicolor = false }) => {
    const currentTheme = useTheme();

    // Verifica che themeData abbia le proprietà necessarie
    if (!themeData?.palette?.primary?.main) {
        console.warn('Theme data is missing required properties:', themeName);
        return null;
    }

    // Controlla se questo tema è effettivamente bicolore
    // Modificato per essere più robusto e considerare sia l'intento (isBicolor) che i dati effettivi
    const hasSecondaryColor = themeData.palette.secondary && themeData.palette.secondary.main;
    const isActuallyBicolor = isBicolor && hasSecondaryColor;

    // Log per debug
    console.log(`Rendering theme preview for ${themeName}:`, {
        isBicolorProp: isBicolor,
        hasSecondary: !!themeData.palette.secondary,
        hasSecondaryMain: themeData.palette?.secondary?.main,
        isActuallyBicolor,
        hasSecondaryColorProp: themeData.hasSecondaryColor
    });

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
            {/* Badge per temi bicolore - mostra il badge solo se il tema è effettivamente bicolore o è marcato come tale */}
            {(isActuallyBicolor || themeData.hasSecondaryColor) && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 10,
                        px: 1,
                        py: 0.2
                    }}
                >
                    <ColorLens sx={{ fontSize: 14, color: themeData.palette.text?.secondary || 'gray' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: themeData.palette.text?.secondary || 'gray' }}>
                        Bicolore
                    </Typography>
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
            
            {/* Colori del tema - modifica per gestire in modo uniforme temi bicolore e monocolore */}
            {(isActuallyBicolor || themeData.hasSecondaryColor) ? (
                // Visualizzazione dei colori per temi bicolore
                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        gap: 1,
                        width: '100%'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: themeData.palette.primary.main,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: themeData.palette.text?.secondary || 'gray' }}>
                            Primario
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: themeData.palette.secondary.main,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: themeData.palette.text?.secondary || 'gray' }}>
                            Secondario
                        </Typography>
                    </Box>
                </Box>
            ) : (
                // Visualizzazione per temi monocolore
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
                    
                    {/* Colore variante per i temi monocolore (light o dark in base al tema) */}
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
            )}

            <Typography 
                variant="caption"
                sx={{
                    fontWeight: selected ? 'bold' : 'normal',
                    color: themeData.palette.text?.primary || 'inherit',
                    textAlign: 'center',
                    width: '100%'
                }}
            >
                {themeName}
            </Typography>
            
            {/* Indicatore se il tema ha variante scura */}
            {themeData.hasDarkVariant && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        mt: -1
                    }}
                >
                    <BrightnessHigh sx={{ fontSize: 12, color: themeData.palette.text?.secondary || 'gray' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: themeData.palette.text?.secondary || 'gray' }}>
                        /
                    </Typography>
                    <Brightness3 sx={{ fontSize: 12, color: themeData.palette.text?.secondary || 'gray' }} />
                </Box>
            )}
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