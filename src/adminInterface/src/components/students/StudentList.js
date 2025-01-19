import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Grid,
    IconButton,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Paper
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

const StudentList = () => {
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

    const columns = [
        {
            field: 'firstName',
            headerName: 'Nome Completo',
            width: 200,
            renderCell: (params) => {
                return params.row ? `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() : 'N/D';
            }
        },
        {
            field: 'gender',
            headerName: 'Genere',
            width: 100,
            renderCell: (params) => {
                return params.row?.gender === 'M' ? 'Maschio' : 
                       params.row?.gender === 'F' ? 'Femmina' : 'N/D';
            }
        },
        {
            field: 'dateOfBirth',
            headerName: 'Data Nascita',
            width: 150,
            renderCell: (params) => {
                if (!params.row?.dateOfBirth) return 'N/D';
                try {
                    return new Date(params.row.dateOfBirth).toLocaleDateString('it-IT');
                } catch {
                    return 'N/D';
                }
            }
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            renderCell: (params) => params.row?.email || 'N/D'
        },
        {
            field: 'school',
            headerName: 'Scuola',
            width: 200,
            renderCell: (params) => params.row?.schoolId?.name || 'N/D'
        },
        {
            field: 'class',
            headerName: 'Classe',
            width: 120,
            renderCell: (params) => {
                const classId = params.row?.classId;
                if (!classId) return 'Non Assegnata';
                return `${classId.year || ''}${classId.section || ''}`;
            }
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 150,
            renderCell: (params) => {
                if (!params.row?.status) return null;
                return (
                    <Chip
                        label={params.row.status === 'active' ? 'Attivo' : 
                               params.row.status === 'pending' ? 'In Attesa' : 
                               params.row.status === 'inactive' ? 'Inattivo' : params.row.status}
                        color={params.row.status === 'active' ? 'success' :
                               params.row.status === 'pending' ? 'warning' :
                               params.row.status === 'inactive' ? 'error' : 'default'}
                        size="small"
                    />
                );
            }
        },
        {
            field: 'mainTeacher',
            headerName: 'Docente Principale',
            width: 180,
            renderCell: (params) => params.row?.mainTeacher?.name || 'Non assegnato'
        },
        {
            field: 'specialNeeds',
            headerName: 'Necessità Speciali',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.row?.specialNeeds ? 'Sì' : 'No'}
                    color={params.row?.specialNeeds ? 'warning' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 160,
            renderCell: (params) => (
                params.row ? (
                    <Box>
                         <Tooltip title="Visualizza">
                            <IconButton 
                                onClick={() => handleViewDetails(params.row)} 
                                size="small"
                                color="primary"
                            >
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                            <IconButton onClick={() => handleEdit(params.row)} size="small">
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                            <IconButton onClick={() => handleDeleteClick(params.row)} size="small" color="error">
                                <DeleteIcon />
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
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Gestione Studenti
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setFormOpen(true)}
                >
                    Nuovo Studente
                </Button>
            </Box>

            <Box display="flex" gap={2} mb={3}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Cerca studenti..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                >
                    Cerca
                </Button>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
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
                    components={{
                        NoRowsOverlay: () => (
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                <Typography>Nessuno studente trovato</Typography>
                            </Box>
                        )
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
        </Box>
    );
};

export default StudentList;