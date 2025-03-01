import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { 
    Add as AddIcon, 
    Psychology, 
    Memory,
    Favorite,
    Extension,
    LightbulbOutlined,
    MenuBook,
    Mood,
    Person,
    School,
    ArrowForward as ArrowForwardIcon 
} from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
import CardsLayout from '../common/ui/CardsLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext/ThemeContextIndex';
import { motion, AnimatePresence } from 'framer-motion';

// Creiamo i componenti motion all'inizio
const MotionButton = motion.create(Button);
const MotionBox = motion.create(Box);

const EnginesManagement = () => {
    const { checkPermission } = useAuth();
    const muiTheme = useMuiTheme();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determina il colore in base alla modalità del tema
    const isDarkMode = muiTheme.palette.mode === 'dark';
    const themeColor = isDarkMode ? "secondary" : "primary";
    
    const handleCSINavigation = () => {
        console.log('Current location:', location);
        console.log('Attempting navigation to CSI test view');
        try {
            navigate('../engines/csi');
            console.log('Navigation command executed');
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    const ActionButton = ({ children, onClick }) => (
        <MotionButton
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            color={themeColor}
            sx={{
                mt: 2,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                    backgroundColor: isDarkMode 
                        ? 'rgba(156, 39, 176, 0.08)' // Viola più chiaro per tema scuro
                        : 'rgba(33, 150, 243, 0.08)', // Blu per tema chiaro
                }
            }}
        >
            {children}
        </MotionButton>
    );

    // Componente per renderizzare l'icona con il colore appropriato
    const ThemedIcon = ({ icon, size = 50 }) => {
        const IconComponent = icon;
        return (
            <IconComponent 
                sx={{ 
                    fontSize: size, 
                    color: isDarkMode ? muiTheme.palette.secondary.main : muiTheme.palette.primary.main 
                }} 
            />
        );
    };

    const cards = [
        {
            title: 'CSI - Cognitive Style Index',
            description: 'Test per la valutazione dello stile cognitivo',
            icon: <ThemedIcon icon={Psychology} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Valutazione degli stili di apprendimento e processi cognitivi
                    </Typography>
                    <ActionButton onClick={() => navigate('./csi')}>Gestisci CSI</ActionButton>
                </Box>
            )
        },
        {
            title: 'Capacità di Memoria',
            description: 'Test per la valutazione delle capacità mnemoniche',
            icon: <ThemedIcon icon={Memory} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Valutazione delle capacità mnemoniche a breve e lungo termine
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'Intelligenza Emotiva (EQ)',
            description: 'Valutazione delle competenze emotive',
            icon: <ThemedIcon icon={Favorite} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Test per la valutazione della capacità di riconoscere e gestire le emozioni
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'Intelligenze Multiple',
            description: 'Test delle Intelligenze Multiple di Gardner',
            icon: <ThemedIcon icon={Extension} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Analisi delle diverse forme di intelligenza secondo la teoria di Gardner
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'Problem Solving',
            description: 'Valutazione capacità di risoluzione problemi',
            icon: <ThemedIcon icon={LightbulbOutlined} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Test per valutare le strategie di risoluzione dei problemi
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'Abitudini di Studio',
            description: 'Analisi delle metodologie di studio',
            icon: <ThemedIcon icon={MenuBook} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Valutazione delle strategie e metodologie di apprendimento
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'Big Five Personality',
            description: 'Test dei cinque grandi fattori della personalità',
            icon: <ThemedIcon icon={Mood} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Valutazione delle cinque dimensioni fondamentali della personalità
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'MBTI',
            description: 'Myers-Briggs Type Indicator',
            icon: <ThemedIcon icon={Person} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Test per l'identificazione dei 16 tipi di personalità
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        },
        {
            title: 'Test QI',
            description: 'Test del Quoziente Intellettivo',
            icon: <ThemedIcon icon={School} />,
            centerContent: true,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Valutazione standardizzata delle capacità cognitive generali
                    </Typography>
                    <ActionButton>Coming Soon</ActionButton>
                </Box>
            )
        }
    ];

    const canCreateEngine = checkPermission('engines:write');

    return (
        <ContentLayout
            title="Gestione Test"
            subtitle="Gestisci e configura i test disponibili nella piattaforma"
            actions={
                canCreateEngine && (
                    <MotionButton
                        whileHover={{ scale: 1.05, boxShadow: 6 }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        color={themeColor}
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 4,
                            }
                        }}
                    >
                        Nuovo Test
                    </MotionButton>
                )
            }
        >
            <AnimatePresence>
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    sx={{ mt: 3 }}
                >
                    <CardsLayout cards={cards} />
                </MotionBox>
            </AnimatePresence>
        </ContentLayout>
    );
};

export default EnginesManagement;