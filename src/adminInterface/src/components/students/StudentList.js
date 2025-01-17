// src/components/students/StudentList.js

import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    TextField,
    Alert,
    Tabs,
    Tab,
    
    FormControl,    // Aggiungi questo
    InputLabel,     // Aggiungi questo
    Select,         // Aggiungi questo
    MenuItem        // Aggiungi questo
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';
import StudentForm from './StudentForm';
import { useClass } from '../../context/ClassContext';
import { useSchool } from '../../context/SchoolContext';


const StudentList = () => {
    const { 
        students, 
        loading, 
        error, 
        totalStudents,
        fetchStudents,
        deleteStudent,
        fetchUnassignedStudents,
    } = useStudent();

    const { showNotification } = useNotification();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [formOpen, setFormOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [viewMode, setViewMode] = useState('all'); // 'all' | 'unassigned'
    const { classes, fetchClasses } = useClass(); // assumo che tu abbia un ClassContext
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const { currentSchool } = useSchool();

    useEffect(() => {
        const loadData = async () => {
            try {
                if (viewMode === 'all') {
                    await fetchStudents();
                } else if (viewMode === 'unassigned' && currentSchool?.id) {
                    await fetchUnassignedStudents(currentSchool.id);
                }
            } catch (error) {
                console.error('Error loading students:', error);
                showNotification('Errore nel caricamento degli studenti', 'error');
            }
        };
    
        loadData();
    }, [viewMode, currentSchool]);

 // Handler per il cambio di tab
 const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
    setSelectedStudents([]); // Reset selezione quando cambia vista
};

// Handler per la selezione multipla
const handleSelectionChange = (newSelection) => {
    setSelectedStudents(newSelection);
};

// Handler per aprire il dialog di assegnazione
const handleBatchAssign = () => {
    fetchClasses(); // Carica le classi disponibili
    setAssignDialogOpen(true);
};

// Handler per l'assegnazione effettiva
const handleAssignConfirm = async () => {
    try {
        if (!selectedClass) {
            showNotification('Seleziona una classe', 'error');
            return;
        }

        await batchAssignStudents(
            selectedStudents, 
            selectedClass,
            getCurrentAcademicYear() // funzione helper da implementare
        );

        setAssignDialogOpen(false);
        setSelectedStudents([]);
        setSelectedClass('');
        
        // Ricarica la lista degli studenti non assegnati
        if (viewMode === 'unassigned') {
            fetchUnassignedStudents(schoolId);
        }
    } catch (error) {
        console.error('Error assigning students:', error);
    }
};

// Helper per ottenere l'anno accademico corrente
const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}/${currentYear + 1}`;
};

    const handleDeleteClick = (student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteStudent(selectedStudent.id);
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
        } catch (error) {
            console.error('Error deleting student:', error);
            showNotification('Errore durante l\'eliminazione dello studente', 'error');
        }
    };

    const handleSearch = () => {
        if (searchTerm.trim()) {
            fetchStudents({ search: searchTerm });
        } else {
            fetchStudents();
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchStudents({ page: newPage + 1, limit: pageSize });
    };

    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setPage(0);
        fetchStudents({ page: 1, limit: newPageSize });
    };

    const handleCreateClick = () => {
        setEditingStudent(null);
        setFormOpen(true);
    };
    
    const handleEditClick = (student) => {
        setEditingStudent(student);
        setFormOpen(true);
    };
    
    const handleFormClose = () => {
        setFormOpen(false);
        setEditingStudent(null);
    };

    const prepareRowsForDataGrid = (students) => {
        return students.map(student => {
            // Log per debug
            console.log('Processing student:', student);
            
            return {
                ...student,
                id: student._id || student.id, // Assicurati che ci sia un id
                schoolName: student.schoolId?.name || 'N/D',
                className: student.classId ? 
                    `${student.classId.year}${student.classId.section}` : 
                    'Non assegnata'
            };
        });
    };


    const columns = [
        { 
            field: 'fiscalCode', 
            headerName: 'Codice Fiscale', 
            width: 150,
             valueGetter: (params) => params.row?.fiscalCode || ''
        },
        { 
            field: 'lastName', 
            headerName: 'Cognome', 
            width: 150,
            renderCell: (params) => {
                console.log("Params in lastName:", params);
                return params.row?.lastName?.toUpperCase() || '';
            }
        },
        { 
            field: 'firstName', 
            headerName: 'Nome', 
            width: 150 
        },
        { 
            field: 'gender', 
            headerName: 'Genere', 
            width: 100,
            align: 'center',
            headerAlign: 'center'
        },
        { 
            field: 'dateOfBirth', 
            headerName: 'Data Nascita', 
            width: 150,
            valueFormatter: (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleDateString();
            }
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            width: 200,
            valueGetter: (params) => params?.value || ''
        },
        {
            field: 'schoolName',
            headerName: 'Scuola',
            width: 200,
            valueGetter: (params) => {
                const schoolId = params.row?.schoolId;
                return typeof schoolId === 'object' ? schoolId?.name || 'N/D' : 'N/D';
            }
        },
        {
            field: 'className',
            headerName: 'Classe',
            width: 150,
            valueGetter: (params) => {
                const classId = params.row?.classId;
                if (!classId) return 'Non assegnata';
                return classId.year && classId.section ? 
                       `${classId.year}${classId.section}` : 
                       'Non assegnata';
            }
        },
        {
            field: 'currentYear',
            headerName: 'Anno',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (params) => params?.value || ''

        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Modifica">
                        <IconButton 
                            onClick={() => handleEditClick(params.row)} 
                            size="small"
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton
                            onClick={() => handleDeleteClick(params.row)}
                            size="small"
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box p={3}>
            {/* Header con Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" component="h1">
                        Gestione Studenti
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateClick}
                    >
                        Nuovo Studente
                    </Button>
                </Box>
                <Tabs
                    value={viewMode}
                    onChange={(e, newValue) => setViewMode(newValue)}
                    sx={{ mt: 2 }}
                >
                    <Tab 
                        label="Tutti gli Studenti" 
                        value="all"
                        sx={{ textTransform: 'none' }}
                    />
                    <Tab 
                        label="Da Assegnare" 
                        value="unassigned"
                        sx={{ textTransform: 'none' }}
                    />
                </Tabs>
            </Box>
    
            {/* Barra di ricerca */}
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
    
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
    
            {/* DataGrid con gestione selezione per studenti non assegnati */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <DataGrid
                    rows={prepareRowsForDataGrid(students || [])}
                    columns={columns}
                    pagination
                    pageSize={pageSize}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    rowCount={totalStudents}
                    page={page}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    autoHeight
                    disableSelectionOnClick
                    getRowId={(row) => row.id || row._id}
                    checkboxSelection={viewMode === 'unassigned'}
                    onSelectionModelChange={viewMode === 'unassigned' ? handleSelectionChange : undefined}
                    sx={{
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none'
                        }
                    }}
                />
            </Paper>
    
            {/* Azioni Batch per studenti non assegnati */}
            {viewMode === 'unassigned' && selectedStudents.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {selectedStudents.length} studenti selezionati
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleBatchAssign}
                        sx={{ mr: 1 }}
                    >
                        Assegna a Classe
                    </Button>
                </Box>
            )}
    

      {/* Dialog per assegnazione batch */}
      <Dialog
            open={assignDialogOpen}
            onClose={() => setAssignDialogOpen(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Assegna studenti alla classe</DialogTitle>
            <DialogContent>
                <Box sx={{ my: 2 }}>
                    <Typography gutterBottom>
                        Seleziona la classe per {selectedStudents.length} studenti:
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Classe</InputLabel>
                        <Select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            label="Classe"
                        >
                            {classes.map(classItem => (
                                <MenuItem 
                                    key={classItem.id} 
                                    value={classItem.id}
                                >
                                    {`${classItem.year}${classItem.section} - ${classItem.academicYear}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setAssignDialogOpen(false)}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleAssignConfirm}
                    variant="contained"
                    color="primary"
                >
                    Assegna
                </Button>
            </DialogActions>
        </Dialog>
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
    
            {/* Form Creazione/Modifica */}
            <StudentForm
                open={formOpen}
                onClose={handleFormClose}
                student={editingStudent}
                schoolId={null}
            />
        </Box>
    );
};

export default StudentList;