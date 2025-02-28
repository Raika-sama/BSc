import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Checkbox,
    IconButton,
    InputAdornment,
    Typography,
    Box,
    Divider,
    CircularProgress,
    Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { axiosInstance } from '../../../services/axiosConfig';

const UserSelectionModal = ({ open, onClose, onSelectUsers, selectedSchoolId }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Carica utenti disponibili
    useEffect(() => {
        if (open) {
            fetchAvailableUsers();
        }
    }, [open, selectedSchoolId]);

    // Filtra utenti quando cambia il termine di ricerca
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(users);
        } else {
            const lowercaseSearch = searchTerm.toLowerCase();
            const filtered = users.filter(
                user => 
                    user.firstName.toLowerCase().includes(lowercaseSearch) ||
                    user.lastName.toLowerCase().includes(lowercaseSearch) ||
                    user.email.toLowerCase().includes(lowercaseSearch)
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const fetchAvailableUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching available users...');
            
            // 1. Ottieni tutti gli utenti
            const response = await axiosInstance.get('/users', {
                params: {
                    limit: 100
                }
            });
            
            console.log('Users API response structure:', response);
            
            // Estrai gli utenti dalla risposta usando un approccio più flessibile
            let allUsers = [];
            
            // Prova a estrarre gli utenti dai vari percorsi possibili
            if (response.data?.data?.users) {
                allUsers = response.data.data.users;
                console.log('Found users at path: response.data.data.users');
            } 
            else if (response.data?.data?.data?.users) {
                allUsers = response.data.data.data.users;
                console.log('Found users at path: response.data.data.data.users');
            }
            else if (Array.isArray(response.data?.data)) {
                allUsers = response.data.data;
                console.log('Using path: response.data.data (is array)');
            }
            else {
                // Cerca attraverso le proprietà per trovare un array che potrebbe contenere utenti
                const findUsersArray = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    
                    // Se è un array con la proprietà che ci aspettiamo da un utente, restituiscilo
                    if (Array.isArray(obj) && obj.length > 0 && obj[0].firstName && obj[0].email) {
                        return obj;
                    }
                    
                    // Altrimenti cerca ricorsivamente nelle proprietà
                    for (const key in obj) {
                        if (key === 'users' && Array.isArray(obj[key])) {
                            return obj[key];
                        }
                        const result = findUsersArray(obj[key]);
                        if (result) return result;
                    }
                    
                    return null;
                };
                
                const foundUsers = findUsersArray(response.data);
                if (foundUsers) {
                    allUsers = foundUsers;
                    console.log('Found users array through deep search with length:', foundUsers.length);
                } else {
                    console.error('Could not locate users array in response');
                }
            }
            
            if (!allUsers || allUsers.length === 0) {
                console.warn('No users found in response');
                setUsers([]);
                setFilteredUsers([]);
                setLoading(false);
                return;
            }
            
            console.log(`Found ${allUsers.length} total users`);
            console.log('Sample user data:', allUsers[0]);
            
            // 2. Ottieni la scuola per conoscere gli utenti già associati
            const schoolResponse = await axiosInstance.get(`/schools/${selectedSchoolId}`);
            
            console.log('School API response:', schoolResponse.data);
            
            if (!schoolResponse.data?.data?.school) {
                console.error('Invalid school response format:', schoolResponse.data);
                throw new Error('Impossibile trovare i dati della scuola');
            }
            
            // 3. Estrai gli ID degli utenti già associati
            const school = schoolResponse.data.data.school;
            const existingUserIds = [];
            
            // Aggiungi il manager se presente
            if (school.manager) {
                if (typeof school.manager === 'object' && school.manager._id) {
                    existingUserIds.push(school.manager._id);
                } else if (typeof school.manager === 'string') {
                    existingUserIds.push(school.manager);
                }
            }
            
            // Aggiungi gli utenti dalla lista users
            if (Array.isArray(school.users)) {
                school.users.forEach(userEntry => {
                    if (typeof userEntry.user === 'object' && userEntry.user._id) {
                        existingUserIds.push(userEntry.user._id);
                    } else if (typeof userEntry.user === 'string') {
                        existingUserIds.push(userEntry.user);
                    }
                });
            }
            
            console.log('Existing user IDs:', existingUserIds);
            
            // 4. Filtra gli utenti già associati
            const availableUsers = allUsers.filter(user => 
                !existingUserIds.includes(user._id)
            );
            
            console.log(`Filtered ${allUsers.length} users to ${availableUsers.length} available users`);
            
            setUsers(availableUsers);
            setFilteredUsers(availableUsers);
        } catch (error) {
            console.error('Error fetching available users:', error);
            setError(error.message || 'Errore nel caricamento degli utenti');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUser = (userId) => {
        console.log('Toggling user:', userId);
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleCheckboxChange = (event, userId) => {
        // Importante: stopPropagation per evitare che l'evento arrivi al ListItem
        event.stopPropagation();
        handleToggleUser(userId);
    };

    const handleSubmit = () => {
        if (selectedUsers.length > 0) {
            // Usa il ruolo originale dell'utente
            const usersWithRole = selectedUsers.map(userId => {
                const user = users.find(u => u._id === userId);
                return {
                    userId,
                    role: user.role // Usa il ruolo dell'utente esistente
                };
            });
            
            onSelectUsers(usersWithRole);
        }
        handleClose();
    };

    const handleClose = () => {
        setSelectedUsers([]);
        setSearchTerm('');
        onClose();
    };

    // Renderizza l'elenco di utenti
    const renderUsersList = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box py={2} textAlign="center">
                    <Typography color="error">{error}</Typography>
                    <Button sx={{ mt: 2 }} onClick={fetchAvailableUsers}>
                        Riprova
                    </Button>
                </Box>
            );
        }

        if (filteredUsers.length === 0) {
            return (
                <Box py={4} textAlign="center">
                    <Typography color="text.secondary">
                        {searchTerm ? 'Nessun utente trovato con questi criteri' : 'Nessun utente disponibile'}
                    </Typography>
                </Box>
            );
        }

        return (
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredUsers.map(user => {
                    const isSelected = selectedUsers.includes(user._id);
                    return (
                        <ListItem 
                            key={user._id}
                            sx={{ 
                                cursor: 'pointer',
                                bgcolor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent' 
                            }}
                            onClick={() => handleToggleUser(user._id)}
                        >
                            <ListItemAvatar>
                                <Avatar>
                                    <PersonIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                                primary={`${user.firstName} ${user.lastName}`}
                                secondary={user.email}
                            />
                            <Box mr={4}>
                                <Chip 
                                    label={user.role} 
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                            <Checkbox
                                edge="end"
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleCheckboxChange(e, user._id)}
                                inputProps={{ 'aria-labelledby': `checkbox-${user._id}` }}
                            />
                        </ListItem>
                    );
                })}
            </List>
        );
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Seleziona Utenti</Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <Box mb={2}>
                    <TextField
                        label="Cerca utenti"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
                
                {/* Sezione per visualizzare gli utenti selezionati */}
                {selectedUsers.length > 0 && (
                    <Box mb={2}>
                        <Typography variant="subtitle2" mb={1}>
                            Utenti selezionati: {selectedUsers.length}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {selectedUsers.map(userId => {
                                const user = users.find(u => u._id === userId);
                                return (
                                    <Chip
                                        key={userId}
                                        label={user ? `${user.firstName} ${user.lastName} (${user.role})` : userId}
                                        onDelete={() => handleToggleUser(userId)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                );
                            })}
                        </Box>
                        <Divider sx={{ my: 2 }} />
                    </Box>
                )}
                
                {renderUsersList()}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose}>Annulla</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={selectedUsers.length === 0}
                    color="primary"
                >
                    Associa {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserSelectionModal;