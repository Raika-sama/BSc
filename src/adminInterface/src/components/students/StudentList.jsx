// src/components/students/StudentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { ContentLayout } from '../common/commonIndex';
import ListLayout from '../common/ListLayout';

import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    CloudUpload as CloudUploadIcon,
    School as SchoolIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    HourglassEmpty as PendingIcon,
    Block as BlockIcon,
    FilterList as FilterListIcon,
    People as PeopleIcon,
    Accessibility as AccessibilityIcon
} from '@mui/icons-material';
import { useStudent } from '../../context/StudentContext';
import { useNotification } from '../../context/NotificationContext';
import { StatCards } from './StatCards';
import { FilterToolbar } from './FilterToolbar';
import StudentBulkImportForm from './StudentBulkImportForm';
import AssignSchoolDialog from './AssignSchoolDialog';

const StudentList = () => {
    const navigate = useNavigate();
    const {
        students,
        loading,
        totalStudents,
        fetchStudents,
        deleteStudent
    } = useStudent();
    const { showNotification } = useNotification();

    // Stati essenziali
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [importFormOpen, setImportFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(0);
    const [assignSchoolOpen, setAssignSchoolOpen] = useState(false);

    // Filtri
    const [filters, setFilters] = useState({
        search: '',
        schoolId: '',
        classFilter: '',
        status: '',
        specialNeeds: ''
    });

    // Caricamento dati
    const loadStudents = async () => {
        try {
            const queryFilters = {
                page: page + 1,
                limit: pageSize,
                search: filters.search.trim(),
                schoolId: filters.schoolId,
                status: filters.status,
            };

            if (filters.specialNeeds !== '') {
                queryFilters.specialNeeds = filters.specialNeeds === 'true';
            }

            if (filters.classFilter) {
                const year = parseInt(filters.classFilter.match(/^\d+/)[0]);
                const section = filters.classFilter.slice(year.toString().length);
                queryFilters.year = year;
                queryFilters.section = section;
            }

            await fetchStudents(queryFilters);
        } catch (error) {
            showNotification('Errore nel caricamento degli studenti', 'error');
        }
    };

    useEffect(() => {
        loadStudents();
    }, [page, pageSize, filters]);

// Creiamo le stats cards utilizzando i dati degli studenti
const statsCards = useMemo(() => {
    const stats = {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        pendingStudents: students.filter(s => s.status === 'pending').length,
        specialNeedsStudents: students.filter(s => s.specialNeeds).length,
        assignedStudents: students.filter(s => s.classId).length
    };


    return [
        {
            title: 'Studenti Totali',
            value: stats.totalStudents,
            icon: PeopleIcon,         // Passa il riferimento al componente
            color: '#1976d2',
            subtitle: 'Totale studenti registrati'
        },
        {
            title: 'Studenti Attivi',
            value: stats.activeStudents,
            icon: CheckCircleIcon,    // Passa il riferimento al componente
            color: '#2e7d32',
            subtitle: `${((stats.activeStudents / stats.totalStudents) * 100).toFixed(1)}% del totale`
        },
        {
            title: 'In Attesa',
            value: stats.pendingStudents,
            icon: PendingIcon,        // Passa il riferimento al componente
            color: '#ed6c02',
            subtitle: 'Studenti in fase di registrazione'
        },
        {
            title: 'Necessità Speciali',
            value: stats.specialNeedsStudents,
            icon: AccessibilityIcon,  // Passa il riferimento al componente
            color: '#9c27b0',
            subtitle: 'Studenti con supporto dedicato'
        },
        {
            title: 'Assegnati',
            value: stats.assignedStudents,
            icon: SchoolIcon,         // Passa il riferimento al componente
            color: '#0288d1',
            subtitle: `${((stats.assignedStudents / stats.totalStudents) * 100).toFixed(1)}% assegnati a classi`
        }
    ];
}, [students]);

    // Handlers
    const handleDeleteClick = (student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteStudent(selectedStudent._id);
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
            showNotification('Studente eliminato con successo', 'success');
            loadStudents();
        } catch (error) {
            showNotification('Errore durante l\'eliminazione dello studente', 'error');
        }
    };

    // Configurazione colonne
    const columns = useMemo(() => [
        {
            field: 'fullName',
            headerName: 'Nome Completo',
            width: 200,
            valueGetter: (params) => 
                `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim()
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200
        },
        {
            field: 'schoolName',
            headerName: 'Scuola',
            width: 250,
            valueGetter: (params) => params.row.schoolId?.name || 'N/D'
        },
        {
            field: 'className',
            headerName: 'Classe',
            width: 120,
            renderCell: (params) => {
                const classInfo = params.row.classId;
                return classInfo ? (
                    <Chip
                        label={`${classInfo.year}${classInfo.section}`}
                        size="small"
                        sx={{
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText'
                        }}
                    />
                ) : 'N/D';
            }
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 130,
            renderCell: (params) => {
                const status = params.value || 'pending';
                const configs = {
                    active: { icon: CheckCircleIcon, label: 'Attivo', color: '#2e7d32' },
                    pending: { icon: PendingIcon, label: 'In Attesa', color: '#ed6c02' },
                    inactive: { icon: BlockIcon, label: 'Inattivo', color: '#d32f2f' }
                };
                const config = configs[status] || configs.pending;
                const Icon = config.icon;
                
                return (
                    <Chip
                        icon={<Icon sx={{ fontSize: '1rem' }} />}
                        label={config.label}
                        size="small"
                        sx={{ color: config.color }}
                    />
                );
            }
        },
        {
            field: 'mainTeacher',
            headerName: 'Docente Principale',
            width: 180,
            renderCell: (params) => {
                const teacher = params.row.mainTeacher;
                return teacher ? 
                    `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'N/D' 
                    : 'N/D';
            }
        },
        {
            field: 'testCount',
            headerName: 'Test Completati',
            width: 130,
            renderCell: (params) => {
                const count = params.row.testCount || 0;
                return (
                    <Chip
                        label={count}
                        size="small"
                        sx={{
                            bgcolor: count > 0 ? 'success.light' : 'grey.300',
                            color: count > 0 ? 'success.contrastText' : 'text.primary'
                        }}
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 120,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/students/${params.row._id}`)}
                        >
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(params.row)}
                            color="error"
                        >
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [navigate]);

    return (
        <ContentLayout
            title="Gestione Studenti"
            subtitle="Gestisci gli studenti e i loro dati"
            actions={
                <Box display="flex" gap={2}>
                    <Tooltip title="Filtri">
                        <IconButton 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            color="primary"
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<SchoolIcon />}
                        onClick={() => setAssignSchoolOpen(true)}
                        >
                        Assegna a Scuola
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => setImportFormOpen(true)}
                    >
                        Import Excel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/students/new')}
                    >
                        Nuovo Studente
                    </Button>
                </Box>
            }
        >
            <ListLayout
                statsCards={statsCards} // Modifica qui: passiamo direttamente l'array di cards
                isFilterOpen={isFilterOpen}
                filterComponent={
                    <FilterToolbar
                        filters={filters}
                        setFilters={setFilters}
                        onReset={() => setFilters({
                            search: '',
                            schoolId: '',
                            classFilter: '',
                            status: '',
                            specialNeeds: ''
                        })}
                    />
                }
                rows={students || []}
                columns={columns}
                getRowId={(row) => row._id}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                paginationMode="server"
                rowCount={totalStudents}
                page={page}
                onPageChange={setPage}
                loading={loading}
            />

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Conferma eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler eliminare lo studente 
                        {selectedStudent ? ` ${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}?
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
                    >
                        Elimina
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Form */}
            <StudentBulkImportForm 
                open={importFormOpen}
                onClose={() => {
                    setImportFormOpen(false);
                    loadStudents();
                }}
            />
            <AssignSchoolDialog
                open={assignSchoolOpen}
                onClose={(needsRefresh) => {
                    setAssignSchoolOpen(false);
                    if (needsRefresh) {
                        loadStudents(); // Ricarica la lista se sono state fatte modifiche
                    }
                }}
            />
        </ContentLayout>
    );
};

export default StudentList;