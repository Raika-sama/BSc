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

const ClassDetails = () => {
   const { classId } = useParams();
   const navigate = useNavigate();
   const { getClassDetails } = useClass();
   const [classData, setClassData] = useState(null);
   const [localError, setLocalError] = useState(null);
   const [localLoading, setLocalLoading] = useState(true);

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
            {/* Header compatto con info principali */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    {/* Colonna sinistra: Titolo e info principali */}
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
                            <Box>
                                <Chip
                                    icon={<AccessTimeIcon />}
                                    label={classData.status.toUpperCase()}
                                    color={classData.isActive ? "success" : "default"}
                                    size="small"
                                />
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                                <GroupIcon color="action" fontSize="small" />
                                <Typography variant="body2">
                                    {classData.students.length}/{classData.capacity} studenti
                                </Typography>
                            </Box>
                            {classData.mainTeacher && (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <PersonIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                        {`${classData.mainTeacher.firstName} ${classData.mainTeacher.lastName}`}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Colonna destra: Pulsanti */}
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/admin/classes')}
                            sx={{ mr: 2 }}
                            size="small"
                        >
                            Indietro
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<GroupAddIcon />}
                            onClick={() => navigate(`/admin/classes/${classId}/populate`)}
                            sx={{ mr: 2 }}
                            size="small"
                        >
                            Popola
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<QuizIcon />}
                            onClick={() => navigate(`/admin/classes/${classId}/tests`)}
                            size="small"
                        >
                            Test
                        </Button>
                    </Box>
                </Box>
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