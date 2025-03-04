// src/components/common/Loading.js
import React from 'react';
import { Box, CircularProgress, Typography, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const Loading = ({ 
    message = 'Caricamento in corso...', 
    fullscreen = false, 
    transparent = false,
    size = 'medium' // 'small', 'medium', 'large'
}) => {
    // Determina la dimensione del loader
    const getSize = () => {
        switch(size) {
            case 'small': return 30;
            case 'large': return 60;
            case 'medium':
            default: return 40;
        }
    };

    // Stili base
    const baseStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: 3,
        borderRadius: 2
    };

    // Stili aggiuntivi basati sui props
    const additionalStyles = fullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: theme => transparent 
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
        backdropFilter: 'blur(8px)'
    } : {};

    return (
        <Box
            sx={{
                ...baseStyles,
                ...additionalStyles
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <CircularProgress 
                    size={getSize()}
                    thickness={4}
                    sx={{
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round'
                        }
                    }}
                />
            </motion.div>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ 
                            fontWeight: 'medium',
                            textAlign: 'center'
                        }}
                    >
                        {message}
                    </Typography>
                </motion.div>
            )}
        </Box>
    );
};

export default Loading;