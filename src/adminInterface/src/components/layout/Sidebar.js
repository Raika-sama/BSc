// Sidebar.js
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
    People as StudentsIcon,  // Cambiato da Assignment a People per gli studenti
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Menu items semplificato
const menuItems = [
    { path: 'dashboard', title: 'Dashboard', icon: <DashboardIcon /> },
    { path: 'users', title: 'Gestione Utenti', icon: <PersonIcon /> },
    { path: 'schools', title: 'Gestione Scuole', icon: <SchoolIcon /> },
    { path: 'classes', title: 'Gestione Classi', icon: <ClassIcon /> },
    { path: 'students', title: 'Gestione Studenti', icon: <StudentsIcon /> },
];

const Sidebar = ({ open, drawerWidth, onDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

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
                },
            }}
        >
            <List sx={{ pt: 1 }}>  {/* Ridotto padding top */}
                {menuItems.map((item) => (
                    <ListItem
                        component="button"
                        key={item.path}
                        onClick={() => navigate(`/admin/${item.path}`)}
                        selected={location.pathname === `/admin/${item.path}`}
                        sx={{
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            py: 1,      // Ridotto padding verticale
                            my: 0.25,   // Ridotto margine verticale
                            backgroundColor: 'transparent',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                backgroundColor: '#e8f5e9',
                                '& .MuiListItemIcon-root': {
                                    color: '#2e7d32',
                                }
                            },
                            '&.Mui-selected': {
                                backgroundColor: '#c8e6c9',
                                '& .MuiListItemIcon-root': {
                                    color: '#2e7d32',
                                }
                            },
                            '& .MuiListItemIcon-root': {
                                color: '#37474f',
                                minWidth: 35,  // Ridotto spazio icona
                                '& svg': {     // Ridotto dimensione icona
                                    fontSize: '1.2rem'
                                }
                            }
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText 
                            primary={item.title} 
                            sx={{
                                '& .MuiTypography-root': {
                                    fontSize: '0.9rem',  // Ridotto dimensione testo
                                    fontWeight: location.pathname === `/admin/${item.path}` ? 500 : 400,
                                }
                            }}
                        />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;