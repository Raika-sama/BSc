// src/components/layout/MainLayout.js
import React, { useState} from 'react';
import { Box, CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
// Importiamo il nostro ThemeProvider personalizzato
import { ThemeProvider, useTheme } from '../../context/ThemeContext/ThemeContextIndex';

const MainLayoutContent = ({ children }) => {
    // Usiamo il nostro hook personalizzato per accedere al tema
    const { theme } = useTheme();
    const [open, setOpen] = useState(true);
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    return (
        <MuiThemeProvider theme={theme}>
            <Box sx={{ 
                display: 'flex',
                minHeight: '100vh',
                overflow: 'hidden',
                bgcolor: 'background.default',
                transition: theme => theme.transitions.create(['background-color'], {
                    duration: theme.transitions.duration.standard,
                    easing: theme.transitions.easing.easeInOut,
                })
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
        </MuiThemeProvider>
    );
};

// Wrapper component che fornisce il context
const MainLayout = ({ children }) => {
    return (
        <ThemeProvider>
            <MainLayoutContent>
                {children}
            </MainLayoutContent>
        </ThemeProvider>
    );
};

export default MainLayout;