// src/components/profile/ThemeSelector/ThemePreview.js
import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';

const ThemePreview = ({ themeData, themeName, selected, onClick }) => {
    const currentTheme = useTheme();

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
                backgroundColor: themeData.palette.background.default,
                position: 'relative',
            }}
        >
            {/* Header Preview */}
            <Box 
                sx={{ 
                    height: '20px', 
                    backgroundColor: themeData.palette.primary.main,
                    borderRadius: '4px',
                    mb: 1 
                }} 
            />
            
            {/* Content Preview */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Sidebar Preview */}
                <Box 
                    sx={{ 
                        width: '30px',
                        height: '50px',
                        backgroundColor: themeData.palette.background.paper,
                        borderRadius: '4px'
                    }} 
                />
                
                {/* Main Content Preview */}
                <Box 
                    sx={{ 
                        flex: 1,
                        height: '50px',
                        backgroundColor: themeData.palette.background.paper,
                        borderRadius: '4px',
                        p: 1
                    }}
                >
                    <Box 
                        sx={{ 
                            width: '70%', 
                            height: '8px',
                            backgroundColor: themeData.palette.text.primary,
                            opacity: 0.2,
                            borderRadius: '2px'
                        }} 
                    />
                </Box>
            </Box>

            <Typography 
                variant="caption" 
                sx={{ 
                    mt: 1, 
                    display: 'block',
                    color: themeData.palette.text.primary,
                    textAlign: 'center'
                }}
            >
                {themeName}
            </Typography>
        </Paper>
    );
};

export default ThemePreview;