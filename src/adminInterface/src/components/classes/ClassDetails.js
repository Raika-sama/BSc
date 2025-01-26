import React, { useEffect, useState } from 'react';
import {
   Box,
   Typography,
   Paper,
   Grid,
   Chip,
   IconButton,
   Collapse,
   CircularProgress,
   Dialog,                // Aggiunto
   DialogTitle,           // Aggiunto
   DialogContent,         // Aggiunto
   DialogActions,         // Aggiunto
   Button,
   Alert,
   Divider,
   Tooltip               // Aggiunto

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../context/ClassContext';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizIcon from '@mui/icons-material/Quiz';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';      // Aggiunto
import VisibilityIcon from '@mui/icons-material/Visibility';  // Aggiunto
import SendIcon from '@mui/icons-material/Send';  // Aggiungi questo import con gli altri
import StudentClassForm from './StudentClassForm';


// Components
import StudentForm from '../students/StudentForm';

const ClassDetails = () => {
   const { classId } = useParams();
   const navigate = useNavigate();
   const { getClassDetails } = useClass();
   const [classData, setClassData] = useState(null);
   const [localError, setLocalError] = useState(null);
   const [localLoading, setLocalLoading] = useState(true);
   const [expandedInfo, setExpandedInfo] = useState(false);
   const [selectedStudent, setSelectedStudent] = useState(null);
   const [formOpen, setFormOpen] = useState(false);
   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
   const [pageSize, setPageSize] = useState(25);  // Default a 25 come richiesto
   const [studentFormOpen, setStudentFormOpen] = useState(false);

   const fetchData = async () => {
    try {
        const response = await getClassDetails(classId);
        setClassData(response);
    } catch (err) {
        setLocalError(err.message);
    } finally {
        setLocalLoading(false);
    }
};

   const handleViewDetails = (student) => {
       setSelectedStudent(student);
       setDetailsDialogOpen(true);
   };

   const handleEdit = (student) => {
       setSelectedStudent(student);
       setFormOpen(true);
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
   
   useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await getClassDetails(classId);
            console.log("Response:", response); // Debug log
            setClassData(response); // Rimuovi .class perché i dati sono già nell'oggetto response
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setLocalLoading(false);
        }
    };

    if (classId) {
        fetchData();
    }
}, [classId]);
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

   // E modifichiamo il DataGrid così:
   const rows = classData.students.map(student => {
    console.log("Raw student data:", student);
    
    const studentData = student.studentId || student;
    
    return {
        id: studentData._id, // Usa l'ID dello studente, non del record della classe
        firstName: studentData.firstName || 'N/D',
        lastName: studentData.lastName || 'N/D',
        email: studentData.email || 'N/D',
        status: student.status || 'N/D',
        joinedAt: student.joinedAt || 'N/D'
    };
});

// Modifichiamo anche le colonne per essere più semplici inizialmente:
const studentColumns = [
    {
        field: 'firstName',
        headerName: 'Nome Completo',
        width: 180,
        flex: 1,
        renderCell: (params) => (
            <Typography sx={{ fontSize: '0.875rem' }}>
                {`${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() || 'N/D'}
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
                {params.row.email || 'N/D'}
            </Typography>
        )
    },
    {
        field: 'status',
        headerName: 'Stato',
        width: 100,
        renderCell: (params) => {
            const status = params.row.status;
            return (
                <Chip
                    label={getStatusLabel(status)}
                    size="small"
                    sx={{
                        height: '24px',
                        fontSize: '0.75rem',
                        backgroundColor: getStatusColor(status),
                        '& .MuiChip-label': {
                            px: 1.5
                        }
                    }}
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
                <Tooltip title="Test">
                    <IconButton 
                        onClick={() => navigate(`/admin/students/${params.row._id}/tests`)}
                        size="small"
                    >
                        <QuizIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Visualizza">
                    <IconButton 
                        onClick={() => handleViewDetails(params.row)}
                        size="small"
                    >
                        <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Modifica">
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
];

const StudentDetailsDialog = ({ open, onClose, student }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Dettagli Studente</DialogTitle>
            <DialogContent>
                {student && (
                    <Grid container spacing={2}>
                        {/* ... stessi campi di StudentList ... */}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Chiudi</Button>
            </DialogActions>
        </Dialog>
    );
};

console.log("Students data:", classData.students);

    return (
        <Box p={3}>
            {/* Header con toggle */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                {/* Header compatto sempre visibile */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={4}>
                        <Box>
                            <Typography variant="h5" color="primary" gutterBottom={false}>
                                Classe {classData.year}{classData.section}
                            </Typography>
                            <Typography variant="subtitle2" color="text.secondary">
                                Anno Accademico: {classData.academicYear}
                            </Typography>
                        </Box>
                        <Box display="flex" gap={3}>
                            <Chip
                                icon={<AccessTimeIcon />}
                                label={classData.status.toUpperCase()}
                                color={classData.isActive ? "success" : "default"}
                                size="small"
                            />
                            <Chip
                                icon={<SchoolIcon />}
                                label={classData.schoolId.name}
                                color="primary"
                                size="small"
                            />
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center">
                        {/* Pulsanti azione */}
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/admin/classes')}
                            sx={{ mr: 1 }}
                            size="small"
                        >
                            Indietro
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<GroupAddIcon />}
                            onClick={() => navigate(`/admin/classes/${classId}/populate`)}
                            sx={{ mr: 1 }}
                            size="small"
                        >
                            Popola
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<QuizIcon />}
                            onClick={() => navigate(`/admin/classes/${classId}/tests`)}
                            sx={{ mr: 2 }}
                            size="small"
                        >
                            Test
                        </Button>
                        {/* Nuovo pulsante per inviare test alla classe */}
                        <Button
                            variant="contained"
                            color="secondary"  // Colore diverso per distinguerlo
                            startIcon={<SendIcon />}  // Dobbiamo aggiungere l'import
                            onClick={() => {/* TODO: Implementare la funzionalità */}}
                            sx={{ mr: 2 }}
                            size="small"
                        >
                            Invia Test
                        </Button>
                        <IconButton 
                            onClick={() => setExpandedInfo(!expandedInfo)}
                            size="small"
                        >
                            {expandedInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                </Box>

                {/* Informazioni dettagliate espandibili */}
                <Collapse in={expandedInfo}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    Dettagli Classe
                                </Typography>
                                <InfoField label="ID Classe" value={classData._id} />
                                <InfoField label="ID Scuola" value={classData.schoolId._id} />
                                <InfoField label="Scuola" value={classData.schoolId.name} />
                                <InfoField label="Capacità" value={`${classData.students.length}/${classData.capacity}`} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Docente Principale
                            </Typography>
                            {classData.mainTeacher && (
                                <Box>
                                    <InfoField label="Nome" value={`${classData.mainTeacher.firstName} ${classData.mainTeacher.lastName}`} />
                                    <InfoField label="Email" value={classData.mainTeacher.email} />
                                    <InfoField label="ID" value={classData.mainTeacher._id} />
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Altri Docenti
                            </Typography>
                            {classData.teachers && classData.teachers.length > 0 ? (
                                classData.teachers.map((teacher, index) => (
                                    <Box key={teacher._id} sx={{ mb: 1 }}>
                                        <Typography variant="body2">{`${teacher.firstName} ${teacher.lastName}`}</Typography>
                                        <Typography variant="caption" color="text.secondary">{teacher.email}</Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Nessun docente aggiuntivo
                                </Typography>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                                Ultima modifica: {new Date(classData.updatedAt).toLocaleString()}
                            </Typography>
                        </Grid>
                    </Grid>
                </Collapse>
            </Paper>

            {/* Tabella Studenti migliorata */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                }}>
                    <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon sx={{ mr: 1 }} />
                        Lista Studenti
                        <Chip 
                            label={`${classData.students.length}/${classData.capacity} studenti`}
                            color={classData.students.length > 0 ? "primary" : "warning"}
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    </Typography>
                    <Button
                            variant="contained"
                            startIcon={<GroupAddIcon />}
                            onClick={() => setStudentFormOpen(true)}
                            sx={{ mr: 1 }}
                            size="small"
                        >
                            Aggiungi Studente
                        </Button>
                </Box>

                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={rows}
                        columns={studentColumns}
                        pageSize={pageSize}
                        rowsPerPageOptions={[25, 50, 100]}
                        onPageSizeChange={setPageSize}
                        disableSelectionOnClick
                        density="compact"
                        sx={{
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
                                }
                            }
                        }}
                    />
                </Box>
            </Paper>

            {/* Dialog Dettagli Studente */}
            <StudentDetailsDialog 
                open={detailsDialogOpen}
                onClose={() => setDetailsDialogOpen(false)}
                student={selectedStudent}
            />

            {/* Form Modifica Studente */}
            <StudentForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedStudent(null);
                    // Ricarica i dati della classe
                    fetchData();
                }}
                student={selectedStudent}
            />

            {/* Nuovo Form Aggiunta Studente */}
            <StudentClassForm 
                open={studentFormOpen}
                onClose={() => {
                    setStudentFormOpen(false);
                    fetchData(); // Ricarica i dati della classe
                }}
                classData={classData}
            />
        </Box>
    );
};

const InfoField = ({ icon, label, value, color = "textSecondary" }) => (
   <Box mb={1.5} display="flex" alignItems="center">
       {icon && <Box sx={{ mr: 1, color }}>{icon}</Box>}
       <Box>
           <Typography variant="subtitle2" color={color}>{label}</Typography>
           <Typography variant="body1">{value}</Typography>
       </Box>
   </Box>
);

export default ClassDetails;