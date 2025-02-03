import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Alert,
    CircularProgress,
    Chip,
    alpha
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudent } from '../../../context/StudentContext';
import { useClass } from '../../../context/ClassContext';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { useTheme } from '@mui/material/styles';


const ClassPopulate = ({ classData, onUpdate }) => {
    const theme = useTheme(); // Aggiungi questa riga all'inizio del componente
    const { fetchUnassignedStudents, batchAssignStudents } = useStudent();
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadUnassignedStudents();
    }, [classData?.schoolId?._id]);

    
    const loadUnassignedStudents = async () => {
        if (!classData?.schoolId?._id) return;

        try {
            setLoading(true);
            setError(null);
            
            const students = await fetchUnassignedStudents(classData.schoolId._id);
            
            if (Array.isArray(students)) {
                const validStudents = students.map(student => ({
                    ...student,
                    id: student._id || student.id,
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    email: student.email || '',
                    gender: student.gender || ''
                }));
                setUnassignedStudents(validStudents);
            }
        } catch (err) {
            setError(err.message || 'Errore nel caricamento degli studenti');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignStudents = async () => {
        try {
            if (!classData?._id) {
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
    
            // Verifica che tutti gli ID selezionati esistano in unassignedStudents
            const validStudents = selectedStudents.filter(selectedId => 
                unassignedStudents.some(student => 
                    (student._id === selectedId || student.id === selectedId)
                )
            );
    
            if (validStudents.length !== selectedStudents.length) {
                throw new Error('Alcuni studenti selezionati non sono validi');
            }
    
            // Chiamata API con gli ID validati
            const result = await batchAssignStudents(
                validStudents,
                classData._id, // Usa classData._id invece di classId
                classData.academicYear
            );
    
            if (result) {
                // Resetta la selezione
                setSelectedStudents([]);
                // Ricarica gli studenti non assegnati
                await loadUnassignedStudents();
                // Aggiorna i dati della classe nel componente padre
                onUpdate();
            }
            
        } catch (err) {
            console.error('Error in handleAssignStudents:', err);
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

    const getRowId = (row) => {
        const id = row._id || row.id;
        console.log('Getting Row ID:', { row, id });
        return id;
    };

    console.log('Component state:', {
        unassignedStudents,
        loading,
        error
    });
 
    return (
        <Box sx={{ 
            p: 3, 
            height: '100%', // Assicuriamo che il container principale occupi tutto lo spazio disponibile
            display: 'flex',
            flexDirection: 'column',
            gap: 3
        }}>
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        borderRadius: 2,
                        '& .MuiAlert-message': { fontSize: '0.875rem' }
                    }}
                >
                    {error}
                </Alert>
            )}

            {/* Header Card */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper' // Usa bgcolor invece di background
                }}
            >
                <Typography 
                    variant="h5" 
                    sx={{ 
                        mb: 2,
                        color: 'primary.main',
                        fontWeight: 600
                    }}
                >
                    Popola Classe {classData?.year}{classData?.section}
                </Typography>

                <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2
                }}>
                    <Chip
                        label={`Anno Accademico: ${classData?.academicYear}`}
                        variant="outlined"
                        color="primary"
                        sx={{ 
                            borderRadius: 1,
                            '& .MuiChip-label': { px: 2 }
                        }}
                    />
                    <Chip
                        label={`Studenti: ${classData?.students?.length || 0}/${classData?.capacity || 0}`}
                        variant="outlined"
                        color={(classData?.students?.length || 0) >= (classData?.capacity || 0) ? 'error' : 'success'}
                        sx={{ 
                            borderRadius: 1,
                            '& .MuiChip-label': { px: 2 }
                        }}
                    />
                </Box>
            </Paper>

            {/* DataGrid Container */}
            <Paper 
                elevation={0} 
                sx={{ 
                    flex: 1, // Questo farà espandere il Paper per occupare lo spazio rimanente
                    display: 'flex', // Importante per la propagazione dell'altezza
                    flexDirection: 'column',
                    minHeight: 400, // Altezza minima di fallback
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ 
                    flex: 1, // Importante per l'espansione
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%', // Occupa tutto lo spazio disponibile
                    minHeight: 400 // Altezza minima di fallback
                }}>
                    <DataGrid
                        rows={unassignedStudents || []}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        checkboxSelection
                        disableSelectionOnClick
                        getRowId={getRowId}
                        onSelectionModelChange={(newSelectionModel) => {
                            setSelectedStudents(newSelectionModel);
                        }}
                        selectionModel={selectedStudents}
                        autoHeight={false} // Importante: non usare autoHeight
                        components={{
                            NoRowsOverlay: () => (
                                <Box 
                                    display="flex" 
                                    justifyContent="center" 
                                    alignItems="center" 
                                    height="100%"
                                >
                                    <Typography 
                                        color="text.secondary"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {loading ? 'Caricamento...' : 
                                        unassignedStudents?.length === 0 ? 'Nessuno studente non assegnato trovato' :
                                        'Nessun risultato'}
                                    </Typography>
                                </Box>
                            )
                        }}
                        sx={{
                            flex: 1,
                            width: '100%',
                            height: '100%', // Importante
                            '& .MuiDataGrid-main': { // Assicura che il contenuto si espanda correttamente
                                flex: '1 1 auto'
                            },
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                fontSize: '0.875rem',
                                py: 1
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderBottom: 1,
                                borderColor: 'divider'
                            },
                            '& .MuiDataGrid-row': {
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                }
                            }
                        }}
                    />
                </Box>
            </Paper>

            {/* Actions */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                gap: 2,
                mt: 'auto' // Spinge i bottoni in fondo
            }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => onUpdate()} // Modificato per usare onUpdate invece di navigate
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
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
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                            backgroundColor: alpha(theme.palette.primary.main, 0.8)
                        }
                    }}
                >
                    {assigning ? (
                        <>
                            <CircularProgress 
                                size={20} 
                                sx={{ 
                                    mr: 1, 
                                    color: 'common.white'
                                }}
                            />
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