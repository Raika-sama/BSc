import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import { useClass } from '../../context/ClassContext';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ClassPopulate = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails } = useClass();
    const { fetchUnassignedStudents } = useStudent();

    const [classData, setClassData] = useState(null);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
    
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
    
                const details = await getClassDetails(classId);
                console.log('Class details received:', details);
    
                if (!isMounted) return;
                
                if (details) {
                    setClassData(details);
                    
                    const schoolId = details.schoolId._id || details.schoolId;
                    console.log('Extracted schoolId:', schoolId);
                    
                    if (schoolId) {
                        const students = await fetchUnassignedStudents(schoolId);
                        console.log('Fetched unassigned students:', students);
                        
                        if (isMounted) {
                            const formattedStudents = (students || []).map(student => ({
                                ...student,
                                id: student._id || student.id,
                                firstName: student.firstName || '',
                                lastName: student.lastName || '',
                                fiscalCode: student.fiscalCode || '',
                                email: student.email || '',
                                currentYear: student.currentYear || ''
                            }));
                            setUnassignedStudents(formattedStudents);
                        }
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error loading data:', err);
                    setError(err.message || 'Errore nel caricamento dei dati');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
    
        if (classId) {
            loadData();
        }
    
        return () => {
            isMounted = false;
        };
    // Rimuovi getClassDetails e fetchUnassignedStudents dalle dipendenze
    }, [classId]);

    const columns = [
    {
        field: 'firstName',
        headerName: 'Nome',
        width: 150,
    },
    {
        field: 'lastName',
        headerName: 'Cognome',
        width: 150,
    },
    {
        field: 'email',
        headerName: 'Email',
        width: 200,
    },
    {
        field: 'gender',
        headerName: 'Genere',
        width: 100,
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
                <Alert 
                    severity="error" 
                    action={
                        <Button 
                            color="inherit" 
                            size="small" 
                            onClick={() => window.location.reload()}
                        >
                            Riprova
                        </Button>
                    }
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Popola Classe {classData?.year}{classData?.section}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/classes')}
                >
                    Indietro
                </Button>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
                <Box p={2}>
                    <Typography variant="h6" gutterBottom>
                        Informazioni Classe
                    </Typography>
                    <Typography>
                        Anno Accademico: {classData?.academicYear}
                    </Typography>
                    <Typography>
                        Capacità: {classData?.students?.length || 0}/{classData?.capacity || 0} studenti
                    </Typography>
                </Box>
            </Paper>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <DataGrid
                    rows={unassignedStudents}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                    disableSelectionOnClick
                    autoHeight
                    getRowId={(row) => row._id || row.id}
                    onSelectionModelChange={(newSelection) => {
                        setSelectedStudents(newSelection);
                        console.log('Selected students:', newSelection);
                    }}
                    selectionModel={selectedStudents}
                />
            </Paper>

            {selectedStudents.length > 0 && (
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                    >
                        Assegna {selectedStudents.length} studenti
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ClassPopulate;