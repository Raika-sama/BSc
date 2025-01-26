// src/components/UserManagement/UserManagement.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Paper,
    Grid,
    Typography,
    IconButton,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Avatar,
    TextField
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    FileDownload as FileDownloadIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import UserForm from './UserForm';
import ConfirmDialog from '../ConfirmDialog';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

// Componente StatCard ottimizzato con animazioni
const StatCard = ({ title, value, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <Card>
            <CardContent>
                <Typography color="textSecondary" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="h4" component="div" sx={{ color }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    </motion.div>
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
        deleteUser,
    } = useUser();
    const { showNotification } = useNotification();
    const [selectedUser, setSelectedUser] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [gridApi, setGridApi] = useState(null);
    const [gridColumnApi, setGridColumnApi] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            await getUsers();
        } catch (error) {
            showNotification('Errore nel caricamento degli utenti', 'error');
        }
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                await updateUser(selectedUser._id, userData);
                showNotification('Utente aggiornato con successo', 'success');
            } else {
                await createUser(userData);
                showNotification('Utente creato con successo', 'success');
            }
            handleCloseForm();
            loadUsers();
        } catch (error) {
            showNotification(
                error.response?.data?.message || 'Errore nel salvare l\'utente',
                'error'
            );
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteUser(selectedUser._id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            loadUsers();
            showNotification('Utente eliminato con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.message || 'Errore nell\'eliminazione dell\'utente',
                'error'
            );
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

    const handleExportData = () => {
        if (gridApi) {
            const params = {
                fileName: 'utenti_export.csv',
                suppressQuotes: false,
                columnSeparator: ',',
            };
            gridApi.exportDataAsCsv(params);
        }
    };

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearch(value);
        if (gridApi) {
            gridApi.setQuickFilter(value);
        }
    };

    const columnDefs = [
        {
            field: 'avatar',
            headerName: '',
            width: 80,
            cellRenderer: params => (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {params.data?.firstName?.[0] || 'U'}
                </Avatar>
            ),
            sortable: false,
            filter: false,
        },
        {
            field: 'firstName',
            headerName: 'Nome',
            flex: 1,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'lastName',
            headerName: 'Cognome',
            flex: 1,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 1.5,
            filter: 'agTextColumnFilter',
        },
        {
            field: 'role',
            headerName: 'Ruolo',
            flex: 1,
            cellRenderer: params => (
                <Chip
                    label={params.value === 'admin' ? 'Amministratore' : 'Insegnante'}
                    color={params.value === 'admin' ? 'primary' : 'default'}
                    size="small"
                />
            ),
            filter: 'agSetColumnFilter',
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            cellRenderer: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditUser(params.data)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(params.data)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            ),
            sortable: false,
            filter: false,
        },
    ];

    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
    };

    const onGridReady = (params) => {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
    };

    const statsCards = [
        { title: 'Utenti Totali', value: totalUsers || 0, color: 'primary.main' },
        { title: 'Amministratori', value: users?.filter(u => u?.role === 'admin')?.length || 0, color: 'secondary.main' },
        { title: 'Insegnanti', value: users?.filter(u => u?.role === 'teacher')?.length || 0, color: 'success.main' },
        { title: 'Utenti Attivi', value: users?.filter(u => u?.active)?.length || 0, color: 'info.main' },
    ];

    if (error) {
        return (
            <Typography color="error" align="center">{error}</Typography>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Typography variant="h4" component="h1">
                            Gestione Utenti
                        </Typography>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<FileDownloadIcon />}
                                onClick={handleExportData}
                                disabled={loading}
                            >
                                Esporta
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                onClick={() => setIsFormOpen(true)}
                                disabled={loading}
                            >
                                Nuovo Utente
                            </Button>
                        </Stack>
                    </motion.div>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {statsCards.map((card, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <StatCard {...card} />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Cerca utenti..."
                            value={search}
                            onChange={handleSearchChange}
                            disabled={loading}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                            }}
                        />
                    </Box>
                </motion.div>

                {/* Users Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Paper sx={{ width: '100%', height: 600 }}>
                        <div className="ag-theme-material" style={{ height: '100%', width: '100%' }}>
                            <AgGridReact
                                modules={[ClientSideRowModelModule]}
                                columnDefs={columnDefs}
                                rowData={users}
                                defaultColDef={defaultColDef}
                                pagination={true}
                                paginationPageSize={pageSize}
                                onGridReady={onGridReady}
                                rowSelection="multiple"
                                animateRows={true}
                                suppressCellFocus={true}
                                enableCellTextSelection={true}
                                suppressRowClickSelection={true}
                                rowHeight={60}
                                overlayLoadingTemplate={
                                    '<span class="ag-overlay-loading-center">Caricamento...</span>'
                                }
                                overlayNoRowsTemplate={
                                    '<span class="ag-overlay-no-rows-center">Nessun utente trovato</span>'
                                }
                            />
                        </div>
                    </Paper>
                </motion.div>

                {/* Dialogs */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <UserForm
                                open={isFormOpen}
                                onClose={handleCloseForm}
                                onSave={handleSaveUser}
                                initialData={selectedUser}
                                isLoading={loading}
                            />
                        </motion.div>
                    )}

                    {isDeleteDialogOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <ConfirmDialog
                                open={isDeleteDialogOpen}
                                onClose={() => setIsDeleteDialogOpen(false)}
                                onConfirm={handleDeleteConfirm}
                                title="Conferma eliminazione"
                                content={`Sei sicuro di voler eliminare l'utente ${selectedUser?.firstName} ${selectedUser?.lastName}?`}
                                isLoading={loading}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </motion.div>
    );
};

export default UserManagement;