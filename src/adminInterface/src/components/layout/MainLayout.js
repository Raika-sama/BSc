import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const MainLayout = ({ children }) => {
    const [open, setOpen] = useState(true);

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ 
            display: 'flex',
            minHeight: '100vh',
            overflow: 'hidden' // Previene scrollbar orizzontale
        }}>
            <CssBaseline />
            
            <Header 
                open={open} 
                drawerWidth={drawerWidth} 
                onDrawerToggle={handleDrawerToggle} 
            />
            
            <Sidebar 
                open={open} 
                drawerWidth={drawerWidth} 
                onDrawerToggle={handleDrawerToggle} 
            />
            
            <Box
                component={motion.main}
                layout
                sx={{
                    position: 'fixed',
                    left: open ? drawerWidth : 0,
                    right: 0,
                    top: '64px', // Header height
                    bottom: 0,
                    overflow: 'auto',
                    bgcolor: 'background.default',
                    transition: theme => theme.transitions.create('left', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    padding: '16px', // Sostituisce il border con padding per mantenere lo spazio bianco
                    '& > *': { // Applica uno sfondo al contenuto effettivo
                        bgcolor: 'white',
                        minHeight: '100%',
                        padding: '24px' // Aggiunto padding interno al contenuto
                    }
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout;