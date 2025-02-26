import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    alpha,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext/ThemeContextIndex';
import { adminRoutes, hasRoutePermission } from '../../routes/routes';

const Sidebar = ({ open, drawerWidth }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, checkPermission } = useAuth();
    const { theme: customTheme } = useTheme();

    // Animazioni
    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        show: { x: 0, opacity: 1 }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    // Stili
    const drawerStyles = {
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'transparent',
            backgroundImage: theme => theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.98)} 0%,
                    ${alpha(theme.palette.background.paper, 0.95)} 50%,
                    ${alpha(theme.palette.background.paper, 0.92)} 100%)`
                : `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.98)} 0%,
                    ${alpha(theme.palette.background.paper, 0.95)} 50%,
                    ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
            borderRight: theme => `1px solid ${
                theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.12)
            }`,
            mt: 8,
            height: 'calc(100% - 64px)',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            boxShadow: theme => theme.palette.mode === 'dark'
                ? '4px 0 20px rgba(0,0,0,0.35)'
                : '4px 0 20px rgba(100, 181, 246, 0.15)',
            transition: 'all 0.3s ease-in-out',
            position: 'relative',
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: theme => `linear-gradient(45deg, 
                    ${alpha(theme.palette.primary.main, 0)} 30%, 
                    ${alpha(theme.palette.primary.light, 0.05)} 50%,
                    ${alpha(theme.palette.primary.main, 0)} 70%)`,
                animation: 'shimmerSidebar 3s infinite',
                pointerEvents: 'none'
            },
            '@keyframes shimmerSidebar': {
                '0%': { transform: 'translateY(-100%)' },
                '100%': { transform: 'translateY(100%)' }
            }
        }
    };

    const scrollbarStyles = {
        '::-webkit-scrollbar': {
            width: '4px',
        },
        '::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
            '&:hover': {
                backgroundColor: theme => alpha(theme.palette.primary.main, 0.3),
            },
        },
    };

    const listItemStyles = (isSelected) => ({
        border: 'none',
        width: '90%',
        py: 1.2,
        my: 0.5,
        mx: 'auto',
        borderRadius: 2,
        background: isSelected
            ? theme => `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.15)} 0%,
                ${alpha(theme.palette.primary.light, 0.12)} 50%,
                ${alpha(theme.palette.primary.main, 0.15)} 100%)`
            : 'transparent',
        '&:hover': {
            background: theme => theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.18)} 0%,
                    ${alpha(theme.palette.primary.light, 0.15)} 50%,
                    ${alpha(theme.palette.primary.main, 0.18)} 100%)`
                : `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.12)} 0%,
                    ${alpha(theme.palette.primary.light, 0.09)} 50%,
                    ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
            '& .MuiListItemIcon-root': {
                transform: 'scale(1.1) translateX(2px)',
            }
        },
        transition: 'all 0.3s ease'
    });

    // Logica
    const filteredMenuItems = adminRoutes.filter(route => {
        if (!route.showInMenu) return false;
        if (route.adminOnly && user?.role !== 'admin') return false;
        return hasRoutePermission(route, user, checkPermission);
    });

    const handleNavigation = (path) => {
        const basePath = path.split('/')[0];
        navigate(`/admin/${basePath}`);
    };

    return (
        <Drawer
            variant="persistent"
            anchor="left"
            open={open}
            sx={drawerStyles}
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                style={{ 
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
                sx={scrollbarStyles}
            >
                <List sx={{ pt: 1, pb: 2 }}>
                    <AnimatePresence mode="wait">
                        {filteredMenuItems.map((route) => {
                            const basePath = route.path.split('/')[0];
                            const isSelected = location.pathname.startsWith(`/admin/${basePath}`);
                            const Icon = route.icon || DashboardIcon;
                            
                            return (
                                <motion.div
                                    key={`sidebar-${route.path}`}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                >
                                    <ListItem
                                        onClick={() => handleNavigation(route.path)}
                                        selected={isSelected}
                                        sx={listItemStyles(isSelected)}
                                    >
                                        <ListItemIcon 
                                            sx={{
                                                color: isSelected ? 'primary.main' : 'text.secondary',
                                                minWidth: 35,
                                                marginRight: 1,
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Icon />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={route.title}
                                            primaryTypographyProps={{
                                                sx: {
                                                    fontSize: '0.95rem',
                                                    fontWeight: isSelected ? 600 : 400,
                                                    color: isSelected ? 'primary.main' : 'text.primary',
                                                    letterSpacing: '0.02em',
                                                    transition: 'all 0.3s ease'
                                                }
                                            }}
                                        />
                                    </ListItem>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </List>
            </motion.div>
        </Drawer>
    );
};

export default Sidebar;