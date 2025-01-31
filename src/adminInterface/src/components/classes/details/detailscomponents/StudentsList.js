import React, { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Button,
    Tooltip,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Group as GroupIcon,
    GroupAdd as GroupAddIcon,
    Quiz as QuizIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../../../context/ClassContext';

const StudentsList = ({ 
    classData, 
    onAddStudent,
    onViewDetails,
    onEdit,
    pageSize,
    setPageSize,
    onNavigateToTests,
    fetchData
}) => {
    const navigate = useNavigate();
    const { removeStudentsFromClass } = useClass();
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleSelectionChange = (newSelection) => {
        setSelectedStudents(newSelection);
    };

        const handleRemoveStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            await removeStudentsFromClass(classData._id, selectedStudents);
            setConfirmDialogOpen(false);
            setSelectedStudents([]);
            fetchData(); // Ricarica i dati della classe
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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

    const getStatusColor = (status) => {
        const statusColors = {
            pending: '#fff3e0',
            active: '#e8f5e9',
            inactive: '#f5f5f5',
            transferred: '#e3f2fd',
            graduated: '#f3e5f5'
        };
        return statusColors[status] || '#f5f5f5';
    };

    const studentColumns = [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            width: 180,
            flex: 1,
            valueGetter: (params) => 
                `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() || 'N/D',
            renderCell: (params) => (
                <Typography sx={{ fontSize: '0.875rem' }}>
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'gender',
            headerName: 'Genere',
            width: 90,
            renderCell: (params) => (
                <Typography sx={{ fontSize: '0.875rem' }}>
                    {params.row.gender === 'M' ? 'Maschio' : 
                     params.row.gender === 'F' ? 'Femmina' : 'N/D'}
                </Typography>
            )
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            flex: 1,
            renderCell: (params) => (
                <Typography sx={{ fontSize: '0.875rem', color: '#1976d2' }}>
                    {params.value || 'N/D'}
                </Typography>
            )
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.value)}
                    size="small"
                    sx={{
                        height: '24px',
                        fontSize: '0.75rem',
                        backgroundColor: getStatusColor(params.value),
                        '& .MuiChip-label': {
                            px: 1.5
                        }
                    }}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 130,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Test Studente">
                        <span>
                            <IconButton 
                                onClick={() => onNavigateToTests(params.row.id)}
                                size="small"
                                disabled
                            >
                                <QuizIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton 
                            onClick={() => onViewDetails(params.row)}
                            size="small"
                        >
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica Studente">
                        <IconButton 
                            onClick={() => onEdit(params.row)}
                            size="small"
                        >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    const rows = classData.students.map(student => {
        const studentData = student.studentId || student;
        return {
            id: studentData._id,
            firstName: studentData.firstName || 'N/D',
            lastName: studentData.lastName || 'N/D',
            email: studentData.email || 'N/D',
            status: student.status || 'N/D',
            joinedAt: student.joinedAt || 'N/D',
            gender: studentData.gender || 'N/D'
        };
    });

    return (
        <>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography 
                            variant="h6" 
                            color="primary" 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                fontSize: '1.1rem',
                                fontWeight: 500 
                            }}
                        >
                            <GroupIcon sx={{ mr: 1 }} />
                            Lista Studenti
                            <Chip 
                                label={`${classData.students.length}/${classData.capacity} studenti`}
                                color={classData.students.length > 0 ? "primary" : "warning"}
                                size="small"
                                sx={{ ml: 2 }}
                            />
                        </Typography>
                        {selectedStudents.length > 0 && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setConfirmDialogOpen(true)}
                                size="small"
                            >
                                Rimuovi {selectedStudents.length} studenti
                            </Button>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<GroupAddIcon />}
                        onClick={onAddStudent}
                        size="small"
                    >
                        Aggiungi Studente
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={rows}
                        columns={studentColumns}
                        pageSize={pageSize}
                        rowsPerPageOptions={[25, 50, 100]}
                        onPageSizeChange={setPageSize}
                        disableSelectionOnClick={false}
                        checkboxSelection
                        onSelectionModelChange={handleSelectionChange}
                        selectionModel={selectedStudents}
                        density="compact"
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                fontSize: '0.875rem',
                                py: 0.5
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                fontSize: '0.875rem',
                                minHeight: '45px !important',
                                maxHeight: '45px !important',
                                backgroundColor: '#f5f5f5'
                            },
                            '& .MuiDataGrid-row': {
                                minHeight: '40px !important',
                                maxHeight: '40px !important',
                                '&:nth-of-type(odd)': {
                                    backgroundColor: '#fafafa'
                                },
                                '&:hover': {
                                    backgroundColor: '#f5f5f5'
                                }
                            }
                        }}
                    />
                </Box>
            </Paper>

            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>
                    Conferma Rimozione
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler rimuovere {selectedStudents.length} studenti dalla classe?
                        Gli studenti torneranno disponibili per essere riassegnati.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmDialogOpen(false)}
                        disabled={loading}
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleRemoveStudents}
                        color="error"
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Rimozione in corso...' : 'Rimuovi'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default StudentsList;