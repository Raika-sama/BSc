import React, { useEffect, useState, useMemo } from 'react';
import { 
    Box, 
    Alert,
    CircularProgress, 
    Paper,
    IconButton,
    Tooltip,
    Button, 
    Chip, 
    Typography
 } from '@mui/material';
 import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Quiz as QuizIcon,
    Group as GroupIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as PendingIcon,
    Groups as GroupsIcon,
    GroupAdd as GroupAddIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../../context/ClassContext';
import ListLayout from '../../common/ListLayout';

// Components
import HeaderSection from './detailscomponents/HeaderSection';
import InfoSection from './detailscomponents/InfoSection';
import StudentDetailsDialog from './detailscomponents/StudentDetailsDialog';
import StudentForm from '../../students/StudentForm';
import StudentClassForm from './forms/StudentClassForm';
import TeacherForm from './forms/TeacherForm'; // Aggiungi questo import

const ClassDetails = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails, removeMainTeacher } = useClass(); // Aggiungi removeMainTeacher
    const [classData, setClassData] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [expandedInfo, setExpandedInfo] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [pageSize, setPageSize] = useState(25);
    const [studentFormOpen, setStudentFormOpen] = useState(false);
    const [teacherFormOpen, setTeacherFormOpen] = useState(false); // Nuovo stato per il form docente

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setDetailsDialogOpen(true);
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setFormOpen(true);
    };

    const handleNavigateToTests = (studentId) => {
        navigate(`/admin/students/${studentId}/tests`);
    };

    // Poi definiamo le colonne con useMemo
    const studentColumns = useMemo(() => [
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
            renderCell: (params) => {
                const statusConfig = {
                    active: { color: 'success', label: 'Attivo' },
                    pending: { color: 'warning', label: 'In Attesa' },
                    inactive: { color: 'default', label: 'Inattivo' }
                };
                const config = statusConfig[params.value] || { color: 'default', label: params.value };
                
                return (
                    <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                        sx={{ height: '24px', fontSize: '0.75rem' }}
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
                        <IconButton 
                            onClick={() => handleNavigateToTests(params.row.id)}
                            size="small"
                            disabled
                        >
                            <QuizIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Visualizza Dettagli">
                        <IconButton 
                            onClick={() => handleViewDetails(params.row)}
                            size="small"
                        >
                            <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifica Studente">
                        <IconButton 
                            onClick={() => handleEdit(params.row)}
                            size="small"
                        >
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [handleNavigateToTests, handleViewDetails, handleEdit, navigate]);


     // Funzione per caricare i dati della classe
     const loadClassData = async () => {
        if (!classId) {
            setLocalError("ID classe non fornito");
            setLocalLoading(false);
            return;
        }
        
        try {
            setLocalLoading(true);
            const response = await getClassDetails(classId);
            setClassData(response);
            setLocalError(null);
        } catch (err) {
            setLocalError(err.message || 'Errore nel caricamento dei dati della classe');
            console.error('Errore nel caricamento:', err);
        } finally {
            setLocalLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initializeData = async () => {
            if (isMounted) {
                await loadClassData();
            }
        };

        initializeData();

        return () => {
            isMounted = false;
        };
    }, [classId, getClassDetails]);

  

   // Nuove funzioni per gestire il docente principale
   const handleAddMainTeacher = () => {
    setTeacherFormOpen(true);
    };

    const handleRemoveMainTeacher = async () => {
        try {
            const confirmed = window.confirm(
                'Sei sicuro di voler rimuovere il docente principale?'
            );
    
            if (confirmed) {
                await removeMainTeacher(classId);
                await loadClassData();
            }
        } catch (error) {
            setLocalError('Errore durante la rimozione del docente principale');
            console.error('Error removing main teacher:', error);
        }
    };

    if (localLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (localError) {
        return <Alert severity="error">{localError}</Alert>;
    }

    if (!classData) {
        return <Alert severity="info">Nessun dato disponibile per questa classe.</Alert>;
    }

      // Configurazione delle stat cards per la lista studenti
      const statsCards = [
        {
            title: 'Totale Studenti',
            value: classData?.students?.length || 0,
            icon: <GroupIcon />,
            color: 'primary.main'
        },
        {
            title: 'Studenti Attivi',
            value: classData?.students?.filter(s => s.status === 'active').length || 0,
            icon: <CheckCircleIcon />,
            color: 'success.main'
        },
        {
            title: 'In Attesa',
            value: classData?.students?.filter(s => s.status === 'pending').length || 0,
            icon: <PendingIcon />,
            color: 'warning.main'
        },
        {
            title: 'Capacità',
            value: `${classData?.students?.length || 0}/${classData?.capacity || 0}`,
            icon: <GroupsIcon />,
            color: 'info.main'
        }
    ];


    return (
        <Box p={3}>
            {/* Header e Info Section rimangono uguali */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <HeaderSection
                    classData={classData}
                    expandedInfo={expandedInfo}
                    setExpandedInfo={setExpandedInfo}
                    onBack={() => navigate('/admin/classes')}
                    onPopulate={() => navigate(`/admin/classes/${classId}/populate`)}
                    onTests={() => navigate(`/admin/classes/${classId}/tests`)}
                    onSendTest={() => {}}
                />
                
                <InfoSection 
                    expandedInfo={expandedInfo}
                    classData={classData}
                    onAddMainTeacher={handleAddMainTeacher}
                    onRemoveMainTeacher={handleRemoveMainTeacher}
                />
            </Paper>

            {/* Sostituiamo StudentsList con ListLayout */}
            <ListLayout
                statsCards={statsCards}
                rows={classData?.students?.map(student => ({
                    id: student.studentId._id,
                    firstName: student.studentId.firstName,
                    lastName: student.studentId.lastName,
                    email: student.studentId.email,
                    status: student.status,
                    gender: student.studentId.gender,
                    joinedAt: student.joinedAt
                })) || []}
                columns={studentColumns}
                getRowId={(row) => row.id}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                loading={localLoading} 
                headerActions={
                    <Button
                        variant="contained"
                        startIcon={<GroupAddIcon />}
                        onClick={() => setStudentFormOpen(true)}
                        size="small"
                    >
                        Aggiungi Studente
                    </Button>
                }
            />

            {/* Dialog e Form rimangono uguali */}
            <StudentDetailsDialog 
                open={detailsDialogOpen}
                onClose={() => {
                    setDetailsDialogOpen(false);
                    setSelectedStudent(null);
                }}
                student={selectedStudent}
            />

            <StudentForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedStudent(null);
                    loadClassData();
                }}
                student={selectedStudent}
            />

            <StudentClassForm 
                open={studentFormOpen}
                onClose={(shouldRefresh) => {
                    setStudentFormOpen(false);
                    if (shouldRefresh) {
                        loadClassData();
                    }
                }}
                classData={classData}
            />

            <TeacherForm 
                open={teacherFormOpen}
                onClose={(shouldRefresh) => {
                    setTeacherFormOpen(false);
                    if (shouldRefresh) {
                        loadClassData();
                    }
                }}
                classData={{
                    ...classData,
                    schoolId: classData?.schoolId
                }}                
                isMainTeacher={true}
            />
        </Box>
    );
};

export default ClassDetails;