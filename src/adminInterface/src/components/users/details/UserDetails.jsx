// src/components/users/details/UserDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    CircularProgress,
    Avatar,
    Chip,
    Alert,
    Button,
    Divider,
    Grid
} from '@mui/material';
import { motion } from 'framer-motion';
import { useUser } from '../../../context/UserContext';
import { useSchool } from '../../../context/SchoolContext';
import UserInfo from './UserInfo';
import UserPermissions from './UserPermissions';
import UserSessions from './UserSessions';
import UserHistory from './UserHistory';
import UserRoleInfo from './UserRoleInfo';
import UserResourcesAssignment from './UserResourcesAssignment';

// Icone per i badge di status
import {
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    Block as SuspendedIcon
} from '@mui/icons-material';

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState(0);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getUserById } = useUser();


    const loadUserData = async () => {
        try {
            console.log('UserDetails: Loading data for user ID:', id);
            setLoading(true);
            setError(null);
    
            const data = await getUserById(id);
            
            if (!data || !data._id) {
                throw new Error('Dati utente non validi');
            }
    
            console.log('UserDetails: Successfully loaded user data:', {
                id: data._id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                testAccessLevel: data.testAccessLevel // Logging importante
            });
    
            setUserData(data);
        } catch (error) {
            console.error('UserDetails: Error loading user data:', error);
            setError(error.message || 'Errore nel caricamento dei dati utente');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadUserData();
        }
    }, [id]);

    // Ottieni l'icona di stato
    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <ActiveIcon color="success" />;
            case 'inactive':
                return <InactiveIcon color="warning" />;
            case 'suspended':
                return <SuspendedIcon color="error" />;
            default:
                return null;
        }
    };

    // Ottieni il colore per il chip di stato
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'warning';
            case 'suspended':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!userData) {
        return (
            <Box p={3}>
                <Alert severity="warning">
                    Utente non trovato
                </Alert>
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
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
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
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <Chip
                                            label={userData.role?.toUpperCase()}
                                            color="primary"
                                            size="small"
                                        />
                                        <Chip
                                            label={userData.status?.toUpperCase()}
                                            color={getStatusColor(userData.status)}
                                            icon={getStatusIcon(userData.status)}
                                            size="small"
                                        />
                                        {userData.hasAdminAccess && (
                                            <Chip
                                                label="ADMIN ACCESS"
                                                color="error"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" justifyContent="flex-end" height="100%" alignItems="center">
                               
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    Torna alla lista
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="Informazioni" />
                        <Tab label="Ruolo" />
                        <Tab label="Permessi" />
                        <Tab label="Risorse Assegnate" />
                        <Tab label="Sessioni" />
                        <Tab label="Storico" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {currentTab === 0 && (
                            <UserInfo 
                                userData={userData} 
                                onUpdate={loadUserData} 
                            />
                        )}
                        {currentTab === 1 && (
                            <UserRoleInfo 
                                role={userData.role} 
                            />
                        )}
                        {currentTab === 2 && (
                            <UserPermissions 
                                userData={userData} 
                                onUpdate={loadUserData} 
                            />
                        )}
                        {currentTab === 3 && (
                            <UserResourcesAssignment 
                                userData={userData} 
                                onUpdate={loadUserData}
                            />
                        )}
                        {currentTab === 4 && (
                            <UserSessions 
                                userData={userData} 
                                onUpdate={loadUserData} 
                            />
                        )}
                        {currentTab === 5 && (
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