// src/components/users/UserManagement.jsx
import React, { useState, useMemo, useCallback, userCounts } from 'react';
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
}, [page, pageSize, filters]); // Rimuovi getUsers dalle dipendenze

const debouncedFilters = useMemo(() => ({
    search: filters.search,
    role: filters.role,
    status: filters.status,
    sort: filters.sort
}), [filters.search, filters.role, filters.status, filters.sort]);

React.useEffect(() => {
    loadUsers();
}, [page, pageSize, debouncedFilters]); // Usa debouncedFilters invece di loadUsers

    const calculateTrendData = useCallback((roleFilter = null) => {
        try {
            if (!users?.length) return null;
    
            const filteredUsers = roleFilter 
                ? users.filter(u => u.role === roleFilter)
                : users;
    
            const groupedData = filteredUsers.reduce((acc, user) => {
                if (!user?.createdAt) return acc;
                
                const date = new Date(user.createdAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                acc[monthKey] = (acc[monthKey] || 0) + 1;
                return acc;
            }, {});
    
            const last6Months = Object.keys(groupedData)
                .sort()
                .slice(-6);
    
            return {
                labels: last6Months.map(date => {
                    const [year, month] = date.split('-');
                    return new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'short' });
                }),
                data: last6Months.map(month => groupedData[month] || 0)
            };
        } catch (error) {
            console.error('Error calculating trend data:', error);
            return null;
        }
    }, [users]);
    
    // Calcola il trend percentuale con gestione null-safe
    const calculateTrend = useCallback((roleFilter = null) => {
        try {
            if (!users?.length) return 0;
    
            const currentCount = roleFilter 
                ? users.filter(u => u.role === roleFilter)?.length ?? 0
                : users.length;
            
            const trendData = calculateTrendData(roleFilter);
            if (!trendData?.data?.length || trendData.data.length < 2) return 0;
    
            const previousCount = trendData.data[trendData.data.length - 2] || 0;
            if (previousCount === 0) return 0;
    
            return ((currentCount - previousCount) / previousCount * 100).toFixed(1);
        } catch (error) {
            console.error('Error calculating trend:', error);
            return 0;
        }
    }, [users, calculateTrendData]);

// Memorizza i conteggi filtrati con valori di default
const userCounts = useMemo(() => ({
    admin: users?.filter(u => u.role === 'admin')?.length ?? 0,
    teacher: users?.filter(u => u.role === 'teacher')?.length ?? 0,
    school_admin: users?.filter(u => u.role === 'school_admin')?.length ?? 0,
    total: totalUsers ?? 0
}), [users, totalUsers]);


const statsCards = useMemo(() => [
    {
        title: 'Utenti Totali',
        value: userCounts.total,
        icon: PersonIcon,
        color: 'primary',
        description: 'Numero totale degli utenti nel sistema'
    },
    {
        title: 'Amministratori',
        value: userCounts.admin,
        icon: AdminIcon,
        color: 'error',
        description: 'Amministratori di sistema'
    },
    {
        title: 'Docenti',
        value: userCounts.teacher,
        icon: TeacherIcon,
        color: 'success',
        description: 'Docenti registrati nel sistema'
    },
    {
        title: 'Admin Scuola',
        value: userCounts.school_admin,
        icon: SchoolIcon,
        color: 'secondary',
        description: 'Amministratori delle scuole'
    }
], [userCounts, calculateTrend, calculateTrendData]);

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

    const handleSearch = useCallback((value) => {
        setFilters(prev => ({ ...prev, search: value }));
    }, []);
    
    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

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
                                    onFiltersChange={handleFiltersChange}
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