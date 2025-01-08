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

const Sidebar = ({ open, drawerWidth, onDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Filtra le route per escludere schoolDetail
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
                },
            }}
        >
            <List sx={{ mt: 8 }}>
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
                            backgroundColor: 'transparent',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        <ListItemIcon>{getIcon(route.path)}</ListItemIcon>
                        <ListItemText primary={route.title} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;