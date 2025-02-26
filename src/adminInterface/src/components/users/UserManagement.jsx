// src/components/users/UserManagement.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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


    // Ref per prevenire la prima chiamata automatica
    const isInitialMount = useRef(true);
    // Ref per il debounce
    const debounceTimeout = useRef(null);

    // Funzione per caricare gli utenti
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

    // Effect principale per il caricamento dati
    useEffect(() => {
        // Salta la prima chiamata automatica
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadUsers(); // Caricamento iniziale
            return;
        }

        // Gestione del debounce per le ricerche
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        // Applica il debounce solo per le ricerche testuali
        if (filters.search) {
            debounceTimeout.current = setTimeout(loadUsers, 500);
        } else {
            loadUsers();
        }

        // Cleanup
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [loadUsers]);

    // Calcolo dei dati per i trend
    const calculateTrendData = useCallback((roleFilter = null) => {
        if (!users?.length) return null;

        const filteredUsers = roleFilter 
            ? users.filter(u => u && u.role === roleFilter)
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
    }, [users]);

    // Calcolo del trend percentuale
    const calculateTrend = useCallback((roleFilter = null) => {
        try {
            if (!users?.length) return 0;

            const currentCount = roleFilter 
                ? users.filter(u => u && u.role === roleFilter)?.length ?? 0
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

    // Memorizzazione dei conteggi degli utenti
    const userCounts = useMemo(() => ({
        admin: users?.filter(u => u && u.role === 'admin')?.length ?? 0,
        teacher: users?.filter(u => u && u.role === 'teacher')?.length ?? 0,
        school_admin: users?.filter(u => u && u.role === 'school_admin')?.length ?? 0,
        total: totalUsers ?? 0
    }), [users, totalUsers]);

    // Configurazione delle card statistiche
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
    ], [userCounts]);

    // Configurazione delle colonne della tabella
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
            await loadUsers(false); // Ricarica immediata dopo la creazione
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    // Handler per la ricerca con debounce incorporato
    const handleSearch = useCallback((value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPage(0); // Reset pagina quando cambia la ricerca
    }, []);

    // Handler per i filtri
    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(0); // Reset pagina quando cambiano i filtri
    }, []);

    // Handler per il cambio pagina
    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
    }, []);

    // Handler per il cambio dimensione pagina
    const handlePageSizeChange = useCallback((newPageSize) => {
        setPageSize(newPageSize);
        setPage(0); // Reset alla prima pagina quando cambia la dimensione
    }, []);


    // Configurazione breadcrumbs
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
                            getRowId={(row) => row?._id || Math.random().toString()}
                            pageSize={pageSize}
                            onPageSizeChange={handlePageSizeChange}
                            loading={loading}
                            paginationMode="server"
                            rowCount={totalUsers}
                            page={page}
                            onPageChange={handlePageChange}
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