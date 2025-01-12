// Header.js
import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';

const Header = ({ open, drawerWidth, onDrawerToggle }) => {
    const { user, logout } = useAuth();

    return (
        <AppBar
            position="fixed"
            sx={{
                width: '100%',
                backgroundColor: '#2e7d32',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                transition: 'all 300ms ease-in-out',
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={{ 
                        mr: 2,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography 
                    variant="h6" 
                    noWrap 
                    component="div" 
                    sx={{ 
                        flexGrow: 1,
                        fontWeight: 500
                    }}
                >
                    Admin Dashboard
                </Typography>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2 
                }}>
                    <Typography 
                        variant="body1"
                        sx={{
                            fontWeight: 400
                        }}
                    >
                        {user?.firstName} {user?.lastName}
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={logout}
                        sx={{
                            transition: 'all 200ms ease',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;