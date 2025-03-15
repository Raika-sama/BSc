import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Button,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Group as GroupIcon,
    GroupAdd as GroupAddIcon,
    Quiz as QuizIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useClass } from '../../../../context/ClassContext';
import ListLayout from '../../../common/ListLayout';

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


    const handleRemoveStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            await removeStudentsFromClass(classData._id, selectedStudents);
            setConfirmDialogOpen(false);
            setSelectedStudents([]);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Definizione delle colonne
    const columns = useMemo(() => [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            width: 180,
            flex: 1,
            valueGetter: (params) => 
                `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() || 'N/D'
        },
        {
            field: 'gender',
            headerName: 'Genere',
            width: 90,
            valueFormatter: (params) => 
                params.value === 'M' ? 'Maschio' : 
                params.value === 'F' ? 'Femmina' : 'N/D'
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            flex: 1
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 120,
            renderCell: (params) => {
                const statusConfig = {
                    pending: { label: 'In Attesa', color: 'warning' },
                    active: { label: 'Attivo', color: 'success' },
                    inactive: { label: 'Inattivo', color: 'default' },
                    transferred: { label: 'Trasferito', color: 'info' },
                    graduated: { label: 'Diplomato', color: 'secondary' }
                };
                const config = statusConfig[params.value] || { label: params.value, color: 'default' };
                
                return (
                    <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                        variant="outlined"
                    />
                );
            }
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
                                <QuizIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton 
                            onClick={() => navigate(`/admin/students/${params.row.id}`, {
                                state: { 
                                    from: 'class',
                                    classId: classData._id
                                }
                            })}
                            size="small"
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica Studente">
                        <IconButton 
                            onClick={() => onEdit(params.row)}
                            size="small"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [onNavigateToTests, navigate, onEdit, classData._id]);

    // Preparazione dei dati
    const rows = useMemo(() => 
        classData.students.map(student => {
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
        }), [classData.students]);

    // Azioni personalizzate
    const customActions = useMemo(() => (
        <Box sx={{ display: 'flex', gap: 1 }}>
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
    ), [selectedStudents.length, onAddStudent]);

    return (
        <>
            <ListLayout
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                loading={loading}
                error={error}
                customActions={customActions}
                emptyStateMessage="Nessuno studente presente in questa classe"
                checkboxSelection
                onSelectionModelChange={setSelectedStudents}
                selectionModel={selectedStudents}
                sx={{
                    '& .MuiDataGrid-row': {
                        cursor: 'pointer'
                    }
                }}
            />

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