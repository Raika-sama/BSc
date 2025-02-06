import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';

const ThemePreview = ({ themeData, themeName, selected, onClick }) => {
    const currentTheme = useTheme();

    // Verifica che themeData abbia le proprietà necessarie
    if (!themeData?.palette?.primary?.main) {
        console.warn('Theme data is missing required properties:', themeName);
        return null;
    }

    return (
        <Paper
            onClick={onClick}
            sx={{
                p: 2,
                cursor: 'pointer',
                border: selected ? `2px solid ${currentTheme.palette.primary.main}` : '2px solid transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                minWidth: 120,
                backgroundColor: themeData.palette.background?.default || '#ffffff'
            }}
        >
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
};

export default ThemePreview;