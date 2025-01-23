import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import { useClass } from '../../context/ClassContext';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupAddIcon from '@mui/icons-material/GroupAdd';


const ClassPopulate = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails } = useClass();
    const { fetchUnassignedStudents, batchAssignStudents } = useStudent();
    const [classData, setClassData] = useState(null);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assigning, setAssigning] = useState(false);

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
                    
                    const schoolId = details.schoolId?._id || details.schoolId;
                    console.log('School ID extracted:', schoolId);
                    
                    if (schoolId) {
                        const students = await fetchUnassignedStudents(schoolId);
                        console.log('Fetched unassigned students:', students);
                        
                        if (isMounted) {
                            // Verifichiamo che ogni studente abbia un ID valido
                            const validStudents = students.map(student => ({
                                ...student,
                                id: student._id  // Assicuriamoci che ogni studente abbia un id
                            }));
                            console.log('Processed students:', validStudents);
                            setUnassignedStudents(validStudents);
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
    }, [classId]);

    const handleAssignStudents = async () => {
        try {
            console.log('Class Data:', classData); // Debug
    
            if (!classId) {
                throw new Error('ID classe mancante');
            }
    
            if (!classData?.academicYear) {
                throw new Error('Anno accademico mancante');
            }
    
            if (!selectedStudents || selectedStudents.length === 0) {
                throw new Error('Nessuno studente selezionato');
            }
    
            setAssigning(true);
            setError(null);
    
            // Chiamata API
            await batchAssignStudents(
                selectedStudents,
                classId,
                classData.academicYear
            );

    
            navigate(`/admin/classes/${classId}`);
    
        } catch (err) {
            console.error('Error assigning students:', err);
            setError(err.message || 'Errore nell\'assegnazione degli studenti');
        } finally {
            setAssigning(false);
        }
    };

    

  

    const columns = [
        {
            field: 'firstName',
            headerName: 'Nome',
            width: 150,
            flex: 1,
        },
        {
            field: 'lastName',
            headerName: 'Cognome',
            width: 150,
            flex: 1,
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            flex: 1.5,
        },
        {
            field: 'gender',
            headerName: 'Genere',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Chip 
                    label={params.value === 'M' ? 'Maschio' : 'Femmina'}
                    size="small"
                    color={params.value === 'M' ? 'primary' : 'secondary'}
                    variant="outlined"
                />
            ),
        }
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={40}/>
            </Box>
        );
    }

 
    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '1200px', margin: '0 auto' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
    <Paper 
                elevation={3} 
                sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 2,
                    background: 'linear-gradient(to right, #ffffff, #f8f9fa)'
                }}
            >
                <Typography 
                    variant="h5" 
                    component="h1" 
                    sx={{ 
                        mb: 2,
                        color: '#1976d2',
                        fontWeight: 600
                    }}
                >
                    Popola Classe {classData?.year}{classData?.section}
                </Typography>

                <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2, 
                    mb: 2 
                }}>
                    <Chip
                        label={`Anno Accademico: ${classData?.academicYear}`}
                        variant="outlined"
                        color="primary"
                    />
                    <Chip
                        label={`Studenti: ${classData?.students?.length || 0}/${classData?.capacity || 0}`}
                        variant="outlined"
                        color={
                            (classData?.students?.length || 0) >= (classData?.capacity || 0) 
                                ? 'error' 
                                : 'success'
                        }
                    />
                </Box>
            </Paper>

            <Paper 
                elevation={3} 
                sx={{ 
                    height: 500, 
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <DataGrid
                    rows={unassignedStudents}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection
                    disableSelectionOnClick
                    getRowId={(row) => row._id || row.id}
                    onSelectionModelChange={(newSelectionModel) => {
                        setSelectedStudents(newSelectionModel);
                    }}
                    selectionModel={selectedStudents}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-cell': {
                            fontSize: '0.875rem',
                            py: 1
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#f8f9fa'
                        },
                        '& .MuiCheckbox-root': {
                            color: '#1976d2'
                        }
                    }}
                />
            </Paper>

            <Box sx={{ 
                mt: 3, 
                display: 'flex', 
                justifyContent: 'space-between',
                gap: 2
            }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/classes')}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2
                    }}
                >
                    Indietro
                </Button>

                <Button
                    variant="contained"
                    startIcon={<GroupAddIcon />}
                    onClick={handleAssignStudents}
                    disabled={assigning || selectedStudents.length === 0}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)'
                    }}
                >
                    {assigning ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1, color: 'white' }}/>
                            Assegnazione in corso...
                        </>
                    ) : (
                        `Assegna ${selectedStudents.length} studenti`
                    )}
                </Button>
            </Box>
        </Box>
    );
};

export default ClassPopulate;