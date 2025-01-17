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

   return (
       <Box p={3}>
           <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
               <Typography variant="h4" color="primary">
                   Classe {classData.year}{classData.section}
               </Typography>
               <Box>
                   <Button
                       variant="outlined"
                       startIcon={<ArrowBackIcon />}
                       onClick={() => navigate('/admin/classes')}
                       sx={{ mr: 2 }}
                   >
                       Indietro
                   </Button>
                   <Button
                        variant="contained"
                        startIcon={<GroupAddIcon />}
                        onClick={() => navigate(`/admin/classes/${classId}/populate`)}
                        sx={{ mr: 2 }}
                    >
                        Popola Classe
                    </Button>
                   <Button
                       variant="contained"
                       startIcon={<QuizIcon />}
                       onClick={() => navigate(`/admin/classes/${classId}/tests`)}
                   >
                       Gestione Test
                   </Button>
               </Box>
           </Box>

           <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
               <Grid container spacing={3}>
                   <Grid item xs={12} md={4}>
                       <Box sx={{ mb: 2 }}>
                           <Typography variant="h6" color="primary" gutterBottom>
                               Informazioni Generali
                           </Typography>
                           <InfoField icon={<AccessTimeIcon />} label="Anno Accademico" value={classData.academicYear} />
                           <InfoField label="Status" value={classData.status.toUpperCase()} color="primary" />
                           <InfoField label="Capacità" value={`${classData.capacity} studenti`} />
                           <InfoField label="Stato" value={classData.isActive ? 'Attiva' : 'Non Attiva'} />
                       </Box>
                   </Grid>

                   <Grid item xs={12} md={4}>
                       <Typography variant="h6" color="primary" gutterBottom>
                           <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                           Docente Principale
                       </Typography>
                       {classData.mainTeacher && (
                           <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                               <Typography variant="subtitle1">{`${classData.mainTeacher.firstName} ${classData.mainTeacher.lastName}`}</Typography>
                               <Typography variant="body2" color="textSecondary">{classData.mainTeacher.email}</Typography>
                           </Box>
                       )}
                   </Grid>

                   <Grid item xs={12} md={4}>
                       <Typography variant="h6" color="primary" gutterBottom>
                           <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                           Statistiche
                       </Typography>
                       <InfoField label="Totale Studenti" value={classData.students.length} />
                       <InfoField label="Totale Docenti" value={classData.teachers.length} />
                   </Grid>

                   <Grid item xs={12}>
                       <Divider sx={{ my: 2 }} />
                       <Typography variant="caption" color="textSecondary" display="block">
                           Ultima modifica: {new Date(classData.updatedAt).toLocaleString()}
                       </Typography>
                   </Grid>
               </Grid>
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