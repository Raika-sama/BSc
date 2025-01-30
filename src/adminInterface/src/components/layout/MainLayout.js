import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

// Definizione del tema personalizzato
const theme = createTheme({
    palette: {
        primary: {
            main: '#64B5F6',
            light: '#90CAF9',
            dark: '#42A5F5',
            contrastText: '#fff'
        },
        background: {
            default: '#F5F7FA',
            paper: '#FFFFFF'
        },
        sidebar: {
            background: '#FFFFFF',
            hover: '#E3F2FD',
            selected: '#BBDEFB',
            text: '#37474F'
        }
    },
    transitions: {
        duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
        },
        easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        },
    },
});

const drawerWidth = 240;

const MainLayout = ({ children }) => {
    const [open, setOpen] = useState(true);

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                display: 'flex',
                minHeight: '100vh',
                overflow: 'hidden',
                bgcolor: 'background.default'
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
                        top: '64px',
                        bottom: 0,
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        transition: theme => theme.transitions.create(['left', 'width'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                        padding: '16px',
                        '& > *': {
                            bgcolor: 'background.paper',
                            minHeight: '100%',
                            padding: '24px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(100, 181, 246, 0.1)',
                        }
                    }}
                >
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default MainLayout;