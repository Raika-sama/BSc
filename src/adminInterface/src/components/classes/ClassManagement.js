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
    handleApplyFilters,
    handleResetFilters 
}) => {
    return (
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <TextField
                label="Scuola"
                size="small"
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
            />
            <TextField
                label="Anno"
                size="small"
                select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                sx={{ minWidth: 100 }}
            >
                <MenuItem value="">Tutti</MenuItem>
                {[1, 2, 3].map((year) => (
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
                sx={{ width: 100 }}
            />
            <Button 
                variant="contained" 
                onClick={handleApplyFilters}
                startIcon={<FilterListIcon />}
            >
                Applica Filtri
            </Button>
            <Button
                variant="outlined"
                onClick={handleResetFilters}
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

    // Stati per i filtri
    const [schoolFilter, setSchoolFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
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
        setFilterModel({ items: newFilters });
    };

    const handleResetFilters = () => {
        setSchoolFilter('');
        setYearFilter('');
        setSectionFilter('');
        setFilterModel({ items: [] });
    };

    // Funzione per filtrare le classi
    const filterClasses = (classes) => {
        return classes.filter(classItem => {
            if (schoolFilter && !classItem.schoolName.toLowerCase().includes(schoolFilter.toLowerCase())) return false;
            if (yearFilter && classItem.year !== parseInt(yearFilter)) return false;
            if (sectionFilter && classItem.section !== sectionFilter.toUpperCase()) return false;
            return true;
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
            width: 200,
            flex: 1
        },
        { 
            field: 'year', 
            headerName: 'Anno', 
            width: 100,
            align: 'center',
            headerAlign: 'center'
        },
        { 
            field: 'section', 
            headerName: 'Sezione', 
            width: 100,
            align: 'center',
            headerAlign: 'center'
        },
        { 
            field: 'academicYear', 
            headerName: 'Anno Accademico', 
            width: 150,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'studentCount',
            headerName: 'Studenti',
            width: 130,
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
                                sx={{ minWidth: '80px' }}
                            />
                        ) : (
                            <Chip
                                label={`${count} studenti`}
                                color={count >= params.row.capacity ? 'error' : 'success'}
                                size="small"
                                sx={{ minWidth: '80px' }}
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
            width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={
                        <Tooltip title="Visualizza dettagli">
                            <VisibilityIcon />
                        </Tooltip>
                    }
                    label="Visualizza"
                    onClick={() => handleViewDetails(params.row)}
                />,
                <GridActionsCellItem
                    icon={
                        <Tooltip title="Gestione test">
                            <QuizIcon />
                        </Tooltip>
                    }
                    label="Test"
                    onClick={() => handleTestManagement(params.row)}
                />,
                <GridActionsCellItem
                    icon={
                        <Tooltip title="Elimina classe">
                            <DeleteIcon color="error" />
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
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3 }}>
                {isAdmin ? 'Gestione Classi (Admin)' : 'Gestione Classi'}
            </Typography>

            <Paper sx={{ 
                width: '100%', 
                mb: 2, 
                borderRadius: 2,
                boxShadow: 3
            }}>
                <FilterToolbar 
                    schoolFilter={schoolFilter}
                    setSchoolFilter={setSchoolFilter}
                    yearFilter={yearFilter}
                    setYearFilter={setYearFilter}
                    sectionFilter={sectionFilter}
                    setSectionFilter={setSectionFilter}
                    handleApplyFilters={handleApplyFilters}
                    handleResetFilters={handleResetFilters}
                />

                {isAdmin ? (
                    <Box sx={{ width: '100%', p: 2 }}>
                        <DataGrid
                            rows={filteredClasses}
                            columns={columns}
                            getRowId={(row) => row.classId}
                            pageSize={7}
                            rowsPerPageOptions={[7]}
                            autoHeight
                            disableSelectionOnClick
                            sx={{
                                '& .MuiDataGrid-cell:focus': {
                                    outline: 'none'
                                },
                                '& .MuiDataGrid-row:hover': {
                                    bgcolor: 'action.hover'
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
                                borderBottom: 1,
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                borderRadius: '8px 8px 0 0',
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

                        <Box sx={{ height: 500, width: '100%', p: 2 }}>
                            <DataGrid
                                rows={tabValue === 0 ? filteredMainTeacherClasses : filteredCoTeacherClasses}
                                columns={columns}
                                getRowId={(row) => row.classId}
                                pageSize={7}
                                rowsPerPageOptions={[7]}
                                disableSelectionOnClick
                                sx={{
                                    '& .MuiDataGrid-cell:focus': {
                                        outline: 'none'
                                    },
                                    '& .MuiDataGrid-row:hover': {
                                        bgcolor: 'action.hover'
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
                <DialogTitle>Conferma eliminazione</DialogTitle>
                <DialogContent>
                    {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
                    <Typography>
                        Sei sicuro di voler eliminare questa classe?
                        {selectedClass && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                {`${selectedClass.year}${selectedClass.section} - ${selectedClass.schoolName}`}
                            </Typography>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setOpenDeleteDialog(false)}
                        color="primary"
                    >
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
    );
};

export default ClassManagement;