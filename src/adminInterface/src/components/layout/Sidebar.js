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
    { path: 'api-explorer', title: 'API Explorer', icon: <ApiIcon /> },  // Aggiungi questa riga
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
                    bgcolor: '#fafafa',
                    borderRight: '1px solid #e0e0e0',
                    mt: 8,
                    color: '#37474f',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                    transition: theme =>
                        theme.transitions.create(['transform'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    transform: open ? 'none' : `translateX(-${drawerWidth}px)`,
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
                                    whileHover={{ scale: 1.02, backgroundColor: '#e8f5e9' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleNavigation(item.path)}
                                    selected={isSelected}
                                    sx={{
                                        border: 'none',
                                        width: '100%',
                                        textAlign: 'left',
                                        py: 1,
                                        my: 0.25,
                                        backgroundColor: 'transparent',
                                        borderRadius: 1,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            '& .MuiListItemIcon-root': {
                                                color: '#2e7d32',
                                                transform: 'scale(1.1)',
                                            }
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: '#c8e6c9',
                                            '& .MuiListItemIcon-root': {
                                                color: '#2e7d32',
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        color: '#37474f',
                                        minWidth: 35,
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.title}
                                        sx={{
                                            '& .MuiTypography-root': {
                                                fontSize: '0.9rem',
                                                fontWeight: isSelected ? 500 : 400,
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