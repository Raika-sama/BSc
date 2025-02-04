// src/components/common/ui/CardsLayout.js
import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, IconButton, Tooltip, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { HelpOutline as HelpIcon, Star as StarIcon } from '@mui/icons-material';

const MotionCard = motion(Card);

const CardsLayout = ({ 
    cards, 
    gap = 3, 
    minWidth = 300, 
    maxWidth,
    loading = false 
}) => {
    const theme = useTheme();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const generateGlowAnimation = (color) => ({
        '@keyframes glow': {
            '0%': {
                boxShadow: `0 0 2px ${alpha(color, 0.2)}, 0 0 4px ${alpha(color, 0.2)}`
            },
            '50%': {
                boxShadow: `0 0 8px ${alpha(color, 0.3)}, 0 0 16px ${alpha(color, 0.3)}`
            },
            '100%': {
                boxShadow: `0 0 2px ${alpha(color, 0.2)}, 0 0 4px ${alpha(color, 0.2)}`
            }
        }
    });

    return (
        <Grid 
            component={motion.div}
            variants={container}
            initial="hidden"
            animate="show"
            container 
            spacing={gap}
        >
            {cards.map((card, index) => (
                <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    key={index}
                    sx={{
                        minWidth: minWidth,
                        maxWidth: maxWidth,
                    }}
                >
                    <MotionCard
                        variants={item}
                        whileHover={{ 
                            scale: 1.03,
                            boxShadow: theme.shadows[8],
                        }}
                        whileTap={{ scale: 0.98 }}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.primary.main, 0.05)
                                : alpha(theme.palette.primary.main, 0.02),
                            ...generateGlowAnimation(theme.palette.primary.main),
                            ...(card.highlighted && {
                                animation: 'glow 2s infinite',
                                borderColor: 'primary.main',
                            }),
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                opacity: 0,
                                transition: 'opacity 0.3s ease'
                            },
                            '&:hover::before': {
                                opacity: 1
                            },
                            ...(loading && {
                                opacity: 0.7,
                                pointerEvents: 'none'
                            })
                        }}
                        onClick={card.onClick}
                    >
                        <Box
                            className="card-background"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                opacity: 0.03,
                                backgroundImage: `radial-gradient(circle at 20px 20px, 
                                    ${theme.palette.primary.main} 2px, transparent 0)`,
                                backgroundSize: '40px 40px',
                                transition: 'transform 0.5s ease',
                                zIndex: 0
                            }}
                        />

                        <CardContent sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            ...(card.centerContent && {
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            })
                        }}>
                            {/* Header con icona e help */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: card.centerContent ? 'center' : 'space-between',
                                width: '100%',
                                mb: 2 
                            }}>
                                {card.icon && (
                                    <Box 
                                        component={motion.div}
                                        whileHover={{ 
                                            scale: 1.1,
                                            rotate: [0, -10, 10, -10, 0],
                                            transition: { duration: 0.5 }
                                        }}
                                        sx={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 40,
                                            height: 40,
                                            borderRadius: '12px',
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main'
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                )}
                                {card.helpText && !card.centerContent && (
                                    <Tooltip title={card.helpText} arrow>
                                        <IconButton size="small">
                                            <HelpIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>

                            {/* Titolo e descrizione */}
                            <Box sx={{ 
                                mb: 2,
                                ...(card.centerContent && {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                })
                            }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1, 
                                    mb: 1,
                                    justifyContent: card.centerContent ? 'center' : 'flex-start'
                                }}>
                                    <Typography 
                                        variant="h6" 
                                        component="div"
                                        sx={{ 
                                            fontWeight: 600,
                                            backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent',
                                            textAlign: card.centerContent ? 'center' : 'left'
                                        }}
                                    >
                                        {card.title}
                                    </Typography>
                                    {card.highlighted && (
                                        <StarIcon sx={{ 
                                            color: 'primary.main',
                                            fontSize: 20,
                                            animation: 'pulse 1.5s infinite',
                                            '@keyframes pulse': {
                                                '0%': { transform: 'scale(1)' },
                                                '50%': { transform: 'scale(1.2)' },
                                                '100%': { transform: 'scale(1)' }
                                            }
                                        }} />
                                    )}
                                </Box>
                                <Typography 
                                    color="text.secondary"
                                    sx={{ 
                                        opacity: 0.8,
                                        textAlign: card.centerContent ? 'center' : 'left',
                                        ...(card.centerContent && {
                                            maxWidth: '80%',
                                            mx: 'auto'
                                        })
                                    }}
                                >
                                    {card.description}
                                </Typography>
                            </Box>

                            {/* Chips */}
                            {card.chips && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 1, 
                                    mb: 2, 
                                    flexWrap: 'wrap',
                                    justifyContent: card.centerContent ? 'center' : 'flex-start'
                                }}>
                                    {card.chips.map((chip, idx) => (
                                        <Chip
                                            key={idx}
                                            {...chip}
                                            size="small"
                                            sx={{
                                                borderRadius: '8px',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                },
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Contenuto */}
                            <Box sx={{ 
                                mt: 'auto',
                                width: '100%',
                                ...(card.centerContent && {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                })
                            }}>
                                {card.content}
                            </Box>
                        </CardContent>
                    </MotionCard>
                </Grid>
            ))}
        </Grid>
    );
};

export default CardsLayout;