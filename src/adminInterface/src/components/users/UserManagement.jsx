// src/components/users/UserManagement.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
    Box, 
    Button,
    IconButton,
    Tooltip,
    Typography,
    useTheme,
    alpha,
    Chip
} from '@mui/material';
import { 
    Visibility,
    Edit,
    Delete,
    Add as AddIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    SupervisorAccount as TeacherIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
import ListLayout from '../common/ListLayout';
import UserDetails from './details/UserDetails';
import UserForm from './UserForm';
import UsersFilters from './list/UsersFilters';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [pageSize, setPageSize] = useState(25);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: '',
        sort: '-createdAt'
    });

    const { users, loading, totalUsers, createUser, getUsers } = useUser();

    // Load users
    const loadUsers = useCallback(async () => {
        try {
            await getUsers({
                page: page + 1,
                limit: pageSize,
                ...filters
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }, [page, pageSize, filters, getUsers]);

    React.useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Stats cards configuration
// In UserManagement.jsx
const statsCards = useMemo(() => [
    {
        title: 'Utenti Totali',
        icon: <PersonIcon sx={{ fontSize: 24 }} />,
        centerContent: true,
        highlighted: true,
        content: (
            <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
            }}>
                {/* Colonna sinistra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Totale
                    </Typography>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            fontWeight: 600,
                            backgroundImage: theme => 
                                `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {totalUsers || 0}
                    </Typography>
                </Box>
                {/* Colonna destra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Attivi
                    </Typography>
                    <Chip 
                        label={`100%`}
                        color="primary"
                        size="small"
                        sx={{ height: 24 }}
                    />
                </Box>
            </Box>
        )
    },
    {
        title: 'Amministratori',
        icon: <AdminIcon sx={{ fontSize: 24 }} />,
        centerContent: true,
        content: (
            <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
            }}>
                {/* Colonna sinistra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Totale Admin
                    </Typography>
                    <Typography 
                        variant="h5" 
                        sx={{ fontWeight: 600, color: 'error.main' }}
                    >
                        {users?.filter(u => u.role === 'admin').length || 0}
                    </Typography>
                </Box>
                {/* Colonna destra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Percentuale
                    </Typography>
                    <Chip 
                        label={`${((users?.filter(u => u.role === 'admin').length || 0) / (totalUsers || 1) * 100).toFixed(1)}%`}
                        color="error"
                        size="small"
                        sx={{ height: 24 }}
                    />
                </Box>
            </Box>
        )
    },
    {
        title: 'Docenti',
        icon: <TeacherIcon sx={{ fontSize: 24 }} />,
        centerContent: true,
        content: (
            <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
            }}>
                {/* Colonna sinistra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Totale Docenti
                    </Typography>
                    <Typography 
                        variant="h5" 
                        sx={{ fontWeight: 600, color: 'success.main' }}
                    >
                        {users?.filter(u => u.role === 'teacher').length || 0}
                    </Typography>
                </Box>
                {/* Colonna destra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Percentuale
                    </Typography>
                    <Chip 
                        label={`${((users?.filter(u => u.role === 'teacher').length || 0) / (totalUsers || 1) * 100).toFixed(1)}%`}
                        color="success"
                        size="small"
                        sx={{ height: 24 }}
                    />
                </Box>
            </Box>
        )
    },
    {
        title: 'Admin Scuola',
        icon: <SchoolIcon sx={{ fontSize: 24 }} />,
        centerContent: true,
        content: (
            <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
            }}>
                {/* Colonna sinistra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Totale Admin Scuola
                    </Typography>
                    <Typography 
                        variant="h5" 
                        sx={{ fontWeight: 600, color: 'secondary.main' }}
                    >
                        {users?.filter(u => u.role === 'school_admin').length || 0}
                    </Typography>
                </Box>
                {/* Colonna destra */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Percentuale
                    </Typography>
                    <Chip 
                        label={`${((users?.filter(u => u.role === 'school_admin').length || 0) / (totalUsers || 1) * 100).toFixed(1)}%`}
                        color="secondary"
                        size="small"
                        sx={{ height: 24 }}
                    />
                </Box>
            </Box>
        )
    }
], [users, totalUsers, theme]);


    // Table columns configuration
    const columns = useMemo(() => [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            flex: 1,
            minWidth: 200,
            valueGetter: (params) => 
                `${params.row.firstName || ''} ${params.row.lastName || ''}`
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            flex: 1,
            minWidth: 200
        },
        {
            field: 'role',
            headerName: 'Ruolo',
            width: 150,
            renderCell: (params) => {
                const roleConfigs = {
                    admin: { icon: AdminIcon, label: 'Admin', color: 'error' },
                    teacher: { icon: TeacherIcon, label: 'Docente', color: 'primary' },
                    school_admin: { icon: SchoolIcon, label: 'Admin Scuola', color: 'secondary' }
                };

                const config = roleConfigs[params.value] || { 
                    icon: PersonIcon, 
                    label: params.value.charAt(0).toUpperCase() + params.value.slice(1), 
                    color: 'default' 
                };
                const Icon = config.icon;

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon sx={{ color: `${config.color}.main` }} />
                        <Typography color={`${config.color}.main`}>
                            {config.label}
                        </Typography>
                    </Box>
                );
            }
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
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Visualizza">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/users/${params.row._id}`)}
                            sx={{ color: 'primary.main' }}
                        >
                            <Visibility sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/users/${params.row._id}/edit`)}
                            sx={{ color: 'secondary.main' }}
                        >
                            <Edit sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(params.row)}
                            sx={{ color: 'error.main' }}
                        >
                            <Delete sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [navigate]);

    // Handlers
    const handleCreateUser = async (userData) => {
        try {
            await createUser(userData);
            setIsFormOpen(false);
            loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
    };

    const handleDeleteUser = (user) => {
        console.log('Delete user:', user);
        // Implementare logica eliminazione
    };

    // Breadcrumbs configuration
    const breadcrumbs = [
        { text: 'Dashboard', path: '/admin' },
        { text: 'Utenti', path: '/admin/users' }
    ];

    return (
        <ContentLayout
            title="Gestione Utenti"
            subtitle="Gestisci gli account e i permessi degli utenti"
            breadcrumbs={breadcrumbs}
            actions={
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsFormOpen(true)}
                    sx={{ borderRadius: 2 }}
                >
                    Nuovo Utente
                </Button>
            }
        >
            <Routes>
                <Route 
                    index 
                    element={
                        <ListLayout
                            statsCards={statsCards}
                            isFilterOpen={isFilterOpen}
                            filterComponent={
                                <UsersFilters
                                    filters={filters}
                                    onFiltersChange={setFilters}
                                />
                            }
                            rows={users || []}
                            columns={columns}
                            getRowId={(row) => row._id}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            loading={loading}
                            paginationMode="server"
                            rowCount={totalUsers}
                            page={page}
                            onPageChange={setPage}
                            onSearch={handleSearch}
                            onRefresh={loadUsers}
                            searchPlaceholder="Cerca utenti..."
                            emptyStateMessage="Nessun utente trovato"
                        />
                    } 
                />
                <Route path=":id" element={<UserDetails />} />
            </Routes>

            <UserForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleCreateUser}
                initialData={null}
                isLoading={false}
            />
        </ContentLayout>
    );
};

export default UserManagement;