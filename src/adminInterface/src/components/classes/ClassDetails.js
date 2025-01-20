import React, { useEffect, useState } from 'react';
import {
   Box,
   Typography,
   Paper,
   Grid,
   CircularProgress,
   Button,
   Alert,
   Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../context/ClassContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizIcon from '@mui/icons-material/Quiz';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupAddIcon from '@mui/icons-material/GroupAdd'; // Aggiungi questo import
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SchoolIcon from '@mui/icons-material/School';
import { IconButton, Collapse } from '@mui/material';

const ClassDetails = () => {
   const { classId } = useParams();
   const navigate = useNavigate();
   const { getClassDetails } = useClass();
   const [classData, setClassData] = useState(null);
   const [localError, setLocalError] = useState(null);
   const [localLoading, setLocalLoading] = useState(true);
   const [expandedInfo, setExpandedInfo] = useState(false);

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
    console.log("Raw student data:", student); // Vediamo la struttura esatta
    
    // Se lo studente è annidato in studentId
    const studentData = student.studentId || student;
    
    return {
        id: studentData._id || student._id,
        firstName: studentData.firstName || 'N/D',
        lastName: studentData.lastName || 'N/D',
        email: studentData.email || 'N/D',
        status: studentData.status || 'N/D',
        joinedAt: studentData.createdAt || 'N/D'
    };
});

// Modifichiamo anche le colonne per essere più semplici inizialmente:
const studentColumns = [
    {
        field: 'firstName',
        headerName: 'Nome',
        width: 150
    },
    {
        field: 'lastName',
        headerName: 'Cognome',
        width: 150
    },
    {
        field: 'email',
        headerName: 'Email',
        width: 250
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 120
    }
];


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

            {/* Tabella Studenti con più spazio */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon sx={{ mr: 1 }} />
                        Lista Studenti
                        <Chip 
                            label={`${classData.students.length} studenti`}
                            color={classData.students.length > 0 ? "primary" : "warning"}
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    </Typography>
                </Box>

                <Box sx={{ height: 600, width: '100%' }}> {/* Aumentata l'altezza della tabella */}
                    <DataGrid
                        rows={rows}
                        columns={studentColumns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10, page: 0 }, // Aumentato il numero di righe
                            },
                        }}
                        pageSizeOptions={[10, 25, 50]} // Modificate le opzioni di paginazione
                        disableRowSelectionOnClick
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