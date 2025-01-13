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
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { useClass } from '../../context/ClassContext';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QuizIcon from '@mui/icons-material/Quiz';
import { useNavigate } from 'react-router-dom';

const ClassManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const { mainTeacherClasses = [], coTeacherClasses = [], loading, error, getMyClasses, deleteClass } = useClass();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        getMyClasses();
    }, []);

    const handleDeleteClick = (classData) => {
        setSelectedClass(classData);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteClass(selectedClass.classId);
            setOpenDeleteDialog(false);
            setSelectedClass(null);
            getMyClasses(); // Ricarica le classi dopo l'eliminazione
        } catch (err) {
            setDeleteError('Errore durante l_eliminazione della classe');
        }
    };

    const handleViewDetails = (classData) => {
        navigate(`/admin/classes/${classData.classId}`);
    };

    const handleTestManagement = (classData) => {
        navigate(`/admin/classes/${classData.classId}/tests`);
    };

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
                Gestione Classi
            </Typography>

            <Paper sx={{ 
                width: '100%', 
                mb: 2, 
                borderRadius: 2,
                boxShadow: 3
            }}>
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
                        label={`Le mie classi (${mainTeacherClasses.length})`}
                        sx={{ textTransform: 'none' }}
                    />
                    <Tab 
                        label={`Classi co-insegnate (${coTeacherClasses.length})`}
                        sx={{ textTransform: 'none' }}
                    />
                </Tabs>

                <Box sx={{ height: 500, width: '100%', p: 2 }}>
                    <DataGrid
                        rows={tabValue === 0 ? mainTeacherClasses : coTeacherClasses}
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
            </Paper>

            {/* Dialog di conferma eliminazione */}
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