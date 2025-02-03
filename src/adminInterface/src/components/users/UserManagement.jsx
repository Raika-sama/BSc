// src/components/users/UserManagement.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
    Box, 
    Fab, 
    Button,
    alpha 
} from '@mui/material';
import { 
    Add as AddIcon,
    FilterList as FilterListIcon 
} from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
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
        <ContentLayout
            title="Gestione Utenti"
            subtitle="Gestisci gli account e i permessi degli utenti"
            actions={
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<FilterListIcon />}
                        onClick={() => {/* Aggiungere logica filtri */}}
                    >
                        Filtri
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<AddIcon />}
                        onClick={handleOpenForm}
                    >
                        Nuovo Utente
                    </Button>
                </Box>
            }
        >
            <Box sx={{ height: '100%', position: 'relative' }}>
                <Routes>
                    <Route index element={<UsersList />} />
                    <Route path=":id" element={<UserDetails />} />
                </Routes>

                <UserForm
                    open={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={handleCreateUser}
                    initialData={null}
                    isLoading={false}
                />

                {/* FAB per nuovo utente - ora stilizzato meglio */}
                <Fab 
                    color="primary" 
                    aria-label="add user"
                    onClick={handleOpenForm}
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        zIndex: 1000,
                        boxShadow: theme => `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
                        '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: theme => `0 10px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                        },
                        transition: 'all 0.2s ease-in-out'
                    }}
                >
                    <AddIcon />
                </Fab>
            </Box>
        </ContentLayout>
    );
};

export default UserManagement;