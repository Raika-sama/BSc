// src/adminInterface/src/components/classes/ClassManagement.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Tooltip,
    Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from '@mui/x-data-grid';
import ClassForm from './ClassForm';

const ClassManagement = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [error, setError] = useState(null);

    // Gestione apertura/chiusura form
    const handleOpenForm = () => {
        setSelectedClass(null);
        setOpenDialog(true);
    };

    const handleCloseForm = () => {
        setOpenDialog(false);
        setSelectedClass(null);
    };

    // Gestione edit
    const handleEdit = (classData) => {
        setSelectedClass(classData);
        setOpenDialog(true);
    };

    // Gestione delete
    const handleDelete = async (classData) => {
        if (window.confirm('Sei sicuro di voler eliminare questa classe?')) {
            try {
                const response = await fetch(`/api/v1/classes/${classData._id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setClasses(classes.filter(c => c._id !== classData._id));
                } else {
                    throw new Error('Errore durante l\'eliminazione della classe');
                }
            } catch (error) {
                setError(error.message);
            }
        }
    };

    // Gestione submit form
    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            const url = selectedClass 
                ? `/api/v1/classes/${selectedClass._id}`
                : '/api/v1/classes';
            
            const method = selectedClass ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                if (selectedClass) {
                    setClasses(classes.map(c => 
                        c._id === selectedClass._id ? data.class : c
                    ));
                } else {
                    setClasses([...classes, data.class]);
                }
                handleCloseForm();
            } else {
                throw new Error(data.message || 'Errore durante il salvataggio della classe');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch iniziale delle classi
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/v1/classes');
                const data = await response.json();
                
                if (response.ok) {
                    setClasses(data.classes);
                } else {
                    throw new Error(data.message || 'Errore nel caricamento delle classi');
                }
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

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