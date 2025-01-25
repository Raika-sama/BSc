import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Chip,
    TextField,
    MenuItem,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QuizIcon from '@mui/icons-material/Quiz';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';

// Componente FilterToolbar separato
const FilterToolbar = ({ 
    schoolFilter, 
    setSchoolFilter, 
    yearFilter, 
    setYearFilter, 
    sectionFilter, 
    setSectionFilter,
    statusFilter,        // Nuovo
    setStatusFilter,     // Nuovo
    studentsFilter,      // Nuovo
    setStudentsFilter,   // Nuovo
    handleApplyFilters,
    handleResetFilters 
}) => {
    const smallButtonStyle = {
        padding: '4px 8px',
        fontSize: '0.8rem',
        minWidth: 'auto'
    };

    return (
        <Box sx={{ 
            p: 1, 
            display: 'flex', 
            gap: 1, 
            alignItems: 'center', 
            flexWrap: 'wrap',  // Permette il wrap su schermi piccoli
            borderBottom: 1, 
            borderColor: 'divider'
        }}>
            <TextField
                label="Scuola"
                size="small"
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
            />
            <TextField
                label="Anno"
                size="small"
                select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                sx={{ minWidth: '80px' }}
            >
                <MenuItem value="">Tutti</MenuItem>
                {[1, 2, 3, 4, 5].map((year) => (
                    <MenuItem key={year} value={year}>
                        {year}°
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                label="Sezione"
                size="small"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value.toUpperCase())}
                sx={{ width: '80px' }}
            />
            {/* Nuovo select per status */}
            <TextField
                label="Status"
                size="small"
                select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: '120px' }}
            >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="active">Attive</MenuItem>
                <MenuItem value="planned">Pianificate</MenuItem>
                <MenuItem value="archived">Archiviate</MenuItem>
            </TextField>
            {/* Nuovo select per filtro studenti */}
            <TextField
                label="Studenti"
                size="small"
                select
                value={studentsFilter}
                onChange={(e) => setStudentsFilter(e.target.value)}
                sx={{ minWidth: '150px' }}
            >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="with_students">Con studenti</MenuItem>
                <MenuItem value="without_students">Senza studenti</MenuItem>
                <MenuItem value="pending">In attesa (Pending)</MenuItem>
            </TextField>
            <Button 
                variant="contained" 
                onClick={handleApplyFilters}
                startIcon={<FilterListIcon sx={{ fontSize: '1rem' }} />}
                size="small"
                sx={smallButtonStyle}
            >
                Applica
            </Button>
            <Button
                variant="outlined"
                onClick={handleResetFilters}
                size="small"
                sx={smallButtonStyle}
            >
                Reset
            </Button>
        </Box>
    );
};


const ClassManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const { mainTeacherClasses = [], coTeacherClasses = [], loading, error, getMyClasses, deleteClass } = useClass();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [pageSize, setPageSize] = useState(25); // Aggiungi questo nuovo state

    // Stati per i filtri
    const [schoolFilter, setSchoolFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [studentsFilter, setStudentsFilter] = useState('');
    const [filterModel, setFilterModel] = useState({
        items: []
    });

    useEffect(() => {
        getMyClasses();
    }, []);

    // Funzioni di gestione filtri
    const handleApplyFilters = () => {
        const newFilters = [];
        if (schoolFilter) {
            newFilters.push({
                field: 'schoolName',
                operator: 'contains',
                value: schoolFilter
            });
        }
        if (yearFilter) {
            newFilters.push({
                field: 'year',
                operator: 'equals',
                value: yearFilter
            });
        }
        if (sectionFilter) {
            newFilters.push({
                field: 'section',
                operator: 'equals',
                value: sectionFilter
            });
        }
        if (statusFilter) {
            newFilters.push({
                field: 'status',
                operator: 'equals',
                value: statusFilter
            });
        }
        if (studentsFilter) {
            switch (studentsFilter) {
                case 'with_students':
                    newFilters.push({
                        field: 'students',
                        operator: 'isNotEmpty'
                    });
                    break;
                case 'without_students':
                    newFilters.push({
                        field: 'students',
                        operator: 'isEmpty'
                    });
                    break;
                case 'pending':
                    // Una classe è "pending" quando:
                    // 1. Ha almeno uno studente
                    // 2. Il numero di studenti è minore della capacità
                    newFilters.push({
                        field: 'students',
                        operator: 'custom',
                        value: (params) => {
                            const studentCount = params.value?.length || 0;
                            return studentCount > 0 && studentCount < params.row.capacity;
                        }
                    });
                    break;
            }
        }
        setFilterModel({ items: newFilters });
    };

    const handleResetFilters = () => {
        setSchoolFilter('');
        setYearFilter('');
        setSectionFilter('');
        setStatusFilter('');
        setStudentsFilter('');
        setFilterModel({ items: [] });
    };

    // Funzione per filtrare le classi
    const filterClasses = (classes) => {
        return classes.filter(classItem => {
            // Filtri base
            const matchesSchool = !schoolFilter || classItem.schoolName.toLowerCase().includes(schoolFilter.toLowerCase());
            const matchesYear = !yearFilter || classItem.year === parseInt(yearFilter);
            const matchesSection = !sectionFilter || classItem.section === sectionFilter.toUpperCase();
            const matchesStatus = !statusFilter || classItem.status === statusFilter;
    
            // Filtro studenti
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
                        // Una classe è pending se ha spazio per altri studenti
                        matchesStudentFilter = studentCount < capacity;
                        break;
                }
            }
    
            return matchesSchool && matchesYear && matchesSection && matchesStatus && matchesStudentFilter;
        });
    };

    // Handle functions
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

    // Preparazione delle classi filtrate
    const filteredMainTeacherClasses = filterClasses(mainTeacherClasses);
    const filteredCoTeacherClasses = filterClasses(coTeacherClasses);
    const filteredClasses = isAdmin ? filterClasses(mainTeacherClasses) : [];

    const columns = [
        { 
            field: 'schoolName', 
            headerName: 'Scuola', 
            flex: 1,
            minWidth: 180
        },
        { 
            field: 'year', 
            headerName: 'Anno', 
            width: 70,
            align: 'center',
            headerAlign: 'center'
        },
        { 
            field: 'section', 
            headerName: 'Sezione', 
            width: 80,
            align: 'center',
            headerAlign: 'center'
        },
        { 
            field: 'academicYear', 
            headerName: 'Anno Accademico', 
            width: 130,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'studentCount',
            headerName: 'Studenti',
            width: 110,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const count = params.row.students?.length || 0;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {count === 0 ? (
                            <Chip
                                label="Pending"
                                color="warning"
                                size="small"
                                sx={{ 
                                    minWidth: '70px',
                                    height: '24px',
                                    '& .MuiChip-label': {
                                        fontSize: '0.75rem'
                                    }
                                }}
                            />
                        ) : (
                            <Chip
                                label={`${count} studenti`}
                                color={count >= params.row.capacity ? 'error' : 'success'}
                                size="small"
                                sx={{ 
                                    minWidth: '70px',
                                    height: '24px',
                                    '& .MuiChip-label': {
                                        fontSize: '0.75rem'
                                    }
                                }}
                            />
                        )}
                    </Box>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Azioni',
            width: 120,
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
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} color="error" />
                        </Tooltip>
                    }
                    label="Elimina"
                    onClick={() => handleDeleteClick(params.row)}
                />
            ]
        }
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={30} /> {/* Ridotto dimensione */}
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 100px)' }}> {/* Aumentato spazio verticale */}
            <Typography 
                variant="h5" 
                gutterBottom 
                color="primary" 
                sx={{ 
                    mb: 2,
                    fontSize: '1.2rem'
                }}
            >
                {isAdmin ? 'Gestione Classi (Admin)' : 'Gestione Classi'}
            </Typography>

            <Paper sx={{ 
                width: '100%',
                height: 'calc(100% - 50px)', // Adatta l'altezza in base allo spazio disponibile 
                mb: 1, 
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column'
            }}>
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

                {isAdmin ? (
                    <Box sx={{
                        flexGrow: 1, 
                        width: '100%', 
                        height: 'calc(100% - 52px)', // Altezza calcolata sottraendo l'altezza della FilterToolbar
                        overflow: 'auto'
                    }}>
                        <DataGrid
                            rows={filteredClasses}
                            columns={columns}
                            getRowId={(row) => row.classId}
                            pageSize={pageSize}
                            rowsPerPageOptions={[25, 50, 100]}
                            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                            disableSelectionOnClick
                            density="compact"
                            sx={{
                                '& .MuiDataGrid-cell': {
                                    fontSize: '0.875rem',
                                    py: 0.5,
                                    borderColor: 'divider'
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                    fontSize: '0.875rem',
                                    minHeight: '45px !important',
                                    maxHeight: '45px !important',
                                    backgroundColor: '#f5f5f5',
                                    borderBottom: '2px solid #e0e0e0'
                                },
                                '& .MuiDataGrid-row': {
                                    minHeight: '40px !important', // Aumentato leggermente
                                    maxHeight: '40px !important',
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: '#fafafa'
                                    }
                                },
                                '& .MuiDataGrid-cell:focus': {
                                    outline: 'none'
                                },
                                '& .MuiDataGrid-row:hover': {
                                    bgcolor: 'action.hover'
                                },
                                border: 'none',
                                '& .MuiDataGrid-footerContainer': {
                                    borderTop: '2px solid #e0e0e0',
                                    backgroundColor: '#f5f5f5'
                                },
                                '& .MuiTablePagination-root': {
                                    fontSize: '0.875rem'
                                }
                            }}
                        />
                    </Box>
                ) : (
                    <>
                        <Tabs
                            value={tabValue}
                            onChange={(e, newValue) => setTabValue(newValue)}
                            sx={{
                                minHeight: '40px',
                                '& .MuiTab-root': {
                                    minHeight: '40px',
                                    fontSize: '0.875rem',
                                    padding: '6px 12px'
                                }
                            }}
                        >
                            <Tab 
                                label={`Le mie classi (${filteredMainTeacherClasses.length})`}
                                sx={{ textTransform: 'none' }}
                            />
                            <Tab 
                                label={`Classi co-insegnate (${filteredCoTeacherClasses.length})`}
                                sx={{ textTransform: 'none' }}
                            />
                        </Tabs>

                        <Box sx={{ 
                            width: '100%', 
                            p: 1,
                            height: '600px',
                            overflow: 'auto'
                        }}>
                            <DataGrid
                                rows={tabValue === 0 ? filteredMainTeacherClasses : filteredCoTeacherClasses}
                                columns={columns}
                                getRowId={(row) => row.classId}
                                pageSize={pageSize}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                                disableSelectionOnClick
                                density="compact"
                                sx={{
                                    '& .MuiDataGrid-cell': {
                                        fontSize: '0.875rem',
                                        py: 0.5
                                    },
                                    '& .MuiDataGrid-columnHeaders': {
                                        fontSize: '0.875rem',
                                        minHeight: '45px !important',
                                        maxHeight: '45px !important'
                                    },
                                    '& .MuiDataGrid-row': {
                                        minHeight: '35px !important',
                                        maxHeight: '35px !important'
                                    },
                                    '& .MuiDataGrid-cell:focus': {
                                        outline: 'none'
                                    },
                                    '& .MuiDataGrid-row:hover': {
                                        bgcolor: 'action.hover'
                                    },
                                    '& .MuiDataGrid-root': {
                                        border: 'none',
                                        overflowY: 'scroll',
                                        scrollbarWidth: 'thin',
                                        '&::-webkit-scrollbar': {
                                            width: '6px'
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: '#f1f1f1'
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#888',
                                            borderRadius: '3px'
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            background: '#555'
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </>
                )}
            </Paper>

            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle sx={{ fontSize: '1.1rem', py: 1.5 }}>
                    Conferma eliminazione
                </DialogTitle>
                <DialogContent>
                    {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
                    <Typography sx={{ fontSize: '0.9rem' }}>
                        Sei sicuro di voler eliminare questa classe?
                        {selectedClass && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
                                {`${selectedClass.year}${selectedClass.section} - ${selectedClass.schoolName}`}
                            </Typography>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setOpenDeleteDialog(false)}
                        color="primary"
                        size="small"
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        size="small"
                    >
                        Elimina
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClassManagement;