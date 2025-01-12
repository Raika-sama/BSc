// src/adminInterface/src/components/classes/ClassManagement.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Tooltip,
    Grid,
    Alert,
    Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';
import ClassForm from './ClassForm';
import { useAuth } from '../../context/AuthContext';
import { axiosInstance } from '../../services/axiosConfig';

const ClassManagement = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axiosInstance.get('/classes');
                if (response.data.status === 'success') {
                    setClasses(response.data.classes || []);
                }
            } catch (err) {
                console.error('Error fetching classes:', err);
                setError('Errore nel caricamento delle classi');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    const handleOpenForm = () => {
        setSelectedClass(null);
        setOpenDialog(true);
    };

    const handleCloseForm = () => {
        setOpenDialog(false);
        setSelectedClass(null);
    };

    const handleEdit = (classData) => {
        setSelectedClass(classData);
        setOpenDialog(true);
    };

    const handleDelete = async (classData) => {
        if (window.confirm('Sei sicuro di voler eliminare questa classe?')) {
            try {
                const response = await axiosInstance.delete(`/classes/${classData._id}`);
                if (response.data.status === 'success') {
                    setClasses(classes.filter(c => c._id !== classData._id));
                }
            } catch (err) {
                setError('Errore durante l\'eliminazione della classe');
            }
        }
    };

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            const url = selectedClass 
                ? `/classes/${selectedClass._id}`
                : '/classes';
            
            const method = selectedClass ? 'put' : 'post';
            
            const response = await axiosInstance[method](url, formData);

            if (response.data.status === 'success') {
                if (selectedClass) {
                    setClasses(classes.map(c => 
                        c._id === selectedClass._id ? response.data.class : c
                    ));
                } else {
                    setClasses([...classes, response.data.class]);
                }
                handleCloseForm();
            }
        } catch (err) {
            setError('Errore durante il salvataggio della classe');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { 
            field: 'year', 
            headerName: 'Anno', 
            width: 100,
            valueGetter: (params) => `${params.row.year}°`
        },
        { 
            field: 'section', 
            headerName: 'Sezione', 
            width: 120 
        },
        { 
            field: 'academicYear', 
            headerName: 'Anno Accademico', 
            width: 180 
        },
        {
            field: 'mainTeacher',
            headerName: 'Docente Principale',
            width: 200,
            valueGetter: (params) => 
                params.row.mainTeacher ? 
                `${params.row.mainTeacher.firstName || ''} ${params.row.mainTeacher.lastName || ''}` :
                ''
        },
        {
            field: 'students',
            headerName: 'Studenti',
            width: 130,
            valueGetter: (params) => params.row.students?.length || 0
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Modifica">
                        <IconButton 
                            size="small"
                            onClick={() => handleEdit(params.row)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(params.row)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <Typography variant="h5">
                            Gestione Classi
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenForm}
                        >
                            Nuova Classe
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={classes}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    loading={loading}
                    getRowId={(row) => row._id}
                    components={{
                        NoRowsOverlay: () => (
                            <Stack height="100%" alignItems="center" justifyContent="center">
                                <Typography>
                                    {loading ? 'Caricamento...' : 'Nessuna classe trovata'}
                                </Typography>
                            </Stack>
                        )
                    }}
                />
            </Paper>

            <ClassForm
                open={openDialog}
                onClose={handleCloseForm}
                onSubmit={handleSubmit}
                initialValues={selectedClass}
            />
        </Box>
    );
};

export default ClassManagement;