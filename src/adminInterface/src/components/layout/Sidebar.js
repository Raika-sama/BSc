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
    Assignment as TestIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminRoutes } from '../../routes/routes';

const Sidebar = ({ open, drawerWidth, onDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Spostiamo la funzione getIcon all'interno del componente
    const getIcon = (path) => {
        switch (path) {
            case 'dashboard':
                return <DashboardIcon />;
            case 'users':
                return <PersonIcon />;
            case 'schools':
                return <SchoolIcon />;
            case 'classes':
                return <ClassIcon />;
            case 'tests':
                return <TestIcon />;
            default:
                return <DashboardIcon />;
        }
    };

    const visibleRoutes = adminRoutes.filter(route => route.path !== 'schools/:id');

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
            <List>
                {visibleRoutes.map((route) => (
                    <ListItem
                        component="button"
                        key={route.path}
                        onClick={() => navigate(`/admin/${route.path}`)}
                        selected={location.pathname === `/admin/${route.path}`}
                        sx={{
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            py: 1.5,
                            my: 0.5,
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
                                minWidth: 40,
                            }
                        }}
                    >
                        <ListItemIcon>{getIcon(route.path)}</ListItemIcon>
                        <ListItemText 
                            primary={route.title} 
                            sx={{
                                '& .MuiTypography-root': {
                                    fontWeight: location.pathname === `/admin/${route.path}` ? 500 : 400,
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