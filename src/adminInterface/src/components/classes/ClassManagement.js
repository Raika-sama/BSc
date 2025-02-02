// src/components/ClassManagement/ClassManagement.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Chip,
    Tooltip,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { 
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Quiz as QuizIcon,
    School as SchoolIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StatCards } from './classcomponents/StatCards';
import { FilterToolbar } from './classcomponents/FilterToolbar';

const ClassManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const { mainTeacherClasses = [], coTeacherClasses = [], loading, error, getMyClasses, deleteClass } = useClass();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [pageSize, setPageSize] = useState(25);

    // Stati per i filtri
    const [schoolFilter, setSchoolFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [studentsFilter, setStudentsFilter] = useState('');

    useEffect(() => {
        console.log('ClassManagement: Inizializzazione');
        getMyClasses().catch(error => {
            console.error('ClassManagement: Errore nel caricamento classi:', error);
        });
    }, []);

    const handleApplyFilters = () => {
        // La logica dei filtri rimane la stessa
        const filtered = filterClasses(isAdmin ? mainTeacherClasses : 
            tabValue === 0 ? mainTeacherClasses : coTeacherClasses);
        return filtered;
    };

    const handleResetFilters = () => {
        setSchoolFilter('');
        setYearFilter('');
        setSectionFilter('');
        setStatusFilter('');
        setStudentsFilter('');
    };

    const filterClasses = (classes) => {
        return classes.filter(classItem => {
            const matchesSchool = !schoolFilter || 
                classItem.schoolName.toLowerCase().includes(schoolFilter.toLowerCase());
            const matchesYear = !yearFilter || classItem.year === parseInt(yearFilter);
            const matchesSection = !sectionFilter || 
                classItem.section === sectionFilter.toUpperCase();
            const matchesStatus = !statusFilter || classItem.status === statusFilter;

            let matchesStudentFilter = true;
            if (studentsFilter) {
                const studentCount = classItem.students?.length || 0;
                const capacity = classItem.capacity || 0;

                switch (studentsFilter) {
                    case 'with_students':
                        matchesStudentFilter = studentCount > 0;
                        break;
                    case 'without_students':
                        matchesStudentFilter = studentCount === 0;
                        break;
                    case 'pending':
                        matchesStudentFilter = studentCount < capacity;
                        break;
                }
            }

            return matchesSchool && matchesYear && matchesSection && 
                   matchesStatus && matchesStudentFilter;
        });
    };

    const columns = [
        {
            field: 'schoolName',
            headerName: 'Scuola',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            )
        },
        {
            field: 'year',
            headerName: 'Anno',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Chip
                    label={`${params.value}°`}
                    color="primary"
                    size="small"
                    sx={{
                        minWidth: '50px',
                        height: '24px',
                        backgroundColor: (theme) => theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-label': {
                            fontSize: '0.875rem',
                            px: 1
                        }
                    }}
                />
            )
        },
        {
            field: 'section',
            headerName: 'Sezione',
            width: 90,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color="secondary"
                    size="small"
                    sx={{
                        minWidth: '50px',
                        height: '24px',
                        backgroundColor: (theme) => theme.palette.secondary.main,
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-label': {
                            fontSize: '0.875rem',
                            px: 1
                        }
                    }}
                />
            )
        },
        {
            field: 'academicYear',
            headerName: 'Anno Accademico',
            width: 130,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const status = params.value;
                let chipColor;
                let label;
                
                switch (status) {
                    case 'active':
                        chipColor = 'success';
                        label = 'Attiva';
                        break;
                    case 'planned':
                        chipColor = 'info';
                        label = 'Pianificata';
                        break;
                    case 'archived':
                        chipColor = 'default';
                        label = 'Archiviata';
                        break;
                    default:
                        chipColor = 'default';
                        label = status;
                }
                
                return (
                    <Chip
                        label={label}
                        color={chipColor}
                        size="small"
                        sx={{
                            minWidth: '90px',
                            height: '24px',
                            '& .MuiChip-label': {
                                fontSize: '0.75rem'
                            }
                        }}
                    />
                );
            }
        },
        {
            field: 'isActive',
            headerName: 'Attiva',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                return (
                    <Chip
                        label={params.value ? 'Sì' : 'No'}
                        color={params.value ? 'success' : 'error'}
                        size="small"
                        sx={{
                            minWidth: '60px',
                            height: '24px',
                            '& .MuiChip-label': {
                                fontSize: '0.75rem'
                            }
                        }}
                    />
                );
            }
        },
        {
            field: 'studentCount',
            headerName: 'Studenti',
            width: 150,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const count = params.row.students?.length || 0;
                const capacity = params.row.capacity || 0;
                const isFull = count >= capacity;
                const isPending = count > 0 && count < capacity;
                const isEmpty = count === 0;

                return (
                    <Tooltip title={`${count}/${capacity} studenti`}>
                        <Chip
                            icon={isEmpty ? 
                                <WarningIcon sx={{ fontSize: '1rem !important' }} /> :
                                isFull ? 
                                <CheckCircleIcon sx={{ fontSize: '1rem !important' }} /> :
                                <WarningIcon sx={{ fontSize: '1rem !important' }} />
                            }
                            label={isEmpty ? 'Vuota' : 
                                   isFull ? 'Completa' : 
                                   `${count}/${capacity}`}
                            color={isEmpty ? 'warning' : 
                                   isFull ? 'success' : 
                                   'primary'}
                            size="small"
                            sx={{
                                minWidth: '90px',
                                height: '24px',
                                '& .MuiChip-label': {
                                    fontSize: '0.75rem',
                                    px: 1
                                }
                            }}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Azioni',
            width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={
                        <Tooltip title="Visualizza dettagli">
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </Tooltip>
                    }
                    label="Visualizza"
                    onClick={() => handleViewDetails(params.row)}
                />,
                <GridActionsCellItem
                    icon={
                        <Tooltip title="Gestione test">
                            <QuizIcon sx={{ fontSize: '1.1rem' }} />
                        </Tooltip>
                    }
                    label="Test"
                    onClick={() => handleTestManagement(params.row)}
                />,
                <GridActionsCellItem
                    icon={
                        <Tooltip title="Elimina classe">
                            <DeleteIcon sx={{ fontSize: '1.1rem', color: 'error.main' }} />
                        </Tooltip>
                    }
                    label="Elimina"
                    onClick={() => handleDeleteClick(params.row)}
                />
            ]
        }
    ];

    const handleDeleteClick = (classData) => {
        setSelectedClass(classData);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteClass(selectedClass.classId);
            setOpenDeleteDialog(false);
            setSelectedClass(null);
            getMyClasses();
        } catch (err) {
            setDeleteError('Errore durante l\'eliminazione della classe');
        }
    };

    const handleViewDetails = (classData) => {
        navigate(`/admin/classes/${classData.classId}`);
    };

    const handleTestManagement = (classData) => {
        navigate(`/admin/classes/${classData.classId}/tests`);
    };

    const filteredMainTeacherClasses = filterClasses(mainTeacherClasses);
    const filteredCoTeacherClasses = filterClasses(coTeacherClasses);
    const currentClasses = isAdmin ? filteredMainTeacherClasses : 
        (tabValue === 0 ? filteredMainTeacherClasses : filteredCoTeacherClasses);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={30} />
            </Box>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box sx={{ p: 3, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                {/* Header con titolo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Typography
                        variant="h5"
                        color="primary"
                        sx={{
                            mb: 3,
                            fontSize: '1.2rem',
                            fontWeight: 600
                        }}
                    >
                        {isAdmin ? 'Gestione Classi (Admin)' : 'Gestione Classi'}
                    </Typography>
                </motion.div>

                {/* Stat Cards */}
                <StatCards classes={currentClasses} />

                {/* Main Content */}
                <Paper sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: theme => theme.shadows[3]
                }}>
                    {/* Toolbar Filtri */}
                    <FilterToolbar
                        schoolFilter={schoolFilter}
                        setSchoolFilter={setSchoolFilter}
                        yearFilter={yearFilter}
                        setYearFilter={setYearFilter}
                        sectionFilter={sectionFilter}
                        setSectionFilter={setSectionFilter}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        studentsFilter={studentsFilter}
                        setStudentsFilter={setStudentsFilter}
                        handleApplyFilters={handleApplyFilters}
                        handleResetFilters={handleResetFilters}
                    />

                    {/* Tabs e Grid */}
                    {!isAdmin && (
                        <Tabs
                            value={tabValue}
                            onChange={(e, newValue) => setTabValue(newValue)}
                            sx={{
                                minHeight: '40px',
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTab-root': {
                                    minHeight: '40px',
                                    fontSize: '0.875rem',
                                    textTransform: 'none'
                                }
                            }}
                        >
                            <Tab label={`Le mie classi (${filteredMainTeacherClasses.length})`} />
                            <Tab label={`Classi co-insegnate (${filteredCoTeacherClasses.length})`} />
                        </Tabs>
                    )}

                    {/* DataGrid */}
                    <Box sx={{ flex: 1, minHeight: 0 }}>
                        <DataGrid
                            rows={currentClasses}
                            columns={columns}
                            getRowId={(row) => row.classId}
                            pageSize={pageSize}
                            rowsPerPageOptions={[25, 50, 100]}
                            onPageSizeChange={setPageSize}
                            disableSelectionOnClick
                            density="compact"
                            sx={{
                                border: 'none',
                                '& .MuiDataGrid-cell': {
                                    fontSize: '0.875rem',
                                    py: 1
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: 'background.default',
                                    borderBottom: 2,
                                    borderColor: 'divider'
                                },
                                '& .MuiDataGrid-row': {
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }
                            }}
                        />
                    </Box>
                </Paper>

                {/* Delete Dialog */}
                <Dialog
                    open={openDeleteDialog}
                    onClose={() => setOpenDeleteDialog(false)}
                    TransitionComponent={motion.div}
                >
                    <DialogTitle>Conferma eliminazione</DialogTitle>
                    <DialogContent>
                        {deleteError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {deleteError}
                            </Alert>
                        )}
                        <Typography>
                            Sei sicuro di voler eliminare questa classe?
                            {selectedClass && (
                                <Typography color="textSecondary" sx={{ mt: 1 }}>
                                    {`${selectedClass.year}${selectedClass.section} - ${selectedClass.schoolName}`}
                                </Typography>
                            )}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteDialog(false)}>
                            Annulla
                        </Button>
                        <Button 
                            onClick={handleDeleteConfirm}
                            color="error"
                            variant="contained"
                        >
                            Elimina
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </motion.div>
    );
};

export default ClassManagement;