// src/components/users/list/UsersList.jsx
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { 
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { motion } from 'framer-motion';
import { useUser } from '../../../context/UserContext';
import UsersFilters from './UsersFilters';
import UserQuickActions from './UserQuickActions';

const UsersList = () => {
    const navigate = useNavigate();
    const { users, loading, getUsers, totalUsers } = useUser();
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: '',
        sort: '-createdAt'
    });

    const handleViewDetails = (userId) => {
        navigate(`/admin/users/${userId}`);
    };


    const loadUsers = async () => {
        try {
            console.log('Loading users with params:', {
                page: page + 1,
                pageSize,
                filters
            });

            const result = await getUsers({
                page: page + 1,
                limit: pageSize,
                ...filters
            });

            console.log('Result from getUsers:', result);
        } catch (error) {
            console.error('Error in loadUsers:', error);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [page, pageSize, filters]);

    // Debug log per verificare i dati disponibili nel render
    console.log('Render state:', { users, totalUsers, loading });

    
    const columns = [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            flex: 1,
            valueGetter: (params) => 
                `${params.row.firstName} ${params.row.lastName}`
        },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'role',
            headerName: 'Ruolo',
            width: 130,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        color: params.value === 'admin' ? 'error.main' : 
                               params.value === 'manager' ? 'primary.main' : 
                               'text.secondary'
                    }}
                >
                    {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
                </Typography>
            )
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 130,
            renderCell: (params) => (
                <Box
                    sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: params.value === 'active' ? 'success.light' :
                                params.value === 'inactive' ? 'warning.light' :
                                'error.light',
                        color: params.value === 'active' ? 'success.dark' :
                                params.value === 'inactive' ? 'warning.dark' :
                                'error.dark'
                    }}
                >
                    {params.value === 'active' ? 'Attivo' :
                     params.value === 'inactive' ? 'Inattivo' :
                     'Sospeso'}
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton
                            onClick={() => handleViewDetails(params.row._id)}
                            size="small"
                            sx={{ mr: 1 }}
                        >
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box sx={{ height: 'calc(100vh - 100px)', p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Gestione Utenti
                </Typography>

                <Paper sx={{ height: '100%', p: 2 }}>
                    <UsersFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                    
                    <Box sx={{ height: 'calc(100% - 80px)', width: '100%' }}>
                        <DataGrid
                            rows={users || []}
                            columns={[
                                {
                                    field: 'fullName',
                                    headerName: 'Nome Completo',
                                    flex: 1,
                                    valueGetter: (params) => 
                                        `${params.row?.firstName || ''} ${params.row?.lastName || ''}`
                                },
                                { field: 'email', headerName: 'Email', flex: 1 },
                                {
                                    field: 'role',
                                    headerName: 'Ruolo',
                                    width: 130,
                                    renderCell: (params) => (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: params.value === 'admin' ? 'error.main' : 
                                                       params.value === 'manager' ? 'primary.main' : 
                                                       'text.secondary'
                                            }}
                                        >
                                            {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
                                        </Typography>
                                    )
                                },
                                {
                                    field: 'status',
                                    headerName: 'Stato',
                                    width: 130,
                                    renderCell: (params) => (
                                        <Box
                                            sx={{
                                                px: 2,
                                                py: 0.5,
                                                borderRadius: 1,
                                                bgcolor: params.value === 'active' ? 'success.light' :
                                                        params.value === 'inactive' ? 'warning.light' :
                                                        'error.light',
                                                color: params.value === 'active' ? 'success.dark' :
                                                        params.value === 'inactive' ? 'warning.dark' :
                                                        'error.dark'
                                            }}
                                        >
                                            {params.value === 'active' ? 'Attivo' :
                                             params.value === 'inactive' ? 'Inattivo' :
                                             'Sospeso'}
                                        </Box>
                                    )
                                },
                                {
                                    field: 'actions',
                                    headerName: 'Azioni',
                                    width: 150,
                                    sortable: false,
                                    renderCell: (params) => (
                                        <Box>
                                            <Tooltip title="Visualizza Dettagli">
                                                <IconButton
                                                    onClick={() => handleViewDetails(params.row._id)}
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )
                                }
                            ]}
                            pagination
                            pageSize={pageSize}
                            rowsPerPageOptions={[10, 25, 50]}
                            rowCount={totalUsers || 0}
                            paginationMode="server"
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            loading={loading}
                            getRowId={(row) => row._id}
                            disableSelectionOnClick
                        />
                    </Box>
                </Paper>
            </Box>
        </motion.div>
    );
};

export default UsersList;