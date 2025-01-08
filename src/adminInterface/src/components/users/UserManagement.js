// src/components/users/UserManagement.js
import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Paper, 
    Button, 
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Box,
    CircularProgress,
    Pagination // Aggiunto per la paginazione
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import SearchInput from '../common/SearchInput'; // Assumo che esista questo componente
import UserForm from './UserForm';
import ConfirmDialog from '../ConfirmDialog';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

const UserManagement = () => {
    const { 
        users, 
        loading, 
        error,
        totalUsers, 
        getUsers, 
        createUser, 
        updateUser, 
        deleteUser 
    } = useUser();
    const { showNotification } = useNotification();
    const [selectedUser, setSelectedUser] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        loadUsers();
    }, [page, search]); // Ricarica quando cambiano pagina o ricerca

    const loadUsers = async () => {
        try {
            await getUsers(page, ITEMS_PER_PAGE, search);
        } catch (error) {
            showNotification(
                'Errore nel caricamento degli utenti',
                'error'
            );
        }
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                await updateUser(selectedUser._id, userData);
            } else {
                await createUser(userData);
            }
            handleCloseForm();
            loadUsers(); // Ricarica la lista dopo il salvataggio
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel salvare l\'utente';
            showNotification(errorMessage, 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteUser(selectedUser._id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            loadUsers(); // Ricarica la lista dopo l'eliminazione
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'eliminazione dell\'utente';
            showNotification(errorMessage, 'error');
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedUser(null);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1); // Resetta la pagina quando cambia la ricerca
    };

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography color="error" align="center">
                    {error}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestione Utenti
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setIsFormOpen(true)}
                    disabled={loading}
                >
                    Nuovo Utente
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <SearchInput 
                    value={search}
                    onChange={handleSearchChange}
                    disabled={loading}
                    placeholder="Cerca utenti..."
                />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Cognome</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Ruolo</TableCell>
                            <TableCell align="right">Azioni</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Nessun utente trovato
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.firstName}</TableCell>
                                    <TableCell>{user.lastName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.role === 'admin' ? 'Amministratore' : 'Insegnante'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            onClick={() => handleEditUser(user)}
                                            disabled={loading}
                                            color="primary"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleDeleteClick(user)}
                                            disabled={loading}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {!loading && totalUsers > ITEMS_PER_PAGE && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination 
                        count={Math.ceil(totalUsers / ITEMS_PER_PAGE)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}

            <UserForm 
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSaveUser}
                initialData={selectedUser}
                isLoading={loading}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Conferma eliminazione"
                content={`Sei sicuro di voler eliminare l'utente ${selectedUser?.firstName} ${selectedUser?.lastName}?`}
                isLoading={loading}
            />
        </Container>
    );
};

export default UserManagement;