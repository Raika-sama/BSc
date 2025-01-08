// src/components/school/schoolComponents/UsersList.js
import React from 'react';
import {
    List,
    ListItem,
    Box,
    Typography,
    Chip,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const UsersList = ({ users, onRemoveUser }) => {
    console.log('Users received in UsersList:', JSON.stringify(users, null, 2));
    
    if (!users || users.length === 0) {
        return (
            <Box component="div">
                <Typography 
                    variant="body2" 
                    color="textSecondary"
                >
                    Nessun utente associato
                </Typography>
            </Box>
        );
    }

    return (
        <List component="div" sx={{ width: '100%' }}>
            {users.map((userAssignment) => {
                // Se userAssignment.user è null o undefined, usa userAssignment direttamente
                const user = userAssignment.user || userAssignment;
                const userId = user._id || userAssignment._id;
                
                return (
                    <ListItem
                        key={userAssignment._id}
                        component="div"
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                            borderBottom: '1px solid #eee'
                        }}
                    >
                        <Box component="div" sx={{ flex: 1 }}>
                            <Box component="div" mb={0.5}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    ID Utente: {userId}
                                </Typography>
                                {user && (
                                    <>
                                        {user.firstName && user.lastName && (
                                            <Typography variant="body1">
                                                Nome: {user.firstName} {user.lastName}
                                            </Typography>
                                        )}
                                        {user.email && (
                                            <Typography variant="body2" color="textSecondary">
                                                Email: {user.email}
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                            <Box 
                                component="div" 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1 
                                }}
                            >
                                <Chip
                                    label={userAssignment.role === 'admin' ? 'Amministratore' : 'Insegnante'}
                                    size="small"
                                    variant="outlined"
                                    color={userAssignment.role === 'admin' ? 'primary' : 'default'}
                                />
                            </Box>
                        </Box>
                        <Box 
                            component="div" 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                ml: 2 
                            }}
                        >
                            <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => onRemoveUser(userAssignment._id)}
                                color="error"
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </ListItem>
                );
            })}
        </List>
    );
};

export default UsersList;