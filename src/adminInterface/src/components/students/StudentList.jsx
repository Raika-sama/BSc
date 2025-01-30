import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    alpha
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    CloudUpload as CloudUploadIcon,
    School as SchoolIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    HourglassEmpty as PendingIcon,
    Block as BlockIcon
} from '@mui/icons-material';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';
import { StatCards } from './StatCards';
import { FilterToolbar } from './FilterToolbar';
import StudentBulkImportForm from './StudentBulkImportForm';

const StudentList = () => {
    const navigate = useNavigate();
    const {
        students,
        loading,
        error,
        totalStudents,
        fetchStudents,
        deleteStudent
    } = useStudent();
    const { showNotification } = useNotification();

    // Stati essenziali
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [importFormOpen, setImportFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(0);

    // Filtri
    const [schoolFilter, setSchoolFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [specialNeedsFilter, setSpecialNeedsFilter] = useState('');

    // Caricamento dati
    const loadStudents = async () => {
        try {
            const filters = {
                page: page + 1,
                limit: pageSize,
                search: searchTerm.trim(),
                schoolId: schoolFilter,
                status: statusFilter,
            };

            // Aggiungi specialNeeds al filtro solo se è stato effettivamente selezionato
            if (specialNeedsFilter !== '') {  // o null, dipende dal valore iniziale che usi
                filters.specialNeeds = specialNeedsFilter === 'true';
            }

            if (classFilter) {
                const year = parseInt(classFilter.match(/^\d+/)[0]);
                const section = classFilter.slice(year.toString().length);
                filters.year = year;
                filters.section = section;
            }

            await fetchStudents(filters);
        } catch (error) {
            showNotification('Errore nel caricamento degli studenti', 'error');
        }
    };

    useEffect(() => {
        loadStudents();
    }, [page, pageSize]);

    // Handlers
    const handleSearch = () => {
        setPage(0);
        loadStudents();
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSchoolFilter('');
        setClassFilter('');
        setStatusFilter('');
        setSpecialNeedsFilter('');
        setPage(0);
        loadStudents();
    };

    const handleDeleteClick = (student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteStudent(selectedStudent._id);
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
            showNotification('Studente eliminato con successo', 'success');
            loadStudents();
        } catch (error) {
            showNotification('Errore durante l\'eliminazione dello studente', 'error');
        }
    };

    // Configurazione colonne
    const columns = useMemo(() => [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            width: 200,
            valueGetter: (params) => 
                `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim()
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200
        },
        {
            field: 'schoolName',
            headerName: 'Scuola',
            width: 250,
            valueGetter: (params) => params.row.schoolId?.name || 'N/D'
        },
        {
            field: 'className',
            headerName: 'Classe',
            width: 120,
            renderCell: (params) => {
                const classInfo = params.row.classId;
                return classInfo ? (
                    <Chip
                        label={`${classInfo.year}${classInfo.section}`}
                        size="small"
                        sx={{
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText'
                        }}
                    />
                ) : 'N/D';
            }
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 130,
            renderCell: (params) => {
                const status = params.value || 'pending';
                const configs = {
                    active: { icon: CheckCircleIcon, label: 'Attivo', color: '#2e7d32' },
                    pending: { icon: PendingIcon, label: 'In Attesa', color: '#ed6c02' },
                    inactive: { icon: BlockIcon, label: 'Inattivo', color: '#d32f2f' }
                };
                const config = configs[status] || configs.pending;
                const Icon = config.icon;
                
                return (
                    <Chip
                        icon={<Icon sx={{ fontSize: '1rem' }} />}
                        label={config.label}
                        size="small"
                        sx={{ color: config.color }}
                    />
                );
            }
        },
        {
            field: 'mainTeacher',
            headerName: 'Docente Principale',
            width: 180,
            renderCell: (params) => {
                const teacher = params.row.mainTeacher;
                return teacher ? 
                    `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'N/D' 
                    : 'N/D';
            }
        },
        {
            field: 'testCount',
            headerName: 'Test Completati',
            width: 130,
            type: 'number',
            renderCell: (params) => {
                const count = params.row.testCount || 0;
                return (
                    <Chip
                        label={count}
                        size="small"
                        sx={{
                            bgcolor: count > 0 ? 'success.light' : 'grey.300',
                            color: count > 0 ? 'success.contrastText' : 'text.primary'
                        }}
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/students/${params.row._id}`)}
                        >
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(params.row)}
                            color="error"
                        >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [navigate]);

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Gestione Studenti
                    </Typography>
                    <Box display="flex" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<SchoolIcon />}
                            onClick={() => navigate('/admin/students/assign-school')}
                        >
                            Assegna a Scuola
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => setImportFormOpen(true)}
                        >
                            Import Excel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/admin/students/new')}
                        >
                            Nuovo Studente
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Stat Cards */}
            <StatCards students={students} />

            {/* Filters */}
            <Paper sx={{ mb: 3, borderRadius: 2 }}>
                <FilterToolbar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    schoolFilter={schoolFilter}
                    setSchoolFilter={setSchoolFilter}
                    classFilter={classFilter}
                    setClassFilter={setClassFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    specialNeedsFilter={specialNeedsFilter}
                    setSpecialNeedsFilter={setSpecialNeedsFilter}
                    handleSearch={handleSearch}
                    handleResetFilters={handleResetFilters}
                />
            </Paper>

            {/* DataGrid */}
            <Paper sx={{ height: 650, borderRadius: 2 }}>
                <DataGrid
                    rows={students || []}
                    columns={columns}
                    pagination
                    paginationMode="server"
                    rowCount={totalStudents}
                    page={page}
                    pageSize={pageSize}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setPage(0);
                    }}
                    loading={loading}
                    disableSelectionOnClick
                    getRowId={(row) => row._id}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: alpha('#1976d2', 0.02)
                        }
                    }}
                />
            </Paper>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Conferma eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler eliminare lo studente 
                        {selectedStudent ? ` ${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
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

            {/* Import Form */}
            <StudentBulkImportForm 
                open={importFormOpen}
                onClose={() => {
                    setImportFormOpen(false);
                    loadStudents();
                }}
            />
        </Box>
    );
};

export default StudentList;