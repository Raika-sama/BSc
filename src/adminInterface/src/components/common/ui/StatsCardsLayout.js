// src/components/common/ui/StatsCardsLayout.js
import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Card, CardContent, Typography, Box, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const StatsCardsLayout = ({ cards, loading, spacing = 3, maxColumns = 5 }) => {
    const theme = useTheme();
    const columnWidth = 12 / Math.min(cards.length, maxColumns);
    
    // Determiniamo se il tema è bicolore
    const isThemeBicolor = theme.palette.secondary && theme.palette.secondary.main;
    const isDarkMode = theme.palette.mode === 'dark';

    // Funzione per schiarire/scurire colori basati sul tema
    const adaptColorToTheme = (color, index) => {
        // Se il tema è bicolore, alterna tra colori primari e secondari
        if (isThemeBicolor) {
            return index % 2 === 0 
                ? theme.palette.primary.main 
                : theme.palette.secondary.main;
        }
        
        // Se il colore è fornito, usalo (ma adattato al tema)
        if (color) {
            // Se siamo in modalità scura, schiarisci leggermente il colore
            if (isDarkMode) {
                // Possiamo usare la funzione alpha per rendere il colore più chiaro
                return alpha(color, 0.9);
            }
            return color;
        }
        
        // Fallback al colore primario del tema
        return theme.palette.primary.main;
    };

    return (
        <Grid container spacing={spacing}>
            {cards.map((card, index) => {
                // Calcola i colori adattati al tema
                const cardColor = adaptColorToTheme(card.color, index);
                const textColor = isDarkMode ? theme.palette.common.white : theme.palette.text.primary;
                const subtitleColor = isDarkMode ? alpha(theme.palette.common.white, 0.7) : theme.palette.text.secondary;
                
                return (
                    <Grid item xs={12} sm={6} md={4} lg={columnWidth} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <Card 
                                elevation={0}
                                sx={{ 
                                    height: '100%',
                                    borderRadius: theme.shape.borderRadius || 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    background: () => {
                                        // Crea un gradiente basato sul tema e sul colore della card
                                        const baseColor = theme.palette.background.paper;
                                        let gradientColor;
                                        
                                        if (isThemeBicolor) {
                                            // Per temi bicolore, usa colori del tema alternati
                                            gradientColor = index % 2 === 0 
                                                ? alpha(theme.palette.primary.main, 0.07)
                                                : alpha(theme.palette.secondary.main, 0.07);
                                        } else {
                                            // Per temi monocolore, usa il colore della card
                                            gradientColor = alpha(cardColor, 0.07);
                                        }
                                        
                                        return `linear-gradient(135deg, 
                                            ${baseColor} 0%, 
                                            ${gradientColor} 100%)`;
                                    },
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: isDarkMode 
                                            ? `0 4px 12px ${alpha(theme.palette.common.black, 0.3)}`
                                            : `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                                    },
                                    // Riduzione delle dimensioni complessive
                                    py: 1
                                }}
                            >
                                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Box
                                            sx={{
                                                // Colore di sfondo dell'icona più integrato col tema
                                                bgcolor: alpha(cardColor, isDarkMode ? 0.2 : 0.1),
                                                borderRadius: theme.shape.borderRadius || 2,
                                                p: 0.75,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {React.createElement(card.icon, { 
                                                sx: { 
                                                    color: cardColor,
                                                    fontSize: '1rem'
                                                } 
                                            })}
                                        </Box>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                ml: 1,
                                                fontWeight: 500,
                                                fontSize: '0.75rem',
                                                color: subtitleColor
                                            }}
                                        >
                                            {card.title}
                                        </Typography>
                                    </Box>
                                    <Typography 
                                        variant="h6" 
                                        component="div"
                                        sx={{ 
                                            mb: 0.25,
                                            fontWeight: 600,
                                            color: cardColor,
                                            fontSize: '1.25rem'
                                        }}
                                    >
                                        {card.value}
                                    </Typography>
                                    {card.subtitle && (
                                        <Typography 
                                            variant="caption"
                                            sx={{ 
                                                display: 'block',
                                                opacity: 0.8,
                                                fontSize: '0.7rem',
                                                color: subtitleColor
                                            }}
                                        >
                                            {card.subtitle}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                );
            })}
        </Grid>
    );
};

StatsCardsLayout.propTypes = {
    cards: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            icon: PropTypes.elementType.isRequired,
            color: PropTypes.string.isRequired,
            subtitle: PropTypes.string
        })
    ).isRequired,
    loading: PropTypes.bool,
    spacing: PropTypes.number,
    maxColumns: PropTypes.number
};

export default StatsCardsLayout;