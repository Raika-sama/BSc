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
    Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';
import StudentForm from './StudentForm';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [formOpen, setFormOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);


    useEffect(() => {
        fetchStudents();
    }, []);

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

    const columns = [
        { 
            field: 'fiscalCode', 
            headerName: 'Codice Fiscale', 
            width: 150 
        },
        { 
            field: 'lastName', 
            headerName: 'Cognome', 
            width: 150,
            valueGetter: (params) => params.row.lastName?.toUpperCase()
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
            width: 200 
        },
        {
            field: 'school',
            headerName: 'Scuola',
            width: 200,
            valueGetter: (params) => params.row.schoolId?.name || 'N/D'
        },
        {
            field: 'class',
            headerName: 'Classe',
            width: 150,
            valueGetter: (params) => {
                const classInfo = params.row.classId;
                if (!classInfo) return 'Non assegnata';
                return `${classInfo.year}${classInfo.section}`;
            }
        },
        {
            field: 'currentYear',
            headerName: 'Anno',
            width: 100,
            align: 'center',
            headerAlign: 'center'
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <DataGrid
                    rows={students}
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
                    getRowId={(row) => row.id}
                    sx={{
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none'
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
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                    >
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
                schoolId={null} // se necessario, passa lo schoolId per filtrare
            />
        </Box>
    );
};

export default StudentList;