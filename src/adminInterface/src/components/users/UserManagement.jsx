// src/components/users/UserManagement.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UsersList from './list/UsersList';
import UserDetails from './details/UserDetails';
import { Box } from '@mui/material';

const UserManagement = () => {
    return (
        <Box sx={{ height: '100%' }}>
            <Routes>
                <Route index element={<UsersList />} />
                <Route path=":id" element={<UserDetails />} />
            </Routes>
        </Box>
    );
};

export default UserManagement;