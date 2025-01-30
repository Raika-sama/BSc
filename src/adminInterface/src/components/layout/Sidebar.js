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

const menuItems = [
    { path: 'dashboard', title: 'Dashboard', icon: <DashboardIcon /> },
    { path: 'users', title: 'Gestione Utenti', icon: <PersonIcon /> },
    { path: 'schools', title: 'Gestione Scuole', icon: <SchoolIcon /> },
    { path: 'classes', title: 'Gestione Classi', icon: <ClassIcon /> },
    { path: 'students', title: 'Gestione Studenti', icon: <StudentsIcon /> },
    { path: 'api-explorer', title: 'API Explorer', icon: <ApiIcon /> },
];

const Sidebar = ({ open, drawerWidth, onDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

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
                    {menuItems.map((item) => {
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
                                            '& .MuiTypography-root': {
                                                fontSize: '0.9rem',
                                                fontWeight: isSelected ? 500 : 400,
                                                color: isSelected ? 'primary.dark' : 'text.primary',
                                                transition: 'all 0.3s ease',
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