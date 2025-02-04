import React from 'react';
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
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

const EnginesManagement = () => {
    const { checkPermission } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    
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
        <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            sx={{
                mt: 2,
                borderRadius: 2,
                textTransform: 'none',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                }
            }}
        >
            {children}
        </Button>
    );

    const cards = [
        {
            title: 'CSI - Cognitive Style Index',
            description: 'Test per la valutazione dello stile cognitivo',
            icon: <Psychology sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            title: 'Test Memoria',
            description: 'Test per la valutazione delle capacità mnemoniche',
            icon: <Memory sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <Favorite sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <Extension sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <LightbulbOutlined sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <MenuBook sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <Mood sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <Person sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
            icon: <School sx={{ fontSize: 50 }} />,
            centerContent: true, // Aggiungi questa prop
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
                    <Button
                        component={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: 2,
                            '&:hover': {
                                bgcolor: theme.palette.primary.dark,
                                boxShadow: 4,
                            }
                        }}
                    >
                        Nuovo Test
                    </Button>
                )
            }
        >
            <Box 
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                sx={{ mt: 3 }}
            >
                <CardsLayout cards={cards} />
            </Box>
        </ContentLayout>
    );
};

export default EnginesManagement;