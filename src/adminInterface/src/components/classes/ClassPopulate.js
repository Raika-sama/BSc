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
                    
                    const schoolId = details.schoolId._id || details.schoolId;
                    console.log('Extracted schoolId:', schoolId);
                    
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
            // Debug dei dati prima dell'invio
            console.log('Debug dati prima dell\'invio:', {
                selectedStudents,
                selectedStudentsType: typeof selectedStudents,
                isArray: Array.isArray(selectedStudents),
                classId,
                academicYear: classData.academicYear,
                classData
            });
    
            setAssigning(true);
            setError(null);
    
            const totalStudents = (classData.students?.length || 0) + selectedStudents.length;
            if (totalStudents > classData.capacity) {
                throw new Error(`Capacità massima classe superata (${classData.capacity} studenti)`);
            }
    
            // Chiamata API
            await batchAssignStudents(
                selectedStudents,
                classId,
                classData.academicYear
            );
    
            navigate(`/admin/classes/${classId}`);
    
        } catch (err) {
            console.error('Error assigning students:', err);
            // Log dettagliato della risposta di errore
            if (err.response) {
                console.log('Error response data:', err.response.data);
                console.log('Error response status:', err.response.status);
                console.log('Error response headers:', err.response.headers);
            }
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

 
    return (
        <Box p={3}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
    
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Popola Classe {classData?.year}{classData?.section}
                </Typography>
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
    
            <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
            <DataGrid
                rows={unassignedStudents}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                checkboxSelection
                disableSelectionOnClick
                autoHeight
                getRowId={(row) => row.id}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                    },
                }}
                onRowSelectionModelChange={(newSelectionModel) => {  // Cambiato da onSelectionModelChange
                    console.log('Selection Event Triggered:', {
                        selection: newSelectionModel,
                        type: typeof newSelectionModel,
                        isArray: Array.isArray(newSelectionModel)
                    });
                    setSelectedStudents(newSelectionModel);
                }}
                rowSelectionModel={selectedStudents}  // Cambiato da selectionModel
                onStateChange={(state) => {
                    console.log('DataGrid State Changed:', {
                        selection: state.selection,
                        rowSelection: state.rowSelection,  // Aggiungi questo
                        timestamp: new Date().toISOString()
                    });
                }}
            />
            </Paper>
    
            {/* Solo una Box per i bottoni */}
            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/classes')}
                >
                    Indietro
                </Button>
    
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAssignStudents}
                    disabled={assigning || selectedStudents.length === 0}
                    sx={{ ml: 2 }} // Aggiunto margine a sinistra
                >
                    {assigning 
                        ? 'Assegnazione in corso...' 
                        : selectedStudents.length === 0 
                            ? 'Seleziona studenti da assegnare' 
                            : `Popola classe con ${selectedStudents.length} studenti`
                    }
                </Button>
            </Box>
            
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
            <Box mt={2} p={2} bgcolor="grey.100">
                <Typography variant="subtitle2">Debug Information:</Typography>
                <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify({
                        totalStudents: unassignedStudents.length,
                        selectedCount: selectedStudents.length,
                        selectedIds: selectedStudents,
                        sampleStudent: unassignedStudents[0],
                        selectionValid: selectedStudents.every(id => 
                            unassignedStudents.some(s => s.id === id || s._id === id)
                        ),
                        idTypes: {
                            selectedType: typeof selectedStudents[0],
                            studentIdType: unassignedStudents[0]?.id ? typeof unassignedStudents[0].id : 'undefined'
                        }
                    }, null, 2)}
                </pre>
            </Box>
            )}
        </Box>
    );
};

export default ClassPopulate;