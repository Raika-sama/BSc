import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const CardsLayout = ({ cards }) => {
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

    return (
        <Grid 
            component={motion.div}
            variants={container}
            initial="hidden"
            animate="show"
            container 
            spacing={3}
        >
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
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
                            bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'background.paper',
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
                            }
                        }}
                    >
                        <CardContent>
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
                                        justifyContent: 'center',
                                        mb: 2,
                                        color: theme.palette.primary.main
                                    }}
                                >
                                    {card.icon}
                                </Box>
                            )}
                            <Typography 
                                variant="h6" 
                                component="div"
                                sx={{ 
                                    textAlign: 'center',
                                    mb: 1,
                                    fontWeight: 600,
                                    backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent',
                                }}
                            >
                                {card.title}
                            </Typography>
                            <Typography 
                                color="text.secondary"
                                sx={{ 
                                    textAlign: 'center',
                                    mb: 2,
                                    opacity: 0.8
                                }}
                            >
                                {card.description}
                            </Typography>
                            <Box 
                                sx={{ 
                                    mt: 'auto',
                                    pt: 2 
                                }}
                            >
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