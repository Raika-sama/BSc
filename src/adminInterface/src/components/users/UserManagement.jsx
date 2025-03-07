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
    Chip,
    Alert,
    Snackbar
} from '@mui/material';
import { 
    Visibility,
    Edit,
    Delete,
    Add as AddIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    SupervisorAccount as TeacherIcon,
    School as SchoolIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
import ListLayout from '../common/ListLayout';
import UserDetails from './details/UserDetails';
import UserForm from './UserForm';
import UsersFilters from './list/UsersFilters';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import InactiveUsersToggle from './list/InactiveUsersToggle';

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
    // Add notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [allUsers, setAllUsers] = useState([]);
    const { users, loading, totalUsers, createUser, getUsers, deleteUser } = useUser();
    const [showInactive, setShowInactive] = useState(false);

    // Function to show notifications
    const showNotification = (message, severity = 'info') => {
        setNotification({
            open: true,
            message,
            severity
        });
    };

    // Handle closing notifications
    const handleCloseNotification = () => {
        setNotification(prev => ({
            ...prev,
            open: false
        }));
    };

    // Ref per prevenire la prima chiamata automatica
    const isInitialMount = useRef(true);
    // Ref per il debounce
    const debounceTimeout = useRef(null);

    // Funzione per caricare gli utenti
    const loadUsers = useCallback(async () => {
        try {
            // Rimuovi il filtro status, vogliamo sempre TUTTI gli utenti dal server
            const filterParams = {
                page: page + 1,
                limit: pageSize,
                ...filters
            };
            
            // Rimuovi lo status se presente
            if (filterParams.status) {
                delete filterParams.status;
            }
            
            console.log("Caricando utenti con parametri:", filterParams);
            
            // Chiamata API per ottenere tutti gli utenti
            const result = await getUsers(filterParams);
            
            // Memorizza TUTTI gli utenti ricevuti dal server
            if (result && result.users) {
                setAllUsers(result.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showNotification('Errore durante il caricamento degli utenti', 'error');
        }
    }, [page, pageSize, filters, getUsers, showNotification]);

    const filteredUsers = useMemo(() => {
        console.log("Filtrando utenti, showInactive:", showInactive, "utenti totali:", allUsers.length);
        
        // Se showInactive è true, mostra tutti gli utenti
        if (showInactive) {
            return allUsers;
        }
        
        // Altrimenti, filtra per mostrare solo gli utenti attivi
        return allUsers.filter(user => user.status === 'active');
    }, [allUsers, showInactive]);

const handleInactiveToggle = useCallback((value) => {
    console.log("Toggle chiamato con value:", value);
    
    // Imposta semplicemente lo stato e resetta la pagina
    // L'useEffect si occuperà del caricamento
    setShowInactive(value !== undefined ? value : prev => !prev);
    setPage(0); // Reset alla prima pagina
    
    // Non chiamare loadUsers() qui - lascia che sia l'useEffect a farlo
}, []);

    // Effect principale per il caricamento dati - fixing the infinite loop
    useEffect(() => {
        // Caricamento solo quando necessario
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadUsers(); 
            return;
        }
    
        // Gestione del debounce per le ricerche
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
    
        debounceTimeout.current = setTimeout(() => {
            loadUsers();
        }, 500);
    
        // Cleanup
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [page, pageSize, filters, showInactive]); // NON includere loadUsers qui
    
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
                // Verifica che params.value esista prima di accedere a charAt
                const role = params.value || '';
                
                const roleConfigs = {
                    admin: { icon: AdminIcon, label: 'Admin', color: 'error' },
                    teacher: { icon: TeacherIcon, label: 'Docente', color: 'primary' },
                    school_admin: { icon: SchoolIcon, label: 'Admin Scuola', color: 'secondary' }
                };

                const config = roleConfigs[role] || { 
                    icon: PersonIcon, 
                    label: role ? (role.charAt(0).toUpperCase() + role.slice(1)) : 'N/A', 
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
            showNotification('Utente creato con successo', 'success');
            loadUsers(); // Ricarica immediata dopo la creazione
        } catch (error) {
            console.error('Error creating user:', error);
            showNotification('Errore durante la creazione dell\'utente', 'error');
        }
    };

    const handleDeleteUser = async (user) => {
        // Chiedi conferma prima di procedere con l'eliminazione
        if (!window.confirm(`Sei sicuro di voler eliminare l'utente ${user.firstName} ${user.lastName}?`)) {
            return;
        }
    
        try {
            console.log('Avvio eliminazione utente:', user._id);
            
            if (typeof deleteUser === 'function') {
                await deleteUser(user._id);
                showNotification('Utente eliminato con successo', 'success');
                await loadUsers(); // Ricarica la lista dopo l'eliminazione
            } else {
                console.error('deleteUser function is not available');
                showNotification('Funzionalità non disponibile', 'warning');
            }
        } catch (error) {
            console.error('Errore durante l\'eliminazione dell\'utente:', error);
            showNotification(
                error.response?.data?.error?.message || 'Errore durante l\'eliminazione dell\'utente', 
                'error'
            );
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

    const toggleFilters = useCallback(() => {
        setIsFilterOpen(prev => !prev);
    }, []);

    const customActions = (
        <InactiveUsersToggle 
            showInactive={showInactive} 
            onChange={handleInactiveToggle} 
        />
    );

    const handleRowClick = (params) => {
        navigate(`/admin/users/${params.row._id}`);
    };


    // Configurazione breadcrumbs
    const breadcrumbs = [
        { text: 'Dashboard', path: '/admin' },
        { text: 'Utenti', path: '/admin/users' }
    ];

    return (
        <>
            <ContentLayout
                title="Gestione Utenti"
                subtitle="Gestisci gli account e i permessi degli utenti"
                //breadcrumbs={breadcrumbs}
                actions={
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Tooltip title="Filtri">
                            <IconButton 
                                onClick={toggleFilters}
                                color="primary"
                            >
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setIsFormOpen(true)}
                            sx={{ borderRadius: 2 }}
                        >
                            Nuovo Utente
                        </Button>
                    </Box>
                }
            >
                <Routes>
                    <Route 
                        index 
                        element={
                            <ListLayout
                                statsCards={statsCards}
                                isFilterOpen={isFilterOpen}
                                onToggleFilters={toggleFilters}
                                filterComponent={
                                    <UsersFilters
                                        filters={filters}
                                        onFiltersChange={handleFiltersChange}
                                    />
                                }
                                rows={filteredUsers || []} // CAMBIA DA users A filteredUsers
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
                                customActions={customActions}
                                onRowClick={handleRowClick} // Aggiungiamo l'handler

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

                {/* Add notification component */}
                <Snackbar 
                    open={notification.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseNotification}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert 
                        onClose={handleCloseNotification} 
                        severity={notification.severity} 
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            </ContentLayout>
        </>
    );
};

export default UserManagement;