// src/components/students/ExcelPreview.js

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Chip,
    Stack,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

/**
 * Componente per la visualizzazione e modifica dei dati Excel prima dell'import
 */
const ExcelPreview = ({ data, onConfirm, onCancel, availableClasses = [] }) => {
    const [previewData, setPreviewData] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [bulkClassAssignment, setBulkClassAssignment] = useState({
        year: '',
        section: ''
    });
    const [errors, setErrors] = useState({});

    // Anni scolastici disponibili (1-5)
    const years = [1, 2, 3, 4, 5];
    
    // Sezioni disponibili (A-Z)
    const sections = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    // Inizializza i dati con validazione
    useEffect(() => {
        if (data && data.length > 0) {
            const validatedData = data.map((student, index) => {
                // Aggiungi campi per l'assegnazione della classe e validazione
                return {
                    ...student,
                    id: index,
                    year: student.year || '',
                    section: student.section || '',
                    validated: validateStudent(student)
                };
            });
            setPreviewData(validatedData);
        }
    }, [data]);

    // Funzione per validare un singolo studente
    const validateStudent = (student) => {
        const errors = {};
        
        // Validazioni obbligatorie
        if (!student.firstName) errors.firstName = 'Nome richiesto';
        if (!student.lastName) errors.lastName = 'Cognome richiesto';
        if (!student.email) errors.email = 'Email richiesta';
        if (!student.gender) errors.gender = 'Genere richiesto';
        if (!student.dateOfBirth) errors.dateOfBirth = 'Data di nascita richiesta';
        
        // Validazione email
        if (student.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(student.email)) {
            errors.email = 'Email non valida';
        }
        
        // Validazione email genitore
        if (student.parentEmail && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(student.parentEmail)) {
            errors.parentEmail = 'Email genitore non valida';
        }
        
        // Validazione codice fiscale
        if (student.fiscalCode && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(student.fiscalCode)) {
            errors.fiscalCode = 'Codice fiscale non valido';
        }
        
        // Validazione assegnazione classe
        if ((student.year && !student.section) || (!student.year && student.section)) {
            errors.class = 'Anno e sezione devono essere entrambi specificati';
        }
        
        return Object.keys(errors).length === 0 ? true : errors;
    };

    // Funzione per applicare un'assegnazione di classe a tutti gli studenti
    const applyBulkClassAssignment = () => {
        if (!bulkClassAssignment.year || !bulkClassAssignment.section) {
            return;
        }
        
        setPreviewData(prevData => prevData.map(student => {
            const updated = {
                ...student,
                year: bulkClassAssignment.year,
                section: bulkClassAssignment.section
            };
            updated.validated = validateStudent(updated);
            return updated;
        }));
    };
    
    // Apre il dialog di modifica
    const handleEdit = (student) => {
        setSelectedStudent({...student});
        setEditOpen(true);
    };
    
    // Salva le modifiche allo studente
    const handleSaveEdit = () => {
        if (!selectedStudent) return;
        
        // Valida lo studente aggiornato
        const validated = validateStudent(selectedStudent);
        selectedStudent.validated = validated;
        
        // Aggiorna i dati
        setPreviewData(prevData => 
            prevData.map(student => 
                student.id === selectedStudent.id ? 
                {...selectedStudent, validated} : student
            )
        );
        
        setEditOpen(false);
    };
    
    // Gestisce la rimozione di uno studente
    const handleRemove = (studentId) => {
        setPreviewData(prevData => prevData.filter(student => student.id !== studentId));
    };
    
    // Funzione per completare l'import
    const handleComplete = () => {
        // Conta gli studenti validi
        const validCount = previewData.filter(student => student.validated === true).length;
        
        // Verifica se ci sono studenti validi da importare
        if (validCount === 0) {
            setErrors({global: 'Nessuno studente valido da importare'});
            return;
        }
        
        // Prepara i dati da inviare
        const finalData = previewData.map(student => {
            // Mantieni solo i dati necessari e rimuovi campi di UI
            const { id, validated, ...cleanedStudent } = student;
            
            // Assegna i dati della classe
            if (student.year && student.section) {
                // Trova la classe corrispondente tra quelle disponibili
                const matchingClass = availableClasses.find(
                    c => c.year.toString() === student.year.toString() && c.section === student.section
                );
                
                if (matchingClass) {
                    cleanedStudent.classId = matchingClass._id;
                }
            }
            
            return cleanedStudent;
        });
        
        // Invia i dati validati al componente parent
        onConfirm(finalData);
    };
    
    // Verifica se ci sono studenti non validi
    const hasInvalidStudents = previewData.some(student => student.validated !== true);
    
    // Ottieni stats dell'import
    const totalStudents = previewData.length;
    const validStudents = previewData.filter(student => student.validated === true).length;
    const invalidStudents = totalStudents - validStudents;
    
    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Anteprima Dati Import ({validStudents}/{totalStudents} studenti validi)
            </Typography>
            
            {/* Form per assegnazione classi in bulk */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5} md={4}>
                        <Typography variant="subtitle1">
                            Assegnazione Classe per Tutti gli Studenti
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Anno</InputLabel>
                            <Select
                                value={bulkClassAssignment.year}
                                onChange={(e) => setBulkClassAssignment({...bulkClassAssignment, year: e.target.value})}
                                label="Anno"
                            >
                                <MenuItem value=""><em>Nessuno</em></MenuItem>
                                {years.map(year => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sezione</InputLabel>
                            <Select
                                value={bulkClassAssignment.section}
                                onChange={(e) => setBulkClassAssignment({...bulkClassAssignment, section: e.target.value})}
                                label="Sezione"
                            >
                                <MenuItem value=""><em>Nessuna</em></MenuItem>
                                {sections.map(section => (
                                    <MenuItem key={section} value={section}>{section}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3} md={2}>
                        <Button 
                            variant="outlined" 
                            onClick={applyBulkClassAssignment}
                            disabled={!bulkClassAssignment.year || !bulkClassAssignment.section}
                            fullWidth
                        >
                            Applica a Tutti
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            
            {/* Errori globali */}
            {errors.global && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.global}
                </Alert>
            )}
            
            {/* Visualizzazione stati */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip 
                    icon={<CheckCircleOutlineIcon />} 
                    label={`${validStudents} Validi`} 
                    color="success" 
                    variant="outlined" 
                />
                {invalidStudents > 0 && (
                    <Chip 
                        icon={<ErrorOutlineIcon />} 
                        label={`${invalidStudents} Non Validi`} 
                        color="error" 
                        variant="outlined" 
                    />
                )}
            </Stack>
            
            {/* Tabella dati */}
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Cognome</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Data Nascita</TableCell>
                            <TableCell>Anno</TableCell>
                            <TableCell>Sezione</TableCell>
                            <TableCell>Stato</TableCell>
                            <TableCell align="center">Azioni</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {previewData.map((student) => (
                            <TableRow 
                                key={student.id}
                                sx={{ 
                                    backgroundColor: student.validated !== true ? 'rgba(255, 0, 0, 0.05)' : 'inherit' 
                                }}
                            >
                                <TableCell>{student.firstName}</TableCell>
                                <TableCell>{student.lastName}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.dateOfBirth}</TableCell>
                                <TableCell>{student.year || '-'}</TableCell>
                                <TableCell>{student.section || '-'}</TableCell>
                                <TableCell>
                                    {student.validated === true ? (
                                        <Chip size="small" label="Valido" color="success" />
                                    ) : (
                                        <Tooltip title={
                                            <div>
                                                {Object.entries(student.validated).map(([key, value]) => (
                                                    <div key={key}><b>{key}</b>: {value}</div>
                                                ))}
                                            </div>
                                        }>
                                            <Chip size="small" label="Errori" color="error" />
                                        </Tooltip>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => handleEdit(student)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleRemove(student.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Azioni */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button 
                    variant="outlined" 
                    onClick={onCancel}
                >
                    Annulla
                </Button>
                <Stack direction="row" spacing={1} alignItems="center">
                    {hasInvalidStudents && (
                        <Tooltip title="Ci sono studenti con errori. Saranno importati solo gli studenti validi.">
                            <HelpOutlineIcon color="warning" />
                        </Tooltip>
                    )}
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleComplete}
                        disabled={validStudents === 0}
                    >
                        Importa {validStudents} Studenti
                    </Button>
                </Stack>
            </Box>
            
            {/* Dialog per modifica studente */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Modifica Studente</DialogTitle>
                <DialogContent>
                    {selectedStudent && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nome"
                                    value={selectedStudent.firstName || ''}
                                    onChange={(e) => setSelectedStudent({...selectedStudent, firstName: e.target.value})}
                                    error={selectedStudent.validated !== true && 'firstName' in selectedStudent.validated}
                                    helperText={selectedStudent.validated !== true && selectedStudent.validated.firstName}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Cognome"
                                    value={selectedStudent.lastName || ''}
                                    onChange={(e) => setSelectedStudent({...selectedStudent, lastName: e.target.value})}
                                    error={selectedStudent.validated !== true && 'lastName' in selectedStudent.validated}
                                    helperText={selectedStudent.validated !== true && selectedStudent.validated.lastName}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={selectedStudent.email || ''}
                                    onChange={(e) => setSelectedStudent({...selectedStudent, email: e.target.value})}
                                    error={selectedStudent.validated !== true && 'email' in selectedStudent.validated}
                                    helperText={selectedStudent.validated !== true && selectedStudent.validated.email}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email Genitore"
                                    value={selectedStudent.parentEmail || ''}
                                    onChange={(e) => setSelectedStudent({...selectedStudent, parentEmail: e.target.value})}
                                    error={selectedStudent.validated !== true && 'parentEmail' in selectedStudent.validated}
                                    helperText={selectedStudent.validated !== true && selectedStudent.validated.parentEmail}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Genere</InputLabel>
                                    <Select
                                        value={selectedStudent.gender || ''}
                                        onChange={(e) => setSelectedStudent({...selectedStudent, gender: e.target.value})}
                                        label="Genere"
                                        error={selectedStudent.validated !== true && 'gender' in selectedStudent.validated}
                                    >
                                        <MenuItem value="M">Maschio</MenuItem>
                                        <MenuItem value="F">Femmina</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Data di Nascita"
                                    type="text"
                                    value={selectedStudent.dateOfBirth || ''}
                                    onChange={(e) => setSelectedStudent({...selectedStudent, dateOfBirth: e.target.value})}
                                    placeholder="DD/MM/YYYY"
                                    error={selectedStudent.validated !== true && 'dateOfBirth' in selectedStudent.validated}
                                    helperText={selectedStudent.validated !== true && selectedStudent.validated.dateOfBirth}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Codice Fiscale"
                                    value={selectedStudent.fiscalCode || ''}
                                    onChange={(e) => setSelectedStudent({...selectedStudent, fiscalCode: e.target.value.toUpperCase()})}
                                    inputProps={{ style: { textTransform: 'uppercase' } }}
                                    error={selectedStudent.validated !== true && 'fiscalCode' in selectedStudent.validated}
                                    helperText={selectedStudent.validated !== true && selectedStudent.validated.fiscalCode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Anno</InputLabel>
                                    <Select
                                        value={selectedStudent.year || ''}
                                        onChange={(e) => setSelectedStudent({...selectedStudent, year: e.target.value})}
                                        label="Anno"
                                    >
                                        <MenuItem value=""><em>Nessuno</em></MenuItem>
                                        {years.map(year => (
                                            <MenuItem key={year} value={year}>{year}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Sezione</InputLabel>
                                    <Select
                                        value={selectedStudent.section || ''}
                                        onChange={(e) => setSelectedStudent({...selectedStudent, section: e.target.value})}
                                        label="Sezione"
                                    >
                                        <MenuItem value=""><em>Nessuna</em></MenuItem>
                                        {sections.map(section => (
                                            <MenuItem key={section} value={section}>{section}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)} color="inherit">
                        Annulla
                    </Button>
                    <Button onClick={handleSaveEdit} variant="contained">
                        Salva
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExcelPreview;