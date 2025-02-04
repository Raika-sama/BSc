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
import { alpha } from '@mui/material/styles';

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
            // Gradiente potenziato con più colori e maggiore opacità
            backgroundImage: customTheme.palette.mode === 'dark'
                ? `linear-gradient(135deg, 
                    ${alpha(customTheme.palette.primary.dark, 0.95)} 0%,
                    ${alpha(customTheme.palette.primary.main, 0.90)} 30%,
                    ${alpha(customTheme.palette.primary.light, 0.85)} 70%,
                    ${alpha(customTheme.palette.primary.main, 0.95)} 100%)`
                : `linear-gradient(135deg, 
                    ${alpha(customTheme.palette.primary.light, 0.95)} 0%,
                    ${alpha(customTheme.palette.primary.main, 1)} 40%,
                    ${alpha(customTheme.palette.primary.dark, 0.9)} 80%,
                    ${alpha(customTheme.palette.primary.main, 0.95)} 100%)`,
            boxShadow: customTheme.palette.mode === 'dark'
                ? '0 2px 12px rgba(0, 0, 0, 0.4)'
                : '0 2px 12px rgba(100, 181, 246, 0.3)',
            zIndex: muiTheme.zIndex.drawer + 1,
            transition: theme => theme.transitions.create(
                ['background-color', 'box-shadow', 'background-image', 'transform'],
                {
                    duration: theme.transitions.duration.standard,
                    easing: theme.transitions.easing.easeInOut,
                }
            ),
            // Effetto hover potenziato
            '&:hover': {
                backgroundImage: customTheme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, 
                        ${alpha(customTheme.palette.primary.dark, 1)} 0%,
                        ${alpha(customTheme.palette.primary.main, 0.95)} 35%,
                        ${alpha(customTheme.palette.primary.light, 0.9)} 65%,
                        ${alpha(customTheme.palette.primary.dark, 1)} 100%)`
                    : `linear-gradient(135deg, 
                        ${alpha(customTheme.palette.primary.light, 1)} 0%,
                        ${alpha(customTheme.palette.primary.main, 0.95)} 45%,
                        ${alpha(customTheme.palette.primary.dark, 0.95)} 75%,
                        ${alpha(customTheme.palette.primary.main, 1)} 100%)`,
                boxShadow: customTheme.palette.mode === 'dark'
                    ? '0 4px 15px rgba(0, 0, 0, 0.5)'
                    : '0 4px 15px rgba(100, 181, 246, 0.4)',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(45deg, 
                        ${alpha(customTheme.palette.primary.main, 0)} 30%, 
                        ${alpha(customTheme.palette.primary.light, 0.1)} 50%,
                        ${alpha(customTheme.palette.primary.main, 0)} 70%)`,
                    animation: 'shimmer 2s infinite',
                },
            },
            // Aggiungiamo un'animazione di shimmer
            '@keyframes shimmer': {
                '0%': {
                    transform: 'translateX(-100%)',
                },
                '100%': {
                    transform: 'translateX(100%)',
                },
            },
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
                        transform: 'scale(1.1)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                transform: 'scale(1.1)',
                                '& .MuiAvatar-root': {
                                    borderColor: 'rgba(255,255,255,1)',
                                    transform: 'rotate(360deg)',
                                }
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                border: '2px solid rgba(255,255,255,0.8)',
                                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
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