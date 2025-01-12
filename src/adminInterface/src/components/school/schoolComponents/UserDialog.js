// src/components/school/schoolComponents/UsersDialog.js
import React from 'react';
import {
    Box,
    Typography,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';

const UsersDialog = ({ manager, users }) => {
    return (
        <Box>
            {/* Manager Section */}
            {manager && (
                <Box 
                    sx={{ 
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        p: 2,
                        borderRadius: 1,
                        mb: 3
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                        Manager della Scuola
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <StarIcon />
                        </Avatar>
                        <Box flex={1}>
                            <Typography variant="body1" fontWeight="medium">
                                {manager.firstName} {manager.lastName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {manager.email}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Users Section */}
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Altri Utenti
            </Typography>
            <List sx={{ width: '100%' }}>
                {users.map((userAssignment) => {
                    const user = userAssignment.user || userAssignment;
                    return (
                        <ListItem
                            key={user._id}
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                py: 1.5
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar>
                                    <PersonIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body1">
                                            {user.firstName} {user.lastName}
                                        </Typography>
                                        <Chip
                                            label={userAssignment.role === 'admin' ? 'Admin' : 'Insegnante'}
                                            size="small"
                                            color={userAssignment.role === 'admin' ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                    </Box>
                                }
                                secondary={user.email}
                            />
                        </ListItem>
                    );
                })}
                {users.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                        Nessun altro utente associato
                    </Typography>
                )}
            </List>
        </Box>
    );
};

export default UsersDialog;