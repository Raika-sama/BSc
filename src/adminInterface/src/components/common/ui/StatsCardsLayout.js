// src/components/common/ui/StatsCardsLayout.js
import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Card, CardContent, Typography, Box, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const StatsCardsLayout = ({ cards, loading, spacing = 3, maxColumns = 5 }) => {
    const columnWidth = 12 / Math.min(cards.length, maxColumns);

    return (
        <Grid container spacing={spacing}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={columnWidth} key={index}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card 
                            elevation={0}
                            sx={{ 
                                height: '100%',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                background: theme => {
                                    // Verifica se esiste un colore secondario nel tema
                                    const hasSecondary = !!theme.palette.secondary?.main;
                                    
                                    if (hasSecondary) {
                                        // Se disponibile, usa un gradiente sottile dal colore secondario al background
                                        return `linear-gradient(135deg, 
                                            ${theme.palette.background.paper} 0%, 
                                            ${alpha(theme.palette.secondary.main, 0.05)} 100%)`;
                                    } else {
                                        // Altrimenti usa il gradiente originale
                                        return `linear-gradient(135deg, 
                                            ${theme.palette.background.paper} 0%, 
                                            ${theme.palette.background.default} 100%)`;
                                    }
                                },
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Box
                                        sx={{
                                            bgcolor: `${card.color}15`,
                                            borderRadius: 2,
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {React.createElement(card.icon, { 
                                            sx: { color: card.color } 
                                        })}
                                    </Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="textSecondary"
                                        sx={{ ml: 1.5 }}
                                    >
                                        {card.title}
                                    </Typography>
                                </Box>
                                <Typography 
                                    variant="h4" 
                                    component="div"
                                    sx={{ 
                                        mb: 0.5,
                                        fontWeight: 600,
                                        color: card.color
                                    }}
                                >
                                    {card.value}
                                </Typography>
                                {card.subtitle && (
                                    <Typography 
                                        variant="body2" 
                                        color="textSecondary"
                                        sx={{ opacity: 0.8 }}
                                    >
                                        {card.subtitle}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            ))}
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