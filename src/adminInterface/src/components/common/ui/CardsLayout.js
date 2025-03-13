import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, IconButton, Tooltip, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpOutline as HelpIcon, Star as StarIcon } from '@mui/icons-material';
import { useTheme as useAppTheme } from '../../../context/ThemeContext/ThemeContextIndex';

// Define motion components correctly
const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);
const MotionGrid = motion.create(Grid);

const CardsLayout = ({ 
    cards, 
    gap = 2, 
    minWidth = 200, 
    maxWidth,
    loading = false 
}) => {
    const theme = useTheme();
    const { isBicolorTheme, currentTheme } = useAppTheme();
    
    // Verifica se il tema corrente è bicolore
    const isCurrentThemeBicolor = isBicolorTheme(currentTheme);
    
    // Determina il colore secondario da usare
    const secondaryColor = isCurrentThemeBicolor && theme.palette.secondary 
        ? theme.palette.secondary.main 
        : theme.palette.primary.light;

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

    const generateGlowAnimation = (color1, color2) => ({
        '@keyframes glow': {
            '0%': {
                boxShadow: `0 0 2px ${alpha(color1, 0.2)}, 0 0 4px ${alpha(color1, 0.2)}`
            },
            '50%': {
                boxShadow: `0 0 8px ${alpha(color2, 0.3)}, 0 0 16px ${alpha(color2, 0.3)}`
            },
            '100%': {
                boxShadow: `0 0 2px ${alpha(color1, 0.2)}, 0 0 4px ${alpha(color1, 0.2)}`
            }
        }
    });

    // Genera un effetto di sfumatura di colore per i bordi
    const generateColorShiftAnimation = (color1, color2) => ({
        '@keyframes colorShift': {
            '0%': { borderColor: color1 },
            '50%': { borderColor: color2 },
            '100%': { borderColor: color1 }
        }
    });

    return (
        <MotionGrid
            variants={container}
            initial="hidden"
            animate="show"
            container 
            spacing={gap}
        >
            <Grid container spacing={3}>
                <AnimatePresence mode="sync">
                    {cards.map((card, index) => (
                        <Grid 
                            item 
                            xs={12} 
                            sm={6} 
                            md={2.4}
                            lg={2.4}
                            key={index}
                            sx={{
                                minWidth: minWidth,
                                maxWidth: 125,
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
                                    ...generateGlowAnimation(
                                        theme.palette.primary.main, 
                                        secondaryColor
                                    ),
                                    ...generateColorShiftAnimation(
                                        theme.palette.primary.main,
                                        secondaryColor
                                    ),
                                    ...(card.highlighted && {
                                        animation: isCurrentThemeBicolor 
                                            ? 'glow 2s infinite, colorShift 4s infinite' 
                                            : 'glow 2s infinite',
                                        borderColor: isCurrentThemeBicolor 
                                            ? secondaryColor 
                                            : theme.palette.primary.main,
                                    }),
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: isCurrentThemeBicolor
                                            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${secondaryColor})`
                                            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
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
                                <MotionBox
                                    className="card-background"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        opacity: 0.03,
                                        backgroundImage: isCurrentThemeBicolor
                                            ? `radial-gradient(circle at 20px 20px, 
                                                ${theme.palette.primary.main} 2px, transparent 0),
                                            radial-gradient(circle at 40px 40px, 
                                                ${secondaryColor} 2px, transparent 0)`
                                            : `radial-gradient(circle at 20px 20px, 
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
                                            <MotionBox
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
                                                    background: isCurrentThemeBicolor
                                                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(secondaryColor, 0.15)})`
                                                        : alpha(theme.palette.primary.main, 0.1),
                                                    color: isCurrentThemeBicolor ? secondaryColor : 'primary.main',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        background: isCurrentThemeBicolor
                                                            ? `linear-gradient(135deg, ${alpha(secondaryColor, 0.15)}, ${alpha(theme.palette.primary.main, 0.15)})`
                                                            : alpha(theme.palette.primary.main, 0.15),
                                                    }
                                                }}
                                            >
                                                {card.icon}
                                            </MotionBox>
                                        )}
                                        {card.helpText && !card.centerContent && (
                                            <Tooltip title={card.helpText} arrow>
                                                <IconButton size="small">
                                                    <HelpIcon sx={{ 
                                                        fontSize: 20,
                                                        color: isCurrentThemeBicolor ? secondaryColor : 'primary.main' 
                                                    }} />
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
                                                    backgroundImage: isCurrentThemeBicolor
                                                        ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${secondaryColor})`
                                                        : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    color: 'transparent',
                                                    textAlign: card.centerContent ? 'center' : 'left',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        backgroundImage: isCurrentThemeBicolor
                                                            ? `linear-gradient(45deg, ${secondaryColor}, ${theme.palette.primary.main})`
                                                            : `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                                                    }
                                                }}
                                            >
                                                {card.title}
                                            </Typography>
                                            {card.highlighted && (
                                                <StarIcon sx={{ 
                                                    color: isCurrentThemeBicolor ? secondaryColor : 'primary.main',
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
                                            {card.chips.map((chip, idx) => {
                                                // Alternare colore primario e secondario per i chip
                                                const useSecondaryColor = isCurrentThemeBicolor && idx % 2 === 1;
                                                return (
                                                    <Chip
                                                        key={idx}
                                                        {...chip}
                                                        size="small"
                                                        color={useSecondaryColor ? "secondary" : "primary"}
                                                        sx={{
                                                            borderRadius: '8px',
                                                            '&:hover': {
                                                                transform: 'translateY(-2px)',
                                                            },
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                    />
                                                );
                                            })}
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
                                        {/* Se il contenuto contiene button, aggiungiamo gli stili secondari */}
                                        {React.Children.map(card.content, child => {
                                            // Modifica i pulsanti per usare il colore secondario nei temi bicolore
                                            if (isCurrentThemeBicolor && React.isValidElement(child) && 
                                                (child.type === 'button' || 
                                                child.type?.displayName === 'Button' || 
                                                (typeof child.type === 'string' && child.type.toLowerCase() === 'button'))) {
                                                
                                                return React.cloneElement(child, {
                                                    ...child.props,
                                                    color: 'secondary',
                                                    sx: {
                                                        ...(child.props.sx || {}),
                                                        '&:hover': {
                                                            background: `linear-gradient(135deg, ${secondaryColor}, ${alpha(secondaryColor, 0.8)})`,
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }
                                                });
                                            }
                                            return child;
                                        }) || card.content}
                                    </Box>
                                </CardContent>
                            </MotionCard>
                        </Grid>
                    ))}
                </AnimatePresence>
            </Grid>
        </MotionGrid>
    );
};

export default CardsLayout;