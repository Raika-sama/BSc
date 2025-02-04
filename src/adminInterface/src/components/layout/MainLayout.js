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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    sx={{
                        position: 'fixed',
                        left: open ? drawerWidth : 0,
                        right: 0,
                        top: '64px',
                        bottom: 0,
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        transition: theme => theme.transitions.create(
                            ['left', 'width', 'background-color'],
                            {
                                easing: theme.transitions.easing.easeInOut,
                                duration: theme.transitions.duration.standard,
                            }
                        ),
                        padding: '20px',
                        '& > *': {
                            bgcolor: 'background.paper',
                            minHeight: '100%',
                            padding: '24px',
                            borderRadius: '12px',
                            boxShadow: theme => theme.palette.mode === 'dark'
                                ? '0 4px 20px 0 rgba(0,0,0,0.3)'
                                : '0 4px 20px 0 rgba(100, 181, 246, 0.12)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: theme => theme.palette.mode === 'dark'
                                    ? '0 6px 25px 0 rgba(0,0,0,0.4)'
                                    : '0 6px 25px 0 rgba(100, 181, 246, 0.18)',
                            }
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