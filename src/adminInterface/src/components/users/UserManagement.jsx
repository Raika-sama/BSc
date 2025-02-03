// src/components/users/UserManagement.jsx
import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
    Box, 
    Button,
    IconButton,
    Tooltip,
    Typography,
    alpha
} from '@mui/material';
import { 
    Visibility,
    Edit,
    Delete,
    
    Add as AddIcon,
    FilterList as FilterListIcon,
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

    const { 
        users, 
        loading, 
        totalUsers, 
        createUser, 
        getUsers 
    } = useUser();

    const loadUsers = async () => {
        try {
            await getUsers({
                page: page + 1,
                limit: pageSize,
                ...filters
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    React.useEffect(() => {
        loadUsers();
    }, [page, pageSize, filters]);

    const handleOpenForm = () => setIsFormOpen(true);
    const handleCloseForm = () => setIsFormOpen(false);

    const handleCreateUser = async (userData) => {
        try {
            await createUser(userData);
            handleCloseForm();
            loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    const handleViewDetails = (userId) => {
        navigate(`/admin/users/${userId}`);
    };

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
        // Aggiungiamo la colonna delle azioni
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/users/${params.row._id}`)}
                            sx={{ 
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: alpha('#1976d2', 0.08)
                                }
                            }}
                        >
                            <Visibility sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/users/${params.row._id}/edit`)}
                            sx={{ 
                                color: 'secondary.main',
                                '&:hover': {
                                    bgcolor: alpha('#9c27b0', 0.08)
                                }
                            }}
                        >
                            <Edit sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(params.row)}
                            sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                    bgcolor: alpha('#d32f2f', 0.08)
                                }
                            }}
                        >
                            <Delete sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [navigate]);
// Aggiungiamo la funzione per gestire l'eliminazione
const handleDeleteUser = (user) => {
    // Implementare la logica di eliminazione
    // Potrebbe aprire un dialog di conferma
    console.log('Delete user:', user);
};

    const statsCards = [
        {
            title: 'Utenti Totali',
            value: totalUsers || 0,
            icon: <PersonIcon />,
            color: 'primary.main'
        },
        {
            title: 'Amministratori',
            value: users?.filter(u => u.role === 'admin').length || 0,
            icon: <AdminIcon />,
            color: 'error.main'
        },
        {
            title: 'Docenti',
            value: users?.filter(u => u.role === 'teacher').length || 0,
            icon: <TeacherIcon />,
            color: 'success.main'
        },
        {
            title: 'Admin Scuola',
            value: users?.filter(u => u.role === 'school_admin').length || 0,
            icon: <SchoolIcon />,
            color: 'secondary.main'
        }
    ];

    return (
        <ContentLayout
            title="Gestione Utenti"
            subtitle="Gestisci gli account e i permessi degli utenti"
            actions={
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Filtri">
                        <IconButton 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            color="primary"
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenForm}
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
                        />
                    } 
                />
                <Route path=":id" element={<UserDetails />} />
            </Routes>

            <UserForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleCreateUser}
                initialData={null}
                isLoading={false}
            />
        </ContentLayout>
    );
};

export default UserManagement;