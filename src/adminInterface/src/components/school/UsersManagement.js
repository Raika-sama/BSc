// src/components/school/UsersManagement.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSchool } from '../../context/SchoolContext';
import SchoolUsersManagement from './schoolComponents/SchoolUsersManagement';

const UsersManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedSchool, loading, error, getSchoolById, updateSchool, updateSchoolUser } = useSchool();

    React.useEffect(() => {
        getSchoolById(id);
    }, [id]);

    const handleAddUser = async (userData) => {
        try {
            await updateSchoolUser(id, userData.email, {
                action: 'add',
                role: userData.role
            });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    const handleRemoveUser = async (userId) => {
        try {
            await updateSchoolUser(id, userId, {
                action: 'remove'
            });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    };

    const handleChangeManager = async (newManagerId) => {
        try {
            await updateSchool(id, {
                manager: newManagerId
            });
            await getSchoolById(id);
        } catch (error) {
            console.error('Error changing manager:', error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!selectedSchool) {
        return (
            <Box textAlign="center" py={4}>
                <Typography variant="h6">Scuola non trovata</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate(`/admin/schools/${id}`)}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" flex={1}>
                    Gestione Utenze
                </Typography>
            </Box>

            <Card>
                <CardContent>
                    <SchoolUsersManagement
                        users={selectedSchool.users}
                        manager={selectedSchool.manager}
                        onAddUser={handleAddUser}
                        onRemoveUser={handleRemoveUser}
                        onChangeManager={handleChangeManager}
                    />
                </CardContent>
            </Card>
        </Container>
    );
};

export default UsersManagement;