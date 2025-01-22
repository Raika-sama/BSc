// Header.js
import React, { useState } from 'react'; // Aggiungi useState
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Button,
    Menu,        // Aggiungi questi
    MenuItem,    // nuovi
    Divider,     // componenti
    Avatar,      // di MUI
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle as AccountCircleIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Aggiungi useNavigate

const Header = ({ open, drawerWidth, onDrawerToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        navigate('/admin/profile');
        handleClose();
    };

    const handlePersonalTest = () => {
        navigate('/admin/personal-test');
        handleClose();
    };

    const handleLogout = () => {
        handleClose();
        logout();
    };

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
                    gap: 1
                }}>
                    <IconButton
                        size="large"
                        onClick={handleMenu}
                        color="inherit"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: 'primary.dark',
                                fontSize: '1rem'
                            }}
                        >
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </Avatar>
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user?.email}
                            </Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={handleProfile}>
                            <PersonIcon sx={{ mr: 1 }} /> Profilo
                        </MenuItem>
                        <MenuItem onClick={handlePersonalTest}>
                            <AssignmentIcon sx={{ mr: 1 }} /> Test Personale
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;