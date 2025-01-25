// MainLayout.js
import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: 10, // Rimosso il padding
        paddingTop: theme.spacing(8), // Solo padding top per l'header
        backgroundColor: '#fafafa',
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeInOut,
            duration: 300,
        }),
        marginLeft: 0,
        width: '100%',
        ...(open && {
            width: `calc(100% - ${drawerWidth}px)`,
        }),
    }),
);

const MainLayout = ({ children }) => {
    const [open, setOpen] = useState(true);

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ 
            display: 'flex',
            bgcolor: '#fafafa',
            minHeight: '100vh',
            color: '#37474f'
        }}>
            <CssBaseline />
            <Header open={open} drawerWidth={drawerWidth} onDrawerToggle={handleDrawerToggle} />
            <Sidebar open={open} drawerWidth={drawerWidth} onDrawerToggle={handleDrawerToggle} />
            <Main open={open}>
                <Box 
                    component="div" 
                    sx={{ 
                        height: '100%',
                        p: 2, // Ridotto il padding
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    {children}
                </Box>
            </Main>
        </Box>
    );
};

export default MainLayout;