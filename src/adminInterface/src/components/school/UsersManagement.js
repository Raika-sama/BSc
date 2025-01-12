// src/components/school/UsersManagement.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StarIcon from '@mui/icons-material/Star';
import { useSchool } from '../../context/SchoolContext';
import { ChangeManagerDialog } from './schoolComponents/ChangeManagerDialog';
import { AddUserDialog } from './schoolComponents/AddUserDialog';

const UsersManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedSchool, loading, error, getSchoolById, updateSchool } = useSchool();
    const [isChangeManagerOpen, setIsChangeManagerOpen] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        getSchoolById(id);
    }, [id]);

    const handleChangeManager = async (newManagerId) => {
        try {
            await updateSchool(id, {
                manager: newManagerId
            });
            await getSchoolById(id);
            setIsChangeManagerOpen(false);
        } catch (error) {
            console.error('Error changing manager:', error);
        }
    };

    const handleAddUser = async (userData) => {
        try {
            // Implementare logica per aggiungere utente
            setIsAddUserOpen(false);
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            // Implementare logica per aggiornare ruolo
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

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

            {/* Manager Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Manager</Typography>
                        <Button
                            startIcon={<EditIcon />}
                            onClick={() => setIsChangeManagerOpen(true)}
                        >
                            Cambia Manager
                        </Button>
                    </Box>
                    {selectedSchool?.manager && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <StarIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="body1">
                                    {selectedSchool.manager.firstName} {selectedSchool.manager.lastName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {selectedSchool.manager.email}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Users List */}
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Utenti</Typography>
                        <Button
                            startIcon={<PersonAddIcon />}
                            onClick={() => setIsAddUserOpen(true)}
                        >
                            Aggiungi Utente
                        </Button>
                    </Box>
                    <List>
                        {selectedSchool?.users?.map((userAssignment) => (
                            <ListItem
                                key={userAssignment._id}
                                divider
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <PersonIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${userAssignment.user.firstName} ${userAssignment.user.lastName}`}
                                    secondary={userAssignment.user.email}
                                />
                                <ListItemSecondaryAction>
                                    <Button
                                        size="small"
                                        onClick={() => handleUpdateUserRole(userAssignment._id, userAssignment.role)}
                                    >
                                        {userAssignment.role}
                                    </Button>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleRemoveUser(userAssignment._id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Change Manager Dialog */}
            <ChangeManagerDialog
                open={isChangeManagerOpen}
                onClose={() => setIsChangeManagerOpen(false)}
                onConfirm={handleChangeManager}
                currentUsers={selectedSchool?.users || []}
            />

            {/* Add User Dialog */}
            <AddUserDialog
                open={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onConfirm={handleAddUser}
            />
        </Container>
    );
};

export default UsersManagement;