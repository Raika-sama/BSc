// src/components/users/details/UserSessions.jsx
import React from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Paper,
    Tooltip
} from '@mui/material';
import {
    DeleteOutline as DeleteIcon,
    Computer as ComputerIcon,
    PhoneAndroid as PhoneIcon
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';

const UserSessions = ({ userData, onUpdate }) => {
    const { terminateSession } = useUser();

    const handleTerminateSession = async (sessionId) => {
        try {
            await terminateSession(userData._id, sessionId);
            onUpdate();
        } catch (error) {
            console.error('Error terminating session:', error);
        }
    };

    const getDeviceIcon = (userAgent) => {
        if (userAgent.toLowerCase().includes('mobile')) {
            return <PhoneIcon />;
        }
        return <ComputerIcon />;
    };

    const formatLastUsed = (date) => {
        const lastUsed = new Date(date);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastUsed) / 1000 / 60);

        if (diffMinutes < 60) {
            return `${diffMinutes} minuti fa`;
        }
        if (diffMinutes < 1440) {
            return `${Math.floor(diffMinutes / 60)} ore fa`;
        }
        return lastUsed.toLocaleDateString();
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
                Sessioni Attive
            </Typography>

            <Paper>
                <List>
                    {userData.sessionTokens?.map((session) => (
                        <ListItem key={session._id}>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {getDeviceIcon(session.userAgent)}
                                        <Typography>
                                            {session.userAgent}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <>
                                        <Typography variant="caption" display="block">
                                            IP: {session.ipAddress}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Ultimo accesso: {formatLastUsed(session.lastUsedAt)}
                                        </Typography>
                                    </>
                                }
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title="Termina sessione">
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleTerminateSession(session._id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default UserSessions;