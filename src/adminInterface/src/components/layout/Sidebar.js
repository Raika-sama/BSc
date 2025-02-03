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
    People as StudentsIcon,
    Api as ApiIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

// Definizione menu items con permessi richiesti
const menuItems = [
    { 
        path: 'dashboard', 
        title: 'Dashboard', 
        icon: <DashboardIcon />,
        requiredPermission: null // accessibile a tutti gli admin
    },
    { 
        path: 'users', 
        title: 'Gestione Utenti', 
        icon: <PersonIcon />,
        requiredPermission: 'users:read'
    },
    { 
        path: 'schools', 
        title: 'Gestione Scuole', 
        icon: <SchoolIcon />,
        requiredPermission: 'schools:read'
    },
    { 
        path: 'classes', 
        title: 'Gestione Classi', 
        icon: <ClassIcon />,
        requiredPermission: 'classes:read'
    },
    { 
        path: 'students', 
        title: 'Gestione Studenti', 
        icon: <StudentsIcon />,
        requiredPermission: 'students:read'
    },
    { 
        path: 'api-explorer', 
        title: 'API Explorer', 
        icon: <ApiIcon />,
        requiredPermission: null, // accessibile a tutti gli admin
        adminOnly: true
    },
];

const Sidebar = ({ open, drawerWidth, onDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, checkPermission } = useAuth();

    // Filtra menu items in base ai permessi
    const filteredMenuItems = menuItems.filter(item => {
        if (item.adminOnly && user?.role !== 'admin') {
            return false;
        }
        if (item.requiredPermission) {
            return checkPermission(item.requiredPermission);
        }
        return true;
    });

    const handleNavigation = (path) => {
        navigate(`/admin/${path}`);
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
                    bgcolor: 'background.paper',
                    borderRight: '1px solid rgba(100, 181, 246, 0.12)',
                    mt: 8,
                    color: 'sidebar.text',
                    boxShadow: '2px 0 8px rgba(100, 181, 246, 0.08)',
                    transition: theme =>
                        theme.transitions.create(['transform', 'box-shadow'], {
                            easing: theme.transitions.easing.easeInOut,
                            duration: theme.transitions.duration.standard,
                        }),
                    transform: open ? 'none' : `translateX(-${drawerWidth}px)`,
                    '&:hover': {
                        boxShadow: '2px 0 12px rgba(100, 181, 246, 0.12)',
                    }
                }
            }}
        >
            <motion.div
                initial="hidden"
                animate="show"
            >
                <List sx={{ pt: 1 }}>
                    {filteredMenuItems.map((item) => {
                        const isSelected = location.pathname === `/admin/${item.path}`;
                        
                        return (
                            <motion.div key={item.path}>
                                <ListItem
                                    component={motion.button}
                                    whileHover={{ 
                                        scale: 1.02, 
                                        transition: { duration: 0.2 } 
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleNavigation(item.path)}
                                    selected={isSelected}
                                    sx={{
                                        border: 'none',
                                        width: '100%',
                                        textAlign: 'left',
                                        py: 1,
                                        my: 0.25,
                                        mx: 1,
                                        backgroundColor: 'transparent',
                                        borderRadius: 1,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: 'sidebar.hover',
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.main',
                                                transform: 'scale(1.1)',
                                            },
                                            '& .MuiListItemText-primary': {
                                                color: 'primary.main',
                                            }
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: 'sidebar.selected',
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.main',
                                            },
                                            '& .MuiListItemText-primary': {
                                                color: 'primary.dark',
                                                fontWeight: 500,
                                            },
                                            '&:hover': {
                                                backgroundColor: 'sidebar.selected',
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        color: isSelected ? 'primary.main' : 'text.secondary',
                                        minWidth: 35,
                                        transition: 'all 0.3s ease',
                                        marginRight: 1
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.title}
                                        sx={{
                                            '& .MuiDrawer-paper': {
                                                // ... altre proprietà ...
                                                transition: theme =>
                                                    theme.transitions.create(
                                                        ['transform', 'box-shadow', 'background-color', 'border-color'],
                                                        {
                                                            easing: theme.transitions.easing.easeInOut,
                                                            duration: theme.transitions.duration.standard,
                                                        }
                                                    ),
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