// src/components/students/ExcelPreview.js

import React, { useState, useEffect, useRef } from 'react';
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
const ExcelPreview = ({ data, onConfirm, onCancel, availableClasses = [], existingEmails = [], onEmailChange, onDataUpdate }) => {
    const [previewData, setPreviewData] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [bulkClassAssignment, setBulkClassAssignment] = useState({
        year: '',
        section: ''
    });
    const [errors, setErrors] = useState({});
    const isInitialRender = useRef(true);
    const hasDataUpdated = useRef(false);

    // Anni scolastici disponibili (1-5)
    const years = [1, 2, 3, 4, 5];
    
    // Sezioni disponibili (A-Z)
    const sections = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    // Inizializza i dati con validazione
    useEffect(() => {
        if (data && data.length > 0) {
            console.log('ExcelPreview: Received data:', data);
            console.log('ExcelPreview: Existing emails:', existingEmails);
            
            const validatedData = data.map((student, index) => {
                // Normalizza i dati per assicurare coerenza
                const normalizedStudent = {
                    ...student,
                    id: index,
                    year: student.year || '',
                    section: student.section || '',
                    classId: student.classId || null
                };
                
                // Log per debug
                if (normalizedStudent.year && normalizedStudent.section) {
                    console.log(`Student ${index}: year=${normalizedStudent.year}, section=${normalizedStudent.section}, classId=${normalizedStudent.classId}`);
                }
                
                // Valida lo studente
                normalizedStudent.validated = validateStudent(normalizedStudent);
                
                return normalizedStudent;
            });
            
            setPreviewData(validatedData);
            isInitialRender.current = false;
        }
    }, [data, availableClasses, existingEmails]);

    // Effetto per notificare il parent dei cambiamenti significativi nei dati
    useEffect(() => {
        // Evita di inviare aggiornamenti durante il rendering iniziale o quando non ci sono dati
        if (!isInitialRender.current && previewData.length > 0 && onDataUpdate && hasDataUpdated.current) {
            console.log('Notifying parent of data update');
            onDataUpdate(previewData);
            hasDataUpdated.current = false; // Reset il flag dopo l'aggiornamento
        }
    }, [previewData, onDataUpdate]);

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
        
        // Verifica se l'email è già presente nel sistema
        if (student.email && existingEmails.length > 0 && 
            existingEmails.some(e => e.toLowerCase() === student.email.toLowerCase())) {
            errors.email = 'Email già presente nel sistema';
            // Marca questo errore come di tipo "duplicate" per gestirlo diversamente nella UI
            errors._isDuplicate = true;
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

    // Funzione per trovare l'ID classe basato su anno e sezione
    const findClassId = (year, section) => {
        if (!year || !section || !availableClasses || !availableClasses.length) {
            return null;
        }
        
        const matchingClass = availableClasses.find(
            c => c.year.toString() === year.toString() && 
                 c.section.toUpperCase() === section.toUpperCase()
        );
        
        return matchingClass ? matchingClass._id : null;
    };

    // Funzione per applicare un'assegnazione di classe a tutti gli studenti
    const applyBulkClassAssignment = () => {
        if (!bulkClassAssignment.year || !bulkClassAssignment.section) {
            return;
        }
        
        // Trova la classe corrispondente tra quelle disponibili
        const classId = findClassId(bulkClassAssignment.year, bulkClassAssignment.section);
        console.log(`Bulk assign: year=${bulkClassAssignment.year}, section=${bulkClassAssignment.section}, foundClassId=${classId}`);

        hasDataUpdated.current = true; // Segnala che ci sarà un aggiornamento significativo
        setPreviewData(prevData => prevData.map(student => {
            const updated = {
                ...student,
                year: bulkClassAssignment.year,
                section: bulkClassAssignment.section,
                classId: classId
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
        
        // Se sono stati impostati sia year che section, cerca la classe corrispondente
        let updatedStudent = {...selectedStudent};
        
        if (updatedStudent.year && updatedStudent.section) {
            updatedStudent.classId = findClassId(updatedStudent.year, updatedStudent.section);
            console.log(`Student edit: year=${updatedStudent.year}, section=${updatedStudent.section}, classId=${updatedStudent.classId}`);
        } else {
            // Se non sono entrambi settati, resetta il classId
            updatedStudent.classId = null;
        }

        // Controlla se l'email è stata modificata 
        const oldEmail = previewData.find(s => s.id === updatedStudent.id)?.email;
        const emailChanged = oldEmail && oldEmail !== updatedStudent.email;
        
        if (emailChanged) {
            // Informa il componente parent della modifica dell'email
            if (onEmailChange) {
                onEmailChange(oldEmail, updatedStudent.email);
                
                // Debug log
                console.log(`Email changed in handleSaveEdit: ${oldEmail} -> ${updatedStudent.email}`);
            }
        }

        // Valida lo studente aggiornato
        const validated = validateStudent(updatedStudent);
        updatedStudent.validated = validated;
        
        // Se l'email è cambiata o la validazione è cambiata, segnala che ci sono modifiche importanti
        if (emailChanged || (previewData.find(s => s.id === updatedStudent.id)?.validated !== validated)) {
            hasDataUpdated.current = true;
        }
        
        // Aggiorna i dati
        setPreviewData(prevData => 
            prevData.map(student => 
                student.id === updatedStudent.id ? updatedStudent : student
            )
        );
        
        setEditOpen(false);
    };
    
    // Gestisce la rimozione di uno studente
    const handleRemove = (studentId) => {
        hasDataUpdated.current = true; // Segnala che ci sarà un aggiornamento significativo
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
        
        // Prepara i dati da inviare (solo gli studenti validi)
        const finalData = previewData
            .filter(student => student.validated === true) 
            .map(student => {
                // Mantieni solo i dati necessari e rimuovi campi di UI
                const { id, validated, ...cleanedStudent } = student;
                
                // Log per debug
                if (cleanedStudent.classId || (cleanedStudent.year && cleanedStudent.section)) {
                    console.log(`Finalizing student: ${cleanedStudent.firstName} ${cleanedStudent.lastName}, year=${cleanedStudent.year}, section=${cleanedStudent.section}, classId=${cleanedStudent.classId}`);
                }
                
                return cleanedStudent;
            });
        
        // Debug log prima di inviare
        console.log('Final data before sending to parent:', finalData);
        
        // Invia i dati validati al componente parent
        onConfirm(finalData);
    };
    
    // Funzione per verificare se uno studente ha email duplicata
    const hasEmailDuplicate = (student) => {
        return student.email && existingEmails.some(
            e => e.toLowerCase() === student.email.toLowerCase()
        );
    };
    
    // Verifica se ci sono studenti non validi
    const hasInvalidStudents = previewData.some(student => student.validated !== true);
    
    // Ottieni stats dell'import
    const totalStudents = previewData.length;
    const validStudents = previewData.filter(student => student.validated === true).length;
    const invalidStudents = totalStudents - validStudents;
    const studentsWithClass = previewData.filter(s => s.classId || (s.year && s.section)).length;
    const duplicateEmailCount = previewData.filter(student => hasEmailDuplicate(student)).length;
    
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
            
            {/* Email duplicate */}
            {duplicateEmailCount > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        Sono presenti {duplicateEmailCount} studenti con email già esistenti nel sistema che non verranno importati.
                    </Typography>
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
                <Chip 
                    label={`${studentsWithClass} Con Classe`} 
                    color="primary" 
                    variant="outlined" 
                />
                {duplicateEmailCount > 0 && (
                    <Chip 
                        icon={<ErrorOutlineIcon />}
                        label={`${duplicateEmailCount} Email Duplicate`} 
                        color="warning" 
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
                        {previewData.map((student) => {
                            const isDuplicate = hasEmailDuplicate(student);
                            const hasOtherErrors = student.validated !== true && !student.validated._isDuplicate;
                            
                            return (
                                <TableRow 
                                    key={student.id}
                                    sx={{ 
                                        backgroundColor: isDuplicate 
                                            ? 'rgba(255, 152, 0, 0.1)' 
                                            : (student.validated !== true ? 'rgba(255, 0, 0, 0.05)' : 'inherit')
                                    }}
                                >
                                    <TableCell>{student.firstName}</TableCell>
                                    <TableCell>{student.lastName}</TableCell>
                                    <TableCell>
                                        {student.email}
                                        {isDuplicate && (
                                            <Typography variant="caption" display="block" color="error">
                                                Duplicata
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{student.dateOfBirth}</TableCell>
                                    <TableCell>{student.year || '-'}</TableCell>
                                    <TableCell>{student.section || '-'}</TableCell>
                                    <TableCell>
                                        {student.validated === true ? (
                                            <Chip size="small" label="Valido" color="success" />
                                        ) : isDuplicate ? (
                                            <Tooltip title="Email già presente nel sistema">
                                                <Chip 
                                                    size="small" 
                                                    label="Email Duplicata" 
                                                    color="warning" 
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title={
                                                <div>
                                                    {Object.entries(student.validated)
                                                        .filter(([key]) => !key.startsWith('_'))
                                                        .map(([key, value]) => (
                                                            <div key={key}><b>{key}</b>: {value}</div>
                                                        ))
                                                    }
                                                </div>
                                            }>
                                                <Chip 
                                                    size="small" 
                                                    label="Errori" 
                                                    color="error" 
                                                />
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
                            );
                        })}
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
                                {hasEmailDuplicate(selectedStudent) && (
                                    <Alert severity="warning" sx={{ mt: 1 }} size="small">
                                        Questa email è già presente nel sistema
                                    </Alert>
                                )}
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