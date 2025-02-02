// src/components/users/details/UserHistory.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    Login as LoginIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';

const UserHistory = ({ userData }) => {
    const [history, setHistory] = useState([]);
    const { getUserHistory } = useUser();

    useEffect(() => {
        loadHistory();
    }, [userData._id]);

    const loadHistory = async () => {
        try {
            const data = await getUserHistory(userData._id);
            setHistory(data);
        } catch (error) {
            console.error('Error loading user history:', error);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'updated':
                return <EditIcon color="primary" />;
            case 'password_changed':
                return <LockIcon color="warning" />;
            case 'role_changed':
                return <PersonIcon color="info" />;
            case 'login':
                return <LoginIcon color="success" />;
            case 'logout':
                return <LogoutIcon />;
            default:
                return <EditIcon />;
        }
    };

    const formatChanges = (changes) => {
        if (!changes) return null;
        
        return Object.entries(changes).map(([field, value]) => (
            <Box key={field} sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                    {field}:
                </Typography>
                <Typography variant="body2">
                    {value.old || '-'} → {value.new || '-'}
                </Typography>
            </Box>
        ));
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
                Storico Modifiche
            </Typography>

            <List>
                {history.map((event, index) => (
                    <React.Fragment key={event._id}>
                        <ListItem
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                py: 2
                            }}
                        >
                            <Paper 
                                elevation={1} 
                                sx={{ 
                                    p: 2, 
                                    width: '100%',
                                    bgcolor: 'background.paper'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {getActionIcon(event.action)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2">
                                                {event.action.replace('_', ' ').toUpperCase()}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(event.createdAt).toLocaleString()}
                                            </Typography>
                                        }
                                    />
                                </Box>
                                
                                {formatChanges(event.changes)}
                                
                                {event.performedBy && (
                                    <Typography 
                                        variant="caption" 
                                        display="block" 
                                        sx={{ mt: 1, color: 'text.secondary' }}
                                    >
                                        Eseguito da: {event.performedBy.firstName} {event.performedBy.lastName}
                                    </Typography>
                                )}
                            </Paper>
                        </ListItem>
                        {index < history.length - 1 && (
                            <Divider variant="inset" component="li" />
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default UserHistory;