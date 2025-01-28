// src/components/StudentList/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Paper,
    Grid,
    alpha
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    CloudUpload as CloudUploadIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    HourglassEmpty as PendingIcon,
    Block as BlockIcon
} from '@mui/icons-material';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';
import { StatCards } from './StatCards';
import { FilterToolbar } from './FilterToolbar';
import StudentForm from './StudentForm';
import StudentBulkImportForm from './StudentBulkImportForm';
import '../../styles.css';  // all'inizio del file


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

    // Stati locali
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
    const [importFormOpen, setImportFormOpen] = useState(false);

    // Nuovi stati per i filtri
    const [schoolFilter, setSchoolFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [specialNeedsFilter, setSpecialNeedsFilter] = useState('');

 
    const loadStudents = async () => {
        try {
            // Creiamo un oggetto con tutti i filtri
            const filters = {
                page: page + 1,
                limit: pageSize
            };
    
            // Aggiungiamo i filtri solo se hanno un valore
            if (searchTerm.trim()) {
                filters.search = searchTerm.trim();
            }
    
            if (schoolFilter) {
                filters.schoolId = schoolFilter;  // Usa l'ID della scuola selezionata
            }
    
            if (classFilter) {
                // Estraiamo anno e sezione dal classFilter (es: "1A" => year: 1, section: "A")
                const year = parseInt(classFilter.match(/^\d+/)[0]);
                const section = classFilter.slice(year.toString().length);
                filters.year = year;
                filters.section = section;
            }
    
            if (statusFilter) {
                filters.status = statusFilter;
            }
    
            if (specialNeedsFilter) {
                // Convertiamo il string "true"/"false" in boolean
                filters.specialNeeds = specialNeedsFilter === 'true';
            }
    
            console.log('Applying filters:', filters);  // Debug
            await fetchStudents(filters);
    
        } catch (error) {
            console.error('Error loading students:', error);
            showNotification('Errore nel caricamento degli studenti', 'error');
        }
    };

    // Aggiorniamo gli effect per reagire ai cambiamenti dei filtri
    useEffect(() => {
        loadStudents();
    }, [page, pageSize]); // Non includiamo i filtri qui per evitare chiamate automatiche

        // Aggiorniamo handleSearch per gestire l'applicazione dei filtri
        const handleSearch = () => {
            setPage(0); // Resetta la pagina quando si applicano nuovi filtri
            loadStudents();
        };

        // Aggiorniamo handleResetFilters
        const handleResetFilters = () => {
            setSearchTerm('');
            setSchoolFilter('');
            setClassFilter('');
            setStatusFilter('');
            setSpecialNeedsFilter('');
            setPage(0);
            
            // Carica i dati senza filtri
            loadStudents();
        };

        // Aggiorniamo handlePageChange
        const handlePageChange = (newPage) => {
            setPage(newPage);
            loadStudents();
        };

        // Aggiorniamo handlePageSizeChange
        const handlePageSizeChange = (newPageSize) => {
            setPageSize(newPageSize);
            setPage(0);
            loadStudents();
        };

    const handleDeleteConfirm = async () => {
        try {
            await deleteStudent(selectedStudent._id);
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
            showNotification('Studente eliminato con successo', 'success');
            loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            showNotification('Errore durante l\'eliminazione dello studente', 'error');
        }
    };
    
    const handleEdit = (student) => {
        setSelectedStudent(student);
        setFormOpen(true);
    };
    
    const handleViewDetails = (student) => {
        setSelectedStudentDetails(student);
        setDetailsDialogOpen(true);
    };
    
    const handleDeleteClick = (student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const getStatusConfig = (status) => {
        const configs = {
            active: { 
                icon: CheckCircleIcon, 
                label: 'Attivo', 
                color: '#2e7d32',
                bgColor: '#e8f5e9'
            },
            pending: { 
                icon: PendingIcon, 
                label: 'In Attesa', 
                color: '#ed6c02',
                bgColor: '#fff3e0'
            },
            inactive: { 
                icon: BlockIcon, 
                label: 'Inattivo', 
                color: '#d32f2f',
                bgColor: '#ffebee'
            },
            transferred: { 
                icon: SchoolIcon, 
                label: 'Trasferito', 
                color: '#0288d1',
                bgColor: '#e1f5fe'
            },
            graduated: { 
                icon: AssignmentIcon, 
                label: 'Diplomato', 
                color: '#7b1fa2',
                bgColor: '#f3e5f5'
            }
        };
        return configs[status] || configs.pending;
    };

    const columns = [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            width: 200,
            flex: 0,
            renderCell: (params) => {
                const fullName = `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim();
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">
                            {fullName || 'N/D'}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            flex: 0,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/D'}>
                    <Typography
                        variant="body2"
                        sx={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {params.value || 'N/D'}
                    </Typography>
                </Tooltip>
            )
        },
        {
            field: 'schoolName',
            headerName: 'Scuola',
            width: 150,
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                    <Typography variant="body2">
                        {params.row.schoolId?.name || 'N/D'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'className',
            headerName: 'Classe',
            width: 140,
            renderCell: (params) => {
                const classInfo = params.row.classId;
                return classInfo ? (
                    <Chip
                        label={`${classInfo.year}${classInfo.section}`}
                        size="small"
                        sx={{
                            minWidth: '60px', // Aggiunto per consistenza
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontSize: '0.75rem'
                        }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary">N/D</Typography>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 160,
            renderCell: (params) => {
                const status = params.value || 'pending';
                const config = getStatusConfig(status);
                const StatusIcon = config.icon;

                return (
                    <Chip
                        icon={<StatusIcon sx={{ fontSize: '1rem !important' }} />}
                        label={config.label}
                        size="small"
                        sx={{
                            minWidth: '100px', // Aggiunto per consistenza
                            bgcolor: config.bgColor,
                            color: config.color,
                            '& .MuiChip-icon': {
                                color: config.color
                            },
                            '& .MuiChip-label': {
                                px: 1,
                                fontSize: '0.75rem'
                            }
                        }}
                    />
                );
            }
        },
        {
            field: 'specialNeeds',
            headerName: 'Necessità Speciali',
            width: 150,
            renderCell: (params) => {
                const hasSpecialNeeds = Boolean(params.value);
                return (
                    <Chip
                        icon={hasSpecialNeeds ? 
                            <WarningIcon sx={{ fontSize: '1rem !important' }} /> : 
                            <CheckCircleIcon sx={{ fontSize: '1rem !important' }} />
                        }
                        label={hasSpecialNeeds ? 'Presenti' : 'Nessuna'}
                        size="small"
                        sx={{
                            minWidth: '120px', // Aggiunto per consistenza
                            bgcolor: hasSpecialNeeds ? '#fff3e0' : '#e8f5e9',
                            color: hasSpecialNeeds ? '#ed6c02' : '#2e7d32',
                            '& .MuiChip-icon': {
                                color: 'inherit'
                            },
                            '& .MuiChip-label': {
                                px: 1,
                                fontSize: '0.75rem'
                            }
                        }}
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 160,
            renderCell: (params) => {
                const handleTestClick = (student) => {
                    const studentId = student._id || student.id;
                    if (!studentId) {
                        showNotification('ID studente non trovato', 'error');
                        return;
                    }
                    
                    // Usiamo il path relativo, senza /admin/ perché siamo già nel contesto di /admin/*
                    const path = `students/${studentId}/tests`;
                    console.log('Navigating to:', path);
                    
                    navigate(path, { 
                        state: { studentData: student }
                    });
                };
        
                return (
                    <Box sx={{  
                        display: 'flex', 
                        gap: 1,
                        justifyContent: 'center',
                        width: '100%' 
                    }}>
                        <Tooltip title="Gestione Test">
                            <IconButton
                                size="small"
                                onClick={() => handleTestClick(params.row)}
                                sx={{ 
                                    p: '4px',
                                    '&:hover': { bgcolor: alpha('#1976d2', 0.1) },
                                    // Disabilita il pulsante se lo studente è inattivo
                                    '&.Mui-disabled': {
                                        opacity: 0.5
                                    }
                                }}
                                disabled={params.row.status === 'inactive'}
                            >
                                <AssignmentIcon 
                                    sx={{ 
                                        fontSize: '1.1rem', 
                                        color: 'primary.main'
                                    }} 
                                />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Visualizza">
                            <IconButton
                                size="small"
                                onClick={() => handleViewDetails(params.row)}
                                sx={{ 
                                    p: '4px',
                                    '&:hover': { bgcolor: alpha('#1976d2', 0.1) }
                                }}
                            >
                                <VisibilityIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                            <IconButton
                                size="small"
                                onClick={() => handleEdit(params.row)}
                                sx={{ 
                                    p: '4px',
                                    '&:hover': { bgcolor: alpha('#1976d2', 0.1) }
                                }}
                            >
                                <EditIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(params.row)}
                                sx={{ 
                                    p: '4px',
                                    '&:hover': { bgcolor: alpha('#d32f2f', 0.1) }
                                }}
                            >
                                <DeleteIcon sx={{ fontSize: '1.1rem', color: 'error.main' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            }
        }
    ];


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: '#fff',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Box
                        display="flex"
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', sm: 'center' }}
                        gap={2}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                fontSize: { xs: '1.5rem', sm: '1.8rem' },
                                fontWeight: 600,
                                color: 'primary.main'
                            }}
                        >
                            Gestione Studenti
                        </Typography>
                        <Box
                            display="flex"
                            gap={2}
                            flexDirection={{ xs: 'column', sm: 'row' }}
                            width={{ xs: '100%', sm: 'auto' }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<SchoolIcon />}
                                onClick={() => navigate('/admin/students/assign-school')}
                                sx={{
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: alpha('#1976d2', 0.04) }
                                }}
                            >
                                Assegna a Scuola
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                onClick={() => setImportFormOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: alpha('#1976d2', 0.04) }
                                }}
                            >
                                Import Massivo
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setFormOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': { boxShadow: 'none' }
                                }}
                            >
                                Nuovo Studente
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Stat Cards */}
                <StatCards students={students} />

                {/* Filters */}
                <Paper
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: '#fff',
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden'
                    }}
                >
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
<Paper
    elevation={0}
    sx={{
        borderRadius: 2,
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '600px', // Altezza fissa per il contenitore
        display: 'flex',
        flexDirection: 'column'
    }}
>
    <div className="table-container">
        <div 
            className="ag-theme-material"
            style={{ 
                width: '100%',
                height: '100%',
                minHeight: '500px'
            }}
        >
            <DataGrid
                rows={students || []}
                columns={columns}
                pagination
                paginationMode="server"
                rowCount={totalStudents}
                page={page}
                pageSize={pageSize}
                rowsPerPageOptions={[10, 25, 50]}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                disableSelectionOnClick
                getRowId={(row) => row._id || row.id}
                density="compact"
                classes={{
                    cell: 'custom-cell-style'
                }}
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        bgcolor: alpha('#1976d2', 0.02),
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '& .MuiDataGrid-columnHeader': {
                            padding: '8px',
                        }
                    },
                    '& .MuiDataGrid-cell': {
                        padding: '8px',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid',
                        borderColor: alpha('#000', 0.05)
                    },
                    '& .MuiDataGrid-row': {
                        '&:hover': {
                            bgcolor: alpha('#1976d2', 0.04)
                        }
                    },
                    height: '100%' // Importante
                }}
            />
        </div>
    </div>
</Paper>

                {/* Dialogs */}
                <AnimatePresence mode="wait">
                    {/* Delete Dialog */}
                    {deleteDialogOpen && (
                        <Dialog
                            key="delete-dialog"
                            open={deleteDialogOpen}
                            onClose={() => setDeleteDialogOpen(false)}
                            PaperProps={{
                                component: motion.div,
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: 20 }
                            }}
                        >
                            <DialogTitle sx={{ pb: 1 }}>
                                <Typography variant="h6">Conferma eliminazione</Typography>
                            </DialogTitle>
                            <DialogContent>
                                <Typography variant="body1" gutterBottom>
                                    Sei sicuro di voler eliminare lo studente 
                                    {selectedStudent ? ` ${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}?
                                </Typography>
                                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                    Questa azione non può essere annullata.
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ p: 2, pt: 1 }}>
                                <Button
                                    onClick={() => setDeleteDialogOpen(false)}
                                    variant="outlined"
                                    sx={{ textTransform: 'none' }}
                                >
                                    Annulla
                                </Button>
                                <Button
                                    onClick={handleDeleteConfirm}
                                    color="error"
                                    variant="contained"
                                    sx={{ textTransform: 'none' }}
                                >
                                    Elimina
                                </Button>
                            </DialogActions>
                        </Dialog>
                    )}

                    {/* Details Dialog */}
                    {detailsDialogOpen && (
                        <Dialog
                            key="details-dialog"
                            open={detailsDialogOpen}
                            onClose={() => setDetailsDialogOpen(false)}
                            maxWidth="md"
                            fullWidth
                            PaperProps={{
                                component: motion.div,
                                initial: { opacity: 0, scale: 0.95 },
                                animate: { opacity: 1, scale: 1 },
                                exit: { opacity: 0, scale: 0.95 }
                            }}
                        >
                            <DialogTitle sx={{ 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                pb: 2
                            }}>
                                <Typography variant="h6">Dettagli Studente</Typography>
                            </DialogTitle>
                            <DialogContent sx={{ pt: 3 }}>
                                {selectedStudentDetails && (
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                Nome Completo
                                            </Typography>
                                            <Typography variant="body1">
                                                {`${selectedStudentDetails.firstName} ${selectedStudentDetails.lastName}`}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                Email
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedStudentDetails.email}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                Scuola
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedStudentDetails.schoolId?.name || 'Non assegnata'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                Classe
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedStudentDetails.classId ? 
                                                    `${selectedStudentDetails.classId.year}${selectedStudentDetails.classId.section}` : 
                                                    'Non assegnata'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                Stato
                                            </Typography>
                                            {selectedStudentDetails.status && (
                                                <Chip
                                                    label={getStatusConfig(selectedStudentDetails.status).label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getStatusConfig(selectedStudentDetails.status).bgColor,
                                                        color: getStatusConfig(selectedStudentDetails.status).color
                                                    }}
                                                />
                                            )}
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                Necessità Speciali
                                            </Typography>
                                            <Chip
                                                label={selectedStudentDetails.specialNeeds ? 'Presenti' : 'Nessuna'}
                                                color={selectedStudentDetails.specialNeeds ? 'warning' : 'success'}
                                                size="small"
                                            />
                                        </Grid>
                                    </Grid>
                                )}
                            </DialogContent>
                            <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Button 
                                    onClick={() => setDetailsDialogOpen(false)}
                                    variant="outlined"
                                    sx={{ textTransform: 'none' }}
                                >
                                    Chiudi
                                </Button>
                            </DialogActions>
                        </Dialog>
                    )}
                </AnimatePresence>

                {/* Forms */}
                <StudentForm
                    open={formOpen}
                    onClose={() => {
                        setFormOpen(false);
                        setSelectedStudent(null);
                        loadStudents();
                    }}
                    student={selectedStudent}
                />
                
                <StudentBulkImportForm 
                    open={importFormOpen}
                    onClose={() => {
                        setImportFormOpen(false);
                        loadStudents();
                    }}
                />
            </Box>
        </motion.div>
    );
};

export default StudentList;