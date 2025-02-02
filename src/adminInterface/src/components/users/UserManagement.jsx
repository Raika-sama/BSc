// src/components/users/UserManagement.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UsersList from './list/UsersList';
import UserDetails from './details/UserDetails';
import UserForm from './UserForm';
import { useUser } from '../../context/UserContext';

const UserManagement = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { createUser } = useUser();

    const handleOpenForm = () => {
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
    };

    const handleCreateUser = async (userData) => {
        try {
            console.log('Attempting to create user:', userData);
            const newUser = await createUser(userData);
            console.log('User created successfully:', newUser);
            handleCloseForm();
            // Forza il refresh della lista
            window.location.reload();
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    return (
        <Box sx={{ height: '100%', position: 'relative' }}>
            <Fab 
                color="primary" 
                aria-label="add user"
                onClick={handleOpenForm}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1000
                }}
            >
                <AddIcon />
            </Fab>

            <UserForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleCreateUser}
                initialData={null}
                isLoading={false}
            />

            <Routes>
                <Route index element={<UsersList />} />
                <Route path=":id" element={<UserDetails />} />
            </Routes>
        </Box>
    );
};

export default UserManagement;