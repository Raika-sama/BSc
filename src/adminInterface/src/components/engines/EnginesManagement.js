// src/components/engines/EnginesManagement.js
import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon, Psychology, Memory } from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
import CardsLayout from '../common/ui/CardsLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

const EnginesManagement = () => {
    const { checkPermission } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const handleNavigate = (path) => {
        navigate(`/admin/engines/${path}`);
    };

    const cards = [
        {
            title: 'CSI - Cognitive Style Index',
            description: 'Test per la valutazione dello stile cognitivo',
            icon: <Psychology sx={{ fontSize: 50 }} />,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => handleNavigate('csi')}
                        sx={{
                            mt: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                        }}
                    >
                        Gestisci CSI
                    </Button>
                </Box>
            )
        },
        {
            title: 'Test Memoria',
            description: 'Coming Soon',
            icon: <Memory sx={{ fontSize: 50 }} />,
            content: (
                <Box sx={{ textAlign: 'center' }}>
                    <Button
                        variant="outlined"
                        disabled
                        sx={{
                            mt: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                        }}
                    >
                        Coming Soon
                    </Button>
                </Box>
            )
        }
    ];

    return (
        <ContentLayout
            title="Gestione Test"
            subtitle="Gestisci e configura i test disponibili nella piattaforma"
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