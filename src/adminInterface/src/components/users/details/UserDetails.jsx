// src/components/users/details/UserDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    CircularProgress,
    Avatar,
    Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import UserInfo from './UserInfo';
import UserPermissions from './UserPermissions';
import UserSessions from './UserSessions';
import UserHistory from './UserHistory';
import { useUser } from '../../../context/UserContext';

const UserDetails = () => {
    const { id } = useParams();
    const [currentTab, setCurrentTab] = useState(0);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { getUserById } = useUser();

    useEffect(() => {
        loadUserData();
    }, [id]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const data = await getUserById(id);
            setUserData(data);
        } catch (error) {
            console.error('Error loading user details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!userData) {
        return (
            <Box p={3}>
                <Typography>Utente non trovato</Typography>
            </Box>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar
                            sx={{ 
                                width: 80, 
                                height: 80,
                                bgcolor: 'primary.main'
                            }}
                        >
                            {userData.firstName[0]}{userData.lastName[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h5">
                                {userData.firstName} {userData.lastName}
                            </Typography>
                            <Typography color="textSecondary">
                                {userData.email}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label={userData.role.toUpperCase()}
                                    color="primary"
                                    size="small"
                                    sx={{ mr: 1 }}
                                />
                                <Chip
                                    label={userData.status.toUpperCase()}
                                    color={
                                        userData.status === 'active' ? 'success' :
                                        userData.status === 'inactive' ? 'warning' :
                                        'error'
                                    }
                                    size="small"
                                />
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="Informazioni" />
                        <Tab label="Permessi e Ruoli" />
                        <Tab label="Sessioni Attive" />
                        <Tab label="Storico Modifiche" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {currentTab === 0 && (
                            <UserInfo 
                                userData={userData} 
                                onUpdate={loadUserData} 
                            />
                        )}
                        {currentTab === 1 && (
                            <UserPermissions 
                                userData={userData} 
                                onUpdate={loadUserData} 
                            />
                        )}
                        {currentTab === 2 && (
                            <UserSessions 
                                userData={userData} 
                                onUpdate={loadUserData} 
                            />
                        )}
                        {currentTab === 3 && (
                            <UserHistory 
                                userData={userData} 
                            />
                        )}
                    </Box>
                </Paper>
            </Box>
        </motion.div>
    );
};

export default UserDetails;