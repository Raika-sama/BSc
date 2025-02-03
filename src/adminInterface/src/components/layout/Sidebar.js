import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Assessment as AssessmentIcon,
    Api as ApiIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext/ThemeContextIndex';
import { adminRoutes, hasRoutePermission } from '../../routes/routes';

const Sidebar = ({ open, drawerWidth }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, checkPermission } = useAuth();
    const { theme: customTheme } = useTheme();

    // Filtra gli elementi del menu
    const filteredMenuItems = adminRoutes.filter(route => {
        const basePath = route.path.split('/')[0]; // Prende solo la prima parte del path
        const currentPath = location.pathname.split('/')[2]; // Prende il secondo segmento dopo /admin/
        
        if (!route.showInMenu) return false;
        if (route.adminOnly && user?.role !== 'admin') return false;
        return hasRoutePermission(route, checkPermission);
    });

    const handleNavigation = (path) => {
        const basePath = path.split('/')[0]; // Naviga solo alla root del path
        navigate(`/admin/${basePath}`);
    };

    return (
        <Drawer
            variant="persistent"
            anchor="left"
            open={open}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: customTheme.palette.mode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.2)' 
                        : 'background.paper',
                    borderRight: `1px solid ${
                        customTheme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(100, 181, 246, 0.12)'
                    }`,
                    mt: 8,
                    color: 'text.primary',
                    boxShadow: customTheme.palette.mode === 'dark'
                        ? '2px 0 8px rgba(0, 0, 0, 0.3)'
                        : '2px 0 8px rgba(100, 181, 246, 0.08)',
                    transform: open ? 'none' : `translateX(-${drawerWidth}px)`,
                }
            }}
        >
            <motion.div initial="hidden" animate="show">
                <List sx={{ pt: 1 }}>
                    {filteredMenuItems.map((route) => {
                        const basePath = route.path.split('/')[0];
                        const isSelected = location.pathname.startsWith(`/admin/${basePath}`);
                        const Icon = route.icon || DashboardIcon; // Usa l'icona della rotta se presente
                        
                        return (
                            <motion.div key={route.path}>
                                <ListItem
                                    component={motion.button}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleNavigation(route.path)}
                                    selected={isSelected}
                                    sx={{
                                        border: 'none',
                                        width: '90%',
                                        textAlign: 'left',
                                        py: 1.2,
                                        my: 0.5,
                                        mx: 'auto',
                                        backgroundColor: 'transparent',
                                        borderRadius: 2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: customTheme.palette.mode === 'dark'
                                                ? 'rgba(255, 255, 255, 0.05)'
                                                : 'rgba(100, 181, 246, 0.08)',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: customTheme.palette.mode === 'dark'
                                                ? 'rgba(100, 181, 246, 0.15)'
                                                : 'rgba(100, 181, 246, 0.12)',
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        color: isSelected ? 'primary.main' : 'text.secondary',
                                        minWidth: 35,
                                        marginRight: 1
                                    }}>
                                        <Icon />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={route.title}
                                        primaryTypographyProps={{
                                            sx: {
                                                fontSize: '0.95rem',
                                                fontWeight: isSelected ? 600 : 400,
                                                color: isSelected ? 'primary.main' : 'text.primary',
                                            }
                                        }}
                                    />
                                </ListItem>
                            </motion.div>
                        );
                    })}
                </List>
            </motion.div>
        </Drawer>
    );
};

export default Sidebar;