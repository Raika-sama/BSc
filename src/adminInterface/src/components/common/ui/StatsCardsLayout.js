// src/components/common/ui/StatsCardsLayout.js
import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Card, CardContent, Typography, Box, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const StatsCardsLayout = ({ cards, loading, spacing = 3, maxColumns = 5 }) => {
    const theme = useTheme();
    const columnWidth = 12 / Math.min(cards.length, maxColumns);
    
    // Dark mode detection
    const isDarkMode = theme.palette.mode === 'dark';

    return (
        <Grid container spacing={spacing}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} lg={columnWidth} key={index}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                        <Card 
                            elevation={0}
                            sx={{ 
                                height: '100%',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: theme.shadows[4]
                                }
                            }}
                        >
                            {/* Background decoration */}
                            <Box 
                                sx={{
                                    position: 'absolute',
                                    top: -5,
                                    right: -5,
                                    width: 50,
                                    height: 50,
                                    borderRadius: '50%',
                                    backgroundColor: alpha(theme.palette[card.color]?.main || card.color, 0.1),
                                    zIndex: 0
                                }}
                            />
                            
                            <CardContent sx={{ position: 'relative', zIndex: 1, p: 1, '&:last-child': { pb: 1 } }}>
                                <Box 
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 0.5
                                    }}
                                >
                                    <Typography 
                                        variant="subtitle2" 
                                        color="textSecondary"
                                        sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                                    >
                                        {card.title}
                                    </Typography>
                                    <Box 
                                        sx={{ 
                                            backgroundColor: alpha(theme.palette[card.color]?.main || card.color, 0.1),
                                            borderRadius: '50%',
                                            p: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 20,
                                            height: 20,
                                            color: theme.palette[card.color]?.main || card.color
                                        }}
                                    >
                                        {React.createElement(card.icon, { 
                                            sx: { fontSize: '0.9rem' } 
                                        })}
                                    </Box>
                                </Box>

                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 600, 
                                        mb: 0.25,
                                        color: isDarkMode ? 'text.primary' : 'text.primary',
                                        fontSize: '1.1rem',
                                        lineHeight: 1.2
                                    }}
                                >
                                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                </Typography>

                                {card.subtitle && (
                                    <Typography 
                                        variant="caption" 
                                        color="textSecondary"
                                        sx={{ 
                                            fontSize: '0.65rem',
                                            opacity: 0.8,
                                            display: 'block',
                                            lineHeight: 1.1
                                        }}
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