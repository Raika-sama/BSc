import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Menu,
    MenuItem,
    Divider,
    Avatar,
    useTheme as useMuiTheme,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext/ThemeContextIndex';

const Header = ({ open, drawerWidth, onDrawerToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const muiTheme = useMuiTheme();
    // Estrai sia il tema corrente che il tema MUI
    const { currentTheme, theme: customTheme } = useTheme();
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
                bgcolor: 'primary.main',
                backgroundImage: `linear-gradient(to right, ${customTheme.palette.primary.light}, ${customTheme.palette.primary.main})`,
                boxShadow: customTheme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(100, 181, 246, 0.2)',
                zIndex: muiTheme.zIndex.drawer + 1,
                transition: theme => theme.transitions.create(
                    ['background-color', 'box-shadow', 'background-image'],
                    {
                        duration: theme.transitions.duration.standard,
                        easing: theme.transitions.easing.easeInOut,
                    }
                ),
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
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease-in-out'
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
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                    }}
                >
                    BRAIN SCANNER
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
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: customTheme.palette.mode === 'dark' 
                                    ? customTheme.palette.primary.light 
                                    : customTheme.palette.primary.dark,
                                fontSize: '1rem',
                                fontWeight: 500,
                                border: '2px solid rgba(255,255,255,0.8)'
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
                        PaperProps={{
                            sx: {
                                mt: 1,
                                bgcolor: 'background.paper',
                                boxShadow: customTheme.palette.mode === 'dark'
                                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                                    : '0 4px 12px rgba(100, 181, 246, 0.15)',
                                '& .MuiMenuItem-root': {
                                    px: 2,
                                    py: 1,
                                    '&:hover': {
                                        backgroundColor: customTheme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(100, 181, 246, 0.08)',
                                    },
                                },
                            },
                        }}
                    >
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="subtitle1" sx={{ 
                                fontWeight: 500,
                                color: 'primary.main'
                            }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user?.email}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <MenuItem onClick={handleProfile}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} /> Profilo
                        </MenuItem>
                        <MenuItem onClick={handlePersonalTest}>
                            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} /> Test Personale
                        </MenuItem>
                        <Divider sx={{ my: 1 }} />
                        <MenuItem 
                            onClick={handleLogout}
                            sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                    backgroundColor: customTheme.palette.mode === 'dark'
                                        ? 'rgba(244, 67, 54, 0.15)'
                                        : 'error.lighter',
                                }
                            }}
                        >
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;