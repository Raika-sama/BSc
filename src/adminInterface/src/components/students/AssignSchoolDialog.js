import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Stack,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import { useStudent } from '../../context/StudentContext';
import { useSchool } from '../../context/SchoolContext';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';

const AssignSchoolDialog = ({ open, onClose }) => {
    const navigate = useNavigate();
    const { 
        students, 
        loading, 
        error,
        fetchUnassignedToSchoolStudents,
        batchAssignToSchool
    } = useStudent();

    const { schools, fetchSchools } = useSchool();
    
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [filteredStudents, setFilteredStudents] = useState([]);

    // Primo useEffect per il caricamento
    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('Inizio caricamento dati iniziale');
                const result = await fetchUnassignedToSchoolStudents();
                console.log('Risultato caricamento:', result);
                
                if (!result || result.length === 0) {
                    // Se non ci sono studenti, mostra una notifica
                    console.log('Nessuno studente da assegnare trovato');
                }
            } catch (error) {
                console.error('Errore nel caricamento dati:', error);
            }
        };
        
        loadData();
        fetchSchools();
    }, []);

    // Effetto per il filtraggio
    useEffect(() => {
        console.log('Effetto filtraggio attivato:', { studentsLength: students?.length });
        
        if (students && Array.isArray(students) && students.length > 0) {
            const filtered = searchTerm.trim() === ''
                ? [...students]
                : students.filter(student => 
                    student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            
            console.log(`Filtrati ${filtered.length} studenti da ${students.length} totali`);
            setFilteredStudents(filtered);
        } else {
            console.log('Nessuno studente disponibile per il filtraggio');
            setFilteredStudents([]);
        }
    }, [students, searchTerm]);


    const columns = [
        {
            field: 'firstName',
            headerName: 'Nome',
            width: 150,
            flex: 1
        },
        {
            field: 'lastName',
            headerName: 'Cognome',
            width: 150,
            flex: 1
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 200,
            flex: 1
        },
        {
            field: 'dateOfBirth',
            headerName: 'Data di Nascita',
            width: 150,
            valueFormatter: (params) => 
                params.value ? new Date(params.value).toLocaleDateString('it-IT') : 'N/D'
        }
    ];

    const handleAssignConfirm = async () => {
        if (!selectedSchool || selectedStudents.length === 0) {
            return;
        }

        try {
            setAssigning(true);
            await batchAssignToSchool(selectedStudents, selectedSchool);
            onClose(true); // Passa true per indicare che è stato fatto un aggiornamento
        } catch (error) {
            console.error('Error assigning students:', error);
        } finally {
            setAssigning(false);
            setConfirmDialogOpen(false);
        }
    };

    const selectedSchoolName = schools.find(s => s._id === selectedSchool)?.name;


    console.log('Current filteredStudents:', filteredStudents);
    console.log('Current loading state:', loading);

    return (
        <Dialog
            open={open}
            onClose={() => onClose(false)}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Assegnazione Studenti alla Scuola
                <IconButton
                    aria-label="close"
                    onClick={() => onClose(false)}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
    
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <Card sx={{ flexGrow: 1 }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <PeopleIcon color="primary" />
                                <Box>
                                    <Typography variant="h6">
                                        {students.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Studenti totali da assegnare
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
    
                    <Card sx={{ flexGrow: 1 }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <SchoolIcon color="primary" />
                                <Box>
                                    <Typography variant="h6">
                                        {selectedStudents.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Studenti selezionati
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
    
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Cerca studenti..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        }}
                    />
    
                    <FormControl fullWidth>
                        <InputLabel>Seleziona Scuola</InputLabel>
                        <Select
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            disabled={loading || assigning}
                        >
                            {schools.map((school) => (
                                <MenuItem key={school._id} value={school._id}>
                                    {school.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
    
                <Box sx={{ height: 400, width: '100%' }}> {/* Altezza ridotta per il dialog */}
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : filteredStudents.length > 0 ? (
                        <DataGrid
                            rows={filteredStudents}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 25, page: 0 },
                                },
                            }}
                            pageSizeOptions={[25, 50, 100]}
                            checkboxSelection
                            disableSelectionOnClick
                            getRowId={(row) => row.id || row._id}
                            selectionModel={selectedStudents}
                            onSelectionModelChange={(newSelection) => {
                                setSelectedStudents(newSelection);
                            }}
                            hideFooterSelectedRowCount={false}
                        />
                    ) : (
                        <Alert severity="info">
                            {searchTerm.trim() !== '' 
                                ? 'Nessuno studente trovato con i criteri di ricerca specificati'
                                : 'Non ci sono studenti da assegnare a una scuola'}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    variant="outlined"
                    onClick={() => onClose(false)}
                    disabled={assigning}
                >
                    Annulla
                </Button>
                <Button
                    variant="contained"
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={selectedStudents.length === 0 || !selectedSchool || assigning}
                    startIcon={assigning ? <CircularProgress size={20} /> : null}
                >
                    {assigning ? 'Assegnazione in corso...' : 'Assegna Studenti'}
                </Button>
            </DialogActions>
    
            {/* Dialog di conferma */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>Conferma Assegnazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Stai per assegnare {selectedStudents.length} studenti alla scuola "{selectedSchoolName}".
                        Vuoi procedere?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleAssignConfirm}
                        variant="contained"
                        color="primary"
                    >
                        Conferma
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default AssignSchoolDialog;