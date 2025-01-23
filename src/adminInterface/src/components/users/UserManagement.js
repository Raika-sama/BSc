import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Grid,
    Container,
    Typography,
    IconButton,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import SearchInput from '../common/SearchInput';
import UserForm from './UserForm';
import ConfirmDialog from '../ConfirmDialog';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

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
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, [page, search]);

    const loadUsers = async () => {
        try {
            await getUsers(page + 1, pageSize, search);
        } catch (error) {
            showNotification('Errore nel caricamento degli utenti', 'error');
        }
    };

    const handleSaveUser = async (userData) => {
        try {
            let updatedUser;
            if (selectedUser) {
                updatedUser = await updateUser(selectedUser._id, {
                    ...userData,
                    _id: selectedUser._id // Manteniamo l'_id originale
                });
            } else {
                updatedUser = await createUser(userData);
            }
            handleCloseForm();
            // Aggiorniamo immediatamente la grid con i dati corretti
            await loadUsers();
        } catch (error) {
            showNotification(error.response?.data?.error?.message || 'Errore nel salvare l\'utente', 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteUser(selectedUser._id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            loadUsers();
        } catch (error) {
            showNotification(error.response?.data?.error?.message || 'Errore nell\'eliminazione dell\'utente', 'error');
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

    const columns = [
        {
            field: 'avatar',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Box className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {params.row?.firstName?.[0] || 'U'}
                </Box>
            )
        },
        {
            field: 'firstName',
            headerName: 'Nome',
            width: 130
        },
        {
            field: 'lastName',
            headerName: 'Cognome',
            width: 130
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 220
        },
        {
            field: 'role',
            headerName: 'Ruolo',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value === 'admin' ? 'Amministratore' : 'Insegnante'}
                    color={params.value === 'admin' ? 'primary' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditUser(params.row)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(params.row)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const statsCards = [
        { title: 'Utenti Totali', value: totalUsers || 0, color: 'primary.main' },
        { title: 'Amministratori', value: users?.filter(u => u?.role === 'admin')?.length || 0, color: 'secondary.main' },
        { title: 'Insegnanti', value: users?.filter(u => u?.role === 'teacher')?.length || 0, color: 'success.main' },
        { title: 'Utenti Attivi', value: users?.filter(u => u?.active)?.length || 0, color: 'info.main' }
    ];

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography color="error" align="center">{error}</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestione Utenti
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setIsFormOpen(true)}
                        disabled={loading}
                    >
                        Nuovo Utente
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                    >
                        Esporta
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {statsCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    {card.title}
                                </Typography>
                                <Typography variant="h4" component="div" color={card.color}>
                                    {card.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Search */}
            <Box sx={{ mb: 3 }}>
                <SearchInput 
                    value={search}
                    onChange={setSearch}
                    disabled={loading}
                    placeholder="Cerca utenti..."
                />
            </Box>

            {/* Users Grid */}
            <Paper>
                <DataGrid
                    rows={Array.isArray(users) ? users
                        .filter(user => user && user._id) // Filtriamo le righe senza id
                        .map(user => ({
                            id: user._id,
                            _id: user._id,
                            firstName: user?.firstName || '',
                            lastName: user?.lastName || '',
                            email: user?.email || '',
                            role: user?.role || '',
                            active: user?.active || false
                        })) : []}
                    columns={columns}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    rowsPerPageOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    autoHeight
                    loading={loading || !Array.isArray(users)}
                    page={page}
                    onPageChange={(newPage) => setPage(newPage)}
                    rowCount={totalUsers || 0}
                    paginationMode="server"
                    className="h-96"
                />
            </Paper>

            {/* Forms and Dialogs */}
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