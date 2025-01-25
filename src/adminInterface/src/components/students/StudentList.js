import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Aggiungi questa riga
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
    TextField,
    Typography,
    Paper,
    alpha,
    Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';
import StudentForm from './StudentForm';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StudentBulkImportForm from './StudentBulkImportForm';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SchoolIcon from '@mui/icons-material/School';


const StudentList = () => {
    const navigate = useNavigate(); // Aggiungi questa riga
    const {
        students,
        loading,
        error,
        totalStudents,
        fetchStudents,
        deleteStudent
    } = useStudent();

    const { showNotification } = useNotification();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
    const [importFormOpen, setImportFormOpen] = useState(false);


    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            await fetchStudents({
                page: page + 1,
                limit: pageSize,
                search: searchTerm.trim() || undefined
            });
        } catch (error) {
            console.error('Error loading students:', error);
            showNotification('Errore nel caricamento degli studenti', 'error');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/D';
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            pending: 'warning',
            active: 'success',
            inactive: 'error',
            transferred: 'info',
            graduated: 'secondary'
        };
        return statusColors[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            pending: 'In Attesa',
            active: 'Attivo',
            inactive: 'Inattivo',
            transferred: 'Trasferito',
            graduated: 'Diplomato'
        };
        return statusLabels[status] || status;
    };

    const handleViewDetails = (student) => {
        setSelectedStudentDetails(student);
        setDetailsDialogOpen(true);
    };

    // Component styles
const styles = {
    pageContainer: {
        p: { xs: 2, sm: 3 },
        maxWidth: '100%',
        backgroundColor: '#f8f9fa'
    },
    headerPaper: {
        p: 3,
        mb: 3,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    headerTitle: {
        fontSize: { xs: '1.5rem', sm: '2rem' },
        fontWeight: 500,
        color: '#2c3e50'
    },
    searchPaper: {
        p: 2,
        mb: 3,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    searchInput: {
        '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '&:hover': {
                '& > fieldset': {
                    borderColor: '#1976d2'
                }
            }
        }
    },
    dataGridPaper: {
        backgroundColor: '#ffffff',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        '& .MuiDataGrid-root': {
            border: 'none'
        },
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef'
        },
        '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e9ecef',
            '&:focus': {
                outline: 'none'
            }
        },
        '& .MuiDataGrid-row': {
            '&:hover': {
                backgroundColor: '#f8f9fa'
            }
        }
    },
    button: {
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': {
            boxShadow: 'none'
        }
    },
    statusChip: {
        height: '24px',
        fontSize: '0.85rem',
        fontWeight: 500
    }
};

const columns = [
    {
        field: 'firstName',
        headerName: 'Nome Completo',
        width: 180,
        flex: 1,
        renderCell: (params) => (
            <Typography sx={{ fontSize: '0.875rem' }}>
                {params.row ? `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() : 'N/D'}
            </Typography>
        )
    },
    {
        field: 'gender',
        headerName: 'Genere',
        width: 90,
        renderCell: (params) => (
            <Typography sx={{ fontSize: '0.875rem' }}>
                {params.row?.gender === 'M' ? 'Maschio' : 
                 params.row?.gender === 'F' ? 'Femmina' : 'N/D'}
            </Typography>
        )
    },
    {
        field: 'dateOfBirth',
        headerName: 'Data Nascita',
        width: 100,
        renderCell: (params) => {
            if (!params.row?.dateOfBirth) return <Typography sx={{ fontSize: '0.875rem' }}>N/D</Typography>;
            try {
                return (
                    <Typography sx={{ fontSize: '0.875rem' }}>
                        {new Date(params.row.dateOfBirth).toLocaleDateString('it-IT')}
                    </Typography>
                );
            } catch {
                return <Typography sx={{ fontSize: '0.875rem' }}>N/D</Typography>;
            }
        }
    },
    {
        field: 'email',
        headerName: 'Email',
        width: 200,
        flex: 1,
        renderCell: (params) => (
            <Typography 
                noWrap
                sx={{ 
                    fontSize: '0.875rem',
                    color: '#1976d2',
                    '&:hover': { textDecoration: 'underline', cursor: 'pointer' }
                }}
            >
                {params.row?.email || 'N/D'}
            </Typography>
        )
    },
    {
        field: 'school',
        headerName: 'Scuola',
        width: 160,
        flex: 0.8,
        renderCell: (params) => (
            <Typography sx={{ fontSize: '0.875rem' }}>
                {params.row?.schoolId?.name || 'N/D'}
            </Typography>
        )
    },
    {
        field: 'class',
        headerName: 'Classe',
        width: 70,
        renderCell: (params) => {
            const classId = params.row?.classId;
            return (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {classId ? `${classId.year || ''}${classId.section || ''}` : 'N/A'}
                </Typography>
            );
        }
    },
    {
        field: 'status',
        headerName: 'Stato',
        width: 100,
        renderCell: (params) => {
            if (!params.row?.status) return null;
            const statusConfig = {
                active: { label: 'Attivo', bg: '#e8f5e9', color: '#2e7d32' },
                pending: { label: 'In Attesa', bg: '#fff3e0', color: '#ef6c00' },
                inactive: { label: 'Inattivo', bg: '#f5f5f5', color: '#757575' }
            }[params.row.status] || { label: params.row.status, bg: '#f5f5f5', color: '#757575' };

            return (
                <Chip
                    label={statusConfig.label}
                    size="small"
                    sx={{
                        height: '20px',
                        fontSize: '0.75rem',
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color,
                        borderRadius: '4px',
                        '& .MuiChip-label': {
                            px: 1.5
                        }
                    }}
                />
            );
        }
    },
    {
        field: 'mainTeacher',
        headerName: 'Docente Principale',
        width: 160,
        flex: 0.8,
        renderCell: (params) => {
            const teacher = params.row?.mainTeacher;
            return (
                <Typography sx={{ 
                    fontSize: '0.875rem',
                    color: teacher?.id ? '#2c3e50' : '#7f8c8d' 
                }}>
                    {teacher?.name || 'Non assegnato'}
                </Typography>
            );
        }
    },
    {
        field: 'specialNeeds',
        headerName: 'Necessità Speciali',
        width: 120,
        renderCell: (params) => {
            const hasSpecialNeeds = Boolean(params.row?.specialNeeds);
            return (
                <Chip
                    label={hasSpecialNeeds ? 'Sì' : 'No'}
                    size="small"
                    sx={{
                        height: '20px',
                        fontSize: '0.75rem',
                        backgroundColor: hasSpecialNeeds ? '#fff3e0' : '#f5f5f5',
                        color: hasSpecialNeeds ? '#ef6c00' : '#757575',
                        borderRadius: '4px',
                        '& .MuiChip-label': {
                            px: 1.5
                        }
                    }}
                />
            );
        }
    },
    {
        field: 'actions',
        headerName: 'Azioni',
        width: 130,
        renderCell: (params) => (
            params.row ? (
                <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    justifyContent: 'flex-end',
                    width: '100%'
                }}>
                    <Tooltip title="Test">
                        <IconButton 
                            onClick={() => navigate(`/admin/students/${params.row._id || params.row.id}/tests`)}
                            size="small"
                            sx={{ padding: '4px' }}
                        >
                            <span style={{ fontSize: '1rem' }}>📝</span>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Visualizza">
                        <IconButton 
                            onClick={() => handleViewDetails(params.row)}
                            size="small"
                            sx={{ padding: '4px' }}
                        >
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica">
                        <IconButton 
                            onClick={() => handleEdit(params.row)}
                            size="small"
                            sx={{ padding: '4px' }}
                        >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton 
                            onClick={() => handleDeleteClick(params.row)}
                            size="small"
                            sx={{ padding: '4px' }}
                        >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : null
        )
    }
];
    const handleDeleteClick = (student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteStudent(selectedStudent.id);
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
            loadStudents();
            showNotification('Studente eliminato con successo', 'success');
        } catch (error) {
            console.error('Error deleting student:', error);
            showNotification('Errore durante l\'eliminazione dello studente', 'error');
        }
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setFormOpen(true);
    };

    const handleSearch = () => {
        loadStudents();
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchStudents({
            page: newPage + 1,
            limit: pageSize,
            search: searchTerm.trim() || undefined
        });
    };
    
    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setPage(0);
        fetchStudents({
            page: 1,
            limit: newPageSize,
            search: searchTerm.trim() || undefined
        });
    };

    


    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    mb: 3, 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
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
                        component="h1"
                        sx={{ 
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            fontWeight: 500,
                            color: '#2c3e50'
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
                            startIcon={<SchoolIcon />}  // Importa SchoolIcon da @mui/icons-material
                            onClick={() => navigate('/admin/students/assign-school')}
                            sx={{
                                textTransform: 'none',
                                borderColor: '#e0e0e0',
                                color: '#616161',
                                '&:hover': {
                                    borderColor: '#bdbdbd',
                                    backgroundColor: '#f5f5f5'
                                }
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
                                borderColor: '#e0e0e0',
                                color: '#616161',
                                '&:hover': {
                                    borderColor: '#bdbdbd',
                                    backgroundColor: '#f5f5f5'
                                }
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
                                backgroundColor: '#1976d2',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#1565c0',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            Nuovo Studente
                        </Button>
                    </Box>
                </Box>
            </Paper>
    
            {/* Search Bar */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2, 
                    mb: 3,
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                }}
            >
                <Box 
                    display="flex" 
                    gap={2} 
                    flexDirection={{ xs: 'column', sm: 'row' }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Cerca studenti..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: '#9e9e9e', mr: 1 }} />,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#ffffff',
                                '&:hover fieldset': {
                                    borderColor: '#1976d2'
                                }
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        sx={{
                            minWidth: { xs: '100%', sm: '120px' },
                            textTransform: 'none',
                            backgroundColor: '#1976d2',
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        Cerca
                    </Button>
                </Box>
            </Paper>
    
            {/* DataGrid */}
            <Paper 
                elevation={0}
                sx={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0'
                }}
            >
                {/* Modifica le props del DataGrid */}
<DataGrid
    rows={students || []}
    columns={columns}
    pagination
    paginationMode="server"
    rowCount={totalStudents}
    page={page}
    pageSize={pageSize}
    rowsPerPageOptions={[5, 10, 20, 50]}
    onPageChange={handlePageChange}
    onPageSizeChange={handlePageSizeChange}
    loading={loading}
    autoHeight
    disableSelectionOnClick
    getRowId={(row) => row._id || row.id}
    density="compact"  // Aggiunto questo
    sx={{
        border: 'none',
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            '& .MuiDataGrid-columnHeader': {
                padding: '8px',  // Ridotto padding header
            }
        },
        '& .MuiDataGrid-cell': {
            padding: '4px 8px',  // Ridotto padding celle
            borderBottom: '1px solid #f0f0f0',
            fontSize: '0.875rem'  // Ridotto font size
        },
        '& .MuiDataGrid-row': {
            minHeight: '40px !important',  // Ridotta altezza righe
            maxHeight: '40px !important',
            '&:hover': {
                backgroundColor: '#f8f9fa'
            }
        },
        '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #e0e0e0',
            minHeight: '42px'  // Ridotta altezza footer
        },
        '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: '0.875rem',  // Ridotto font size headers
            fontWeight: 600
        }
    }}
/>
            </Paper>

            {/* Dialog Conferma Eliminazione */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Conferma eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler eliminare lo studente 
                        {selectedStudent ? ` ${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}?
                    </Typography>
                    <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                        Questa azione non può essere annullata.
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
                        autoFocus
                    >
                        Elimina
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Dialog Dettagli Studente */}
            <Dialog
                open={detailsDialogOpen}
                onClose={() => setDetailsDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Dettagli Studente
                </DialogTitle>
                <DialogContent>
                    {selectedStudentDetails && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Nome Completo
                                    </Typography>
                                    <Typography variant="body1">
                                        {`${selectedStudentDetails.firstName} ${selectedStudentDetails.lastName}`}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Codice Fiscale
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.fiscalCode || 'Non specificato'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Data di Nascita
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedStudentDetails.dateOfBirth)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Genere
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.gender === 'M' ? 'Maschio' : 'Femmina'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.email}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Email Genitore
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.parentEmail || 'Non specificata'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Scuola
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.schoolId?.name || 'N/D'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Classe
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.classId ? 
                                            `${selectedStudentDetails.classId.year}${selectedStudentDetails.classId.section}` : 
                                            'Non assegnata'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Stato
                                    </Typography>
                                    <Chip
                                        label={getStatusLabel(selectedStudentDetails.status)}
                                        color={getStatusColor(selectedStudentDetails.status)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Docente Principale
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedStudentDetails.mainTeacher?.name || 'Non assegnato'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Necessità Speciali
                                    </Typography>
                                    <Chip
                                        label={selectedStudentDetails.specialNeeds ? 'Sì' : 'No'}
                                        color={selectedStudentDetails.specialNeeds ? 'warning' : 'default'}
                                        size="small"
                                    />
                            </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialogOpen(false)}>
                        Chiudi
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Form Creazione/Modifica */}
            <StudentForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedStudent(null);
                    loadStudents();
                }}
                student={selectedStudent}
            />
            {/* Import studenti excel */}
            <StudentBulkImportForm 
                open={importFormOpen}
                onClose={() => {
                    setImportFormOpen(false);
                    loadStudents(); // ricarica la lista dopo l'import
                }}
            />
        </Box>
    );
};

export default StudentList;