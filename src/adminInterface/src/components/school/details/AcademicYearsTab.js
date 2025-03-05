import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Stack,
    Chip,
    Box,
    Divider,
    Alert,
    Paper,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    MenuItem,
    IconButton,
    Tooltip,
    FormControlLabel,
    Checkbox,
    Collapse
} from '@mui/material';
import {
    Event as EventIcon,
    School as SchoolIcon,
    Group as GroupIcon,
    AccessTime as AccessTimeIcon,
    Add as AddIcon,
    PlayArrow as ActivateIcon,
    Archive as ArchiveIcon,
    ViewList as ClassesIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Restore as RestoreIcon
} from '@mui/icons-material';
import { useSchool } from '../../../context/SchoolContext'; // Assicurati che il percorso sia corretto
import { useNotification } from '../../../context/NotificationContext'; // Assicurati che il percorso sia corretto
import { axiosInstance } from '../../../services/axiosConfig'; // Assicurati che il percorso sia corretto
import YearTransitionButton from '../yearManagement/YearTransitionButton';

const AcademicYearsTab = ({ school }) => {
    const { showNotification } = useNotification();
    const { getSchoolById } = useSchool();
    
    const [schoolSections, setSchoolSections] = useState([]);
    const [selectedSections, setSelectedSections] = useState([]);
    const [showSectionSelector, setShowSectionSelector] = useState(false);
    const [tempNewSections, setTempNewSections] = useState([]);

    const [currentYear, setCurrentYear] = useState(null);
    const [pastYears, setPastYears] = useState([]);
    const [plannedYears, setPlannedYears] = useState([]);
    
    const [openNewYearDialog, setOpenNewYearDialog] = useState(false);
    const [openClassesDialog, setOpenClassesDialog] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [yearClasses, setYearClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [openNewSectionDialog, setOpenNewSectionDialog] = useState(false);
    const [newSectionData, setNewSectionData] = useState({
        name: '',
        maxStudents: school?.defaultMaxStudentsPerClass || 25
    });
    const [newYearData, setNewYearData] = useState({
        year: "",
        startDate: "",
        endDate: "",
        status: "planned"
    });
    const [availableLetters, setAvailableLetters] = useState([]);
    const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
    const [yearToArchive, setYearToArchive] = useState(null);
    const [openReactivateDialog, setOpenReactivateDialog] = useState(false);
    const [yearToReactivate, setYearToReactivate] = useState(null);


    useEffect(() => {
        if (school && school.academicYears) {
            // Ordina gli anni accademici per anno (più recente prima)
            const sortedYears = [...school.academicYears].sort((a, b) => {
                const yearA = parseInt(a.year.split('/')[0]);
                const yearB = parseInt(b.year.split('/')[0]);
                return yearB - yearA;
            });
            
            setCurrentYear(sortedYears.find(year => year.status === 'active'));
            setPastYears(sortedYears.filter(year => year.status === 'archived'));
            setPlannedYears(sortedYears.filter(year => year.status === 'planned'));
        }
    }, [school]);
    
    // Funzioni helper
    const formatYearDisplay = (yearString) => {
        if (!yearString) return 'N/A';
        // Assumiamo che yearString sia nel formato "YYYY/YYYY"
        return yearString; // Mostriamo l'anno nel formato originale
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Non specificata';
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const getCurrentSchoolYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // getMonth() restituisce 0-11
        
        // Se siamo dopo agosto, l'anno scolastico è year/year+1, altrimenti è year-1/year
        if (month >= 9) { // Settembre o dopo
            return `${year}/${year + 1}`;
        } else {
            return `${year - 1}/${year}`;
        }
    };

    // Funzione per suggerire l'anno accademico in modo intelligente
const suggestAcademicYear = (currentActiveYear) => {
    // Ottieni l'anno corrente basato sulla data attuale
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() restituisce 0-11
    
    // Determina l'anno scolastico corrente (a prescindere se esiste nel sistema)
    let currentYear;
    if (month >= 9) { // Settembre o dopo
        currentYear = `${year}/${year + 1}`;
    } else {
        currentYear = `${year - 1}/${year}`;
    }
    
    // Se non c'è un anno attivo, suggerisci l'anno corrente
    if (!currentActiveYear) {
        return currentYear;
    }
    
    // Se c'è già un anno attivo, verifica se è l'anno corrente
    if (currentActiveYear.year === currentYear) {
        // Se è già l'anno corrente, suggerisci l'anno successivo
        const [firstPart, secondPart] = currentYear.split('/');
        return `${parseInt(firstPart) + 1}/${parseInt(secondPart) + 1}`;
    } else {
        // Se non è l'anno corrente (es. è precedente), suggerisci l'anno corrente
        return currentYear;
    }
};
    
    // Gestione apertura/chiusura dialoghi
 
    const handleOpenNewYearDialog = () => {
        // Usa la funzione di suggerimento per determinare l'anno da proporre
        const suggestedYear = suggestAcademicYear(currentYear);
        
        // Imposta le date di inizio e fine di default in base all'anno suggerito
        const [startYear, endYear] = suggestedYear.split('/');
        const defaultStartDate = `${startYear}-09-01`; // 1 settembre dell'anno iniziale
        const defaultEndDate = `${endYear}-06-30`;     // 30 giugno dell'anno finale
        
        // Ottieni tutte le sezioni della scuola (attive e inattive)
        const allSections = school.sections.map(s => ({
            id: s._id,
            name: s.name,
            maxStudents: s.maxStudents || school.defaultMaxStudentsPerClass,
            isActive: s.isActive,
            // Verifichiamo se questa sezione è usata in altri anni accademici
            usedInYears: s.academicYears.map(ay => ay.year),
            hasConfigForYear: s.academicYears.some(ay => ay.year === suggestedYear)
        }));
        
        // Filtra solo le sezioni attive per la selezione iniziale
        const activeSections = allSections.filter(s => s.isActive);
        
        setSchoolSections(allSections);
        // Di default, seleziona tutte le sezioni attive che non hanno già una configurazione per l'anno suggerito
        setSelectedSections(activeSections.filter(s => !s.hasConfigForYear).map(s => s.id));
        
        // Genera l'array di lettere disponibili (non già usate come sezioni)
        const existingSections = school.sections.map(s => s.name.toUpperCase());
        const allLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z
        const unusedLetters = allLetters.filter(letter => !existingSections.includes(letter));
        
        setAvailableLetters(unusedLetters);
        
        setNewYearData({
            year: suggestedYear,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            status: 'planned',
            createClasses: true
        });
        
        setShowSectionSelector(false); // Inizialmente nascosto
        setOpenNewYearDialog(true);
    };

    const handleSectionToggle = (sectionId) => {
        setSelectedSections(prev => {
            if (prev.includes(sectionId)) {
                return prev.filter(id => id !== sectionId);
            } else {
                return [...prev, sectionId];
            }
        });
    };

    
    const handleQuickAddSection = (letter) => {
        // Crea una nuova sezione temporanea
        const tempSection = {
            id: `temp-${letter}`,  // ID temporaneo
            name: letter,
            maxStudents: school.defaultMaxStudentsPerClass || 25,
            isActive: true,
            isTemp: true  // Flag per indicare che è temporanea
        };
        
        // Aggiungi alla lista di sezioni temporanee
        setTempNewSections(prev => [...prev, tempSection]);
        
        // Aggiungi alla lista di sezioni visualizzate
        setSchoolSections(prev => [...prev, tempSection]);
        
        // Aggiungi alla selezione
        setSelectedSections(prev => [...prev, tempSection.id]);
        
        // Rimuovi la lettera dalle disponibili
        setAvailableLetters(prev => prev.filter(l => l !== letter));
        
        showNotification(`Sezione ${letter} aggiunta (sarà creata al salvataggio)`, 'info');
    };
    

    
    // Aggiungi una funzione per selezionare/deselezionare tutte le sezioni
    const handleToggleAllSections = () => {
        if (selectedSections.length === schoolSections.length) {
            setSelectedSections([]);
        } else {
            setSelectedSections(schoolSections.map(s => s.id));
        }
    };
    
    const handleCloseNewYearDialog = () => {
        // Ripristina le lettere per le sezioni temporanee
        if (tempNewSections.length > 0) {
            const tempLetters = tempNewSections.map(s => s.name);
            setAvailableLetters(prev => [...prev, ...tempLetters].sort());
            setTempNewSections([]);  // Resetta le sezioni temporanee
        }
        
        setOpenNewYearDialog(false);
    };
    
    const handleOpenClassesDialog = async (year) => {
        setSelectedYear(year);
        setLoadingClasses(true);
        
        try {
            // Chiamata API per ottenere le classi dell'anno selezionato
            const response = await axiosInstance.get(`/schools/${school._id}/classes?academicYear=${year.year}`);
            if (response.data.status === 'success') {
                setYearClasses(response.data.data.classes || []);
            } else {
                setYearClasses([]);
                showNotification('Errore nel caricamento delle classi', 'error');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            showNotification('Errore nel caricamento delle classi', 'error');
            setYearClasses([]);
        } finally {
            setLoadingClasses(false);
        }
        
        setOpenClassesDialog(true);
    };
    
    const handleCloseClassesDialog = () => {
        setOpenClassesDialog(false);
        setSelectedYear(null);
        setYearClasses([]);
    };
    
    // Gestione form e submit
    const handleNewYearInputChange = (e) => {
        const { name, value } = e.target;
        setNewYearData({
            ...newYearData,
            [name]: value
        });
    };
    


const handleCreateNewYear = async () => {
    try {
        // Verifica se ci sono sezioni temporanee da creare
        const hasTemporarySection = tempNewSections.length > 0;
        
        if (hasTemporarySection) {
            showNotification('Creazione nuove sezioni in corso...', 'info');
            
            // Array per tenere traccia degli ID temporanei e reali
            const tempToRealIds = {};
            
            // Crea tutte le sezioni temporanee una per una
            for (const tempSection of tempNewSections) {
                try {
                    const response = await axiosInstance.post(`/schools/${school._id}/sections`, {
                        name: tempSection.name,
                        maxStudents: tempSection.maxStudents,
                        isActive: true
                    });
                    
                    if (response.data.status === 'success') {
                        const newSectionData = response.data.data.section;
                        // Salva la mappatura da ID temporaneo a ID reale
                        tempToRealIds[tempSection.id] = newSectionData._id;
                    }
                } catch (error) {
                    console.error(`Error creating section ${tempSection.name}:`, error);
                    showNotification(
                        `Errore nella creazione della sezione ${tempSection.name}`, 
                        'error'
                    );
                    // Non interrompere il loop, continua con le altre sezioni
                }
            }
            
            // Aggiorna gli ID selezionati, sostituendo quelli temporanei con quelli reali
            const updatedSelectedSections = selectedSections.map(id => {
                // Se è un ID temporaneo, sostituiscilo con quello reale
                if (id.toString().startsWith('temp-') && tempToRealIds[id]) {
                    return tempToRealIds[id];
                }
                return id;
            });
            
            // Prepara i dati con le sezioni selezionate aggiornate
            const dataToSend = {
                ...newYearData,
                selectedSections: updatedSelectedSections
            };
            
            // Invia la richiesta di creazione anno
            const response = await axiosInstance.post(
                `/schools/${school._id}/academic-years`, 
                dataToSend
            );
            
            if (response.data.status === 'success') {
                showNotification(
                    newYearData.createClasses
                        ? 'Anno accademico creato con successo e classi generate'
                        : 'Anno accademico creato con successo', 
                    'success'
                );
                // Aggiorna i dati della scuola per riflettere il nuovo anno
                await getSchoolById(school._id);
                
                // Resetta le sezioni temporanee
                setTempNewSections([]);
                
                handleCloseNewYearDialog();
            }
        } else {
            // Nessuna sezione temporanea, procedi normalmente
            const dataToSend = {
                ...newYearData,
                selectedSections: selectedSections
            };
            
            const response = await axiosInstance.post(
                `/schools/${school._id}/academic-years`, 
                dataToSend
            );
            
            if (response.data.status === 'success') {
                showNotification(
                    newYearData.createClasses
                        ? 'Anno accademico creato con successo e classi generate'
                        : 'Anno accademico creato con successo', 
                    'success'
                );
                // Aggiorna i dati della scuola per riflettere il nuovo anno
                await getSchoolById(school._id);
                handleCloseNewYearDialog();
            }
        }
    } catch (error) {
        console.error('Error creating academic year:', error);
        showNotification(
            error.response?.data?.error?.message || 'Errore nella creazione dell\'anno accademico', 
            'error'
        );
    }
};
    
    const handleActivateYear = async (yearId) => {
        try {
            const response = await axiosInstance.post(`/schools/${school._id}/academic-years/${yearId}/activate`);
            
            if (response.data.status === 'success') {
                showNotification('Anno accademico attivato con successo', 'success');
                // Aggiorna i dati della scuola
                await getSchoolById(school._id);
            }
        } catch (error) {
            console.error('Error activating academic year:', error);
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'attivazione dell\'anno accademico', 
                'error'
            );
        }
    };
    
    const handleArchiveYear = async (yearId) => {
        setYearToArchive(currentYear);
        setOpenArchiveDialog(true);
    };

    const handleConfirmArchive = async () => {
        try {
            const response = await axiosInstance.post(
                `/schools/${school._id}/academic-years/${yearToArchive._id}/archive`
            );
            
            if (response.data.status === 'success') {
                showNotification('Anno accademico archiviato con successo', 'success');
                await getSchoolById(school._id);
            }
            setOpenArchiveDialog(false);
        } catch (error) {
            console.error('Error archiving academic year:', error);
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'archiviazione dell\'anno accademico', 
                'error'
            );
        }
    };

    // Aggiungi queste funzioni per gestire la creazione di nuove sezioni
const handleOpenNewSectionDialog = () => {
    setNewSectionData({
        name: '',
        maxStudents: school?.defaultMaxStudentsPerClass || 25
    });
    setOpenNewSectionDialog(true);
};

const handleCloseNewSectionDialog = () => {
    setOpenNewSectionDialog(false);
};

const handleNewSectionInputChange = (e) => {
    const { name, value } = e.target;
    setNewSectionData({
        ...newSectionData,
        [name]: name === 'maxStudents' ? parseInt(value) : value
    });
};

const handleCreateNewSection = async () => {
    try {
        // Validazione
        if (!newSectionData.name || !/^[A-Z]$/.test(newSectionData.name)) {
            showNotification('Il nome della sezione deve essere una singola lettera maiuscola (A-Z)', 'error');
            return;
        }
        
        // Verifica se la sezione esiste già
        const sectionExists = school.sections.some(
            s => s.name.toUpperCase() === newSectionData.name.toUpperCase()
        );
        
        if (sectionExists) {
            showNotification('Esiste già una sezione con questo nome', 'error');
            return;
        }
        
        // Crea la nuova sezione
        const response = await axiosInstance.post(`/schools/${school._id}/sections`, {
            name: newSectionData.name,
            maxStudents: newSectionData.maxStudents,
            isActive: true
        });
        
        if (response.data.status === 'success') {
            // Aggiorna i dati della scuola
            await getSchoolById(school._id);
            
            // Aggiorna le sezioni disponibili per la creazione dell'anno
            const newSection = response.data.data.section;
            setSchoolSections(prev => [
                ...prev,
                {
                    id: newSection._id,
                    name: newSection.name,
                    maxStudents: newSection.maxStudents
                }
            ]);
            
            // Aggiunge la nuova sezione alla selezione
            setSelectedSections(prev => [...prev, newSection._id]);
            
            showNotification('Sezione creata con successo', 'success');
            handleCloseNewSectionDialog();
        }
    } catch (error) {
        console.error('Error creating section:', error);
        showNotification(
            error.response?.data?.error?.message || 'Errore nella creazione della sezione', 
            'error'
        );
    }
};
    
    // Card per l'anno corrente
    const CurrentYearCard = () => (
        <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <EventIcon color="primary" fontSize="large" />
                    <Typography variant="h6">Anno Accademico Corrente</Typography>
                    {currentYear && (
                        <Chip 
                            label="Attivo"
                            color="success"
                            size="small"
                        />
                    )}
                </Box>

                {currentYear ? (
                    <>
                        <Grid container spacing={3} mb={3}>
                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Anno
                                        </Typography>
                                        <Typography variant="h5">
                                            {formatYearDisplay(currentYear.year)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Data Inizio
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(currentYear.startDate)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Data Fine
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(currentYear.endDate)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                        <Box display="flex" justifyContent="space-between">
                        <Button 
                            variant="outlined" 
                            startIcon={<ClassesIcon />}
                            onClick={() => handleOpenClassesDialog(currentYear)}
                        >
                            Visualizza Classi
                        </Button>
                        
                        <Box>
                            <YearTransitionButton 
                            school={school} 
                            onTransitionComplete={() => getSchoolById(school._id)}
                            />
                            
                            <Button 
                            variant="outlined" 
                            color="warning"
                            startIcon={<ArchiveIcon />}
                            onClick={() => handleArchiveYear(currentYear._id)}
                            sx={{ ml: 1 }}
                            >
                            Archivia Anno
                            </Button>
                        </Box>
                        </Box>
                       
                    </>
                ) : (
                    <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Nessun anno accademico attivo. Attiva un anno pianificato o crea un nuovo anno accademico.
                        </Alert>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />}
                            onClick={handleOpenNewYearDialog}
                        >
                            Crea Nuovo Anno Accademico
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    // Card per gli anni pianificati
    const PlannedYearsCard = () => (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <AccessTimeIcon color="info" />
                    <Typography variant="h6">Anni Accademici Pianificati</Typography>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={handleOpenNewYearDialog}
                    >
                        Aggiungi
                    </Button>
                </Stack>

                {plannedYears.length > 0 ? (
                    <List>
                        {plannedYears.map((year, index) => (
                            <React.Fragment key={year._id || index}>
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            <Tooltip title="Visualizza Classi">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleOpenClassesDialog(year)}
                                                >
                                                    <ClassesIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Attiva Anno">
                                                <IconButton 
                                                    edge="end" 
                                                    color="success"
                                                    onClick={() => handleActivateYear(year._id)}
                                                >
                                                    <ActivateIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center">
                                                <Typography variant="subtitle1" component="span">
                                                    {formatYearDisplay(year.year)}
                                                </Typography>
                                                <Chip
                                                    label="Pianificato"
                                                    size="small"
                                                    color="info"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" component="span" color="text.secondary">
                                                Inizio: {formatDate(year.startDate)} • Fine: {formatDate(year.endDate)}
                                            </Typography>
                                        }
                                        disableTypography
                                    />
                                </ListItem>
                                {index < plannedYears.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            Nessun anno accademico pianificato
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    // Card per lo storico anni
    const PastYearsCard = () => (
        <Card elevation={2}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <ArchiveIcon color="primary" />
                    <Typography variant="h6">Storico Anni Accademici</Typography>
                </Stack>

                {pastYears.length > 0 ? (
                    <List>
                        {pastYears.map((year, index) => (
                            <React.Fragment key={year._id || index}>
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            <Tooltip title="Visualizza Classi">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleOpenClassesDialog(year)}
                                                >
                                                    <ClassesIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Riattiva Anno">
                                                <IconButton 
                                                    edge="end" 
                                                    color="primary"
                                                    onClick={() => handleReactivateYear(year)}
                                                >
                                                    <RestoreIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center">
                                                <Typography variant="subtitle1" component="span">
                                                    {formatYearDisplay(year.year)}
                                                </Typography>
                                                <Chip
                                                    label="Archiviato"
                                                    size="small"
                                                    color="default"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" component="span" color="text.secondary">
                                                Inizio: {formatDate(year.startDate)} • Fine: {formatDate(year.endDate)}
                                            </Typography>
                                        }
                                        disableTypography
                                    />
                                </ListItem>
                                {index < pastYears.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            Nessuno storico disponibile
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    
    // Aggiungiamo la funzione per attivare temporaneamente sezioni inattive
    const handleToggleInactiveSection = (sectionId) => {
        const section = schoolSections.find(s => s.id === sectionId);
        
        if (!section) return;
        
        if (selectedSections.includes(sectionId)) {
            // Se già selezionata, rimuovila
            setSelectedSections(prev => prev.filter(id => id !== sectionId));
            showNotification(`Sezione ${section.name} esclusa dall'anno accademico`, 'info');
        } else {
            // Altrimenti, aggiungila
            setSelectedSections(prev => [...prev, sectionId]);
            showNotification(`Sezione ${section.name} inclusa nell'anno accademico`, 'success');
        }
    };

    // Funzione per gestire la riattivazione di un anno archiviato
    const handleReactivateYear = async (year) => {
        setYearToReactivate(year);
        setOpenReactivateDialog(true);
    };

    const handleConfirmReactivate = async () => {
        try {
            const response = await axiosInstance.post(
                `/schools/${school._id}/academic-years/${yearToReactivate._id}/reactivate`
            );
            
            if (response.data.status === 'success') {
                showNotification('Anno accademico riattivato con successo. Ora è in stato "pianificato" e può essere attivato.', 'success');
                await getSchoolById(school._id);
            }
            setOpenReactivateDialog(false);
        } catch (error) {
            console.error('Error reactivating academic year:', error);
            showNotification(
                error.response?.data?.error?.message || 'Errore nella riattivazione dell\'anno accademico', 
                'error'
            );
            setOpenReactivateDialog(false);
        }
    };

    // Dialog per creazione nuovo anno
    const NewYearDialog = () => (
        <Dialog 
            open={openNewYearDialog} 
            onClose={handleCloseNewYearDialog}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>Crea Nuovo Anno Accademico</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Inserisci i dettagli per il nuovo anno accademico.
                </DialogContentText>
                
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            label="Anno Accademico"
                            name="year"
                            value={newYearData.year}
                            onChange={handleNewYearInputChange}
                            fullWidth
                            margin="normal"
                            helperText="Formato: YYYY/YYYY (es. 2023/2024)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Data Inizio"
                            name="startDate"
                            type="date"
                            value={newYearData.startDate}
                            onChange={handleNewYearInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Data Fine"
                            name="endDate"
                            type="date"
                            value={newYearData.endDate}
                            onChange={handleNewYearInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Stato"
                            name="status"
                            value={newYearData.status}
                            onChange={handleNewYearInputChange}
                            fullWidth
                            margin="normal"
                        >
                            <MenuItem value="planned">Pianificato</MenuItem>
                            <MenuItem value="active">Attivo</MenuItem>
                        </TextField>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={newYearData.createClasses}
                                    onChange={(e) => setNewYearData({
                                        ...newYearData,
                                        createClasses: e.target.checked
                                    })}
                                    name="createClasses"
                                />
                            }
                            label="Crea automaticamente le classi per il nuovo anno"
                        />
                    </Grid>
                    
                    {newYearData.createClasses && (
    <Grid item xs={12}>
        
        <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenNewSectionDialog}
                >
                    Aggiungi nuova sezione
                </Button>//da tenere???
        <Box sx={{ mb: 2 }}>
            <Button 
                variant="outlined" 
                onClick={() => setShowSectionSelector(!showSectionSelector)}
                startIcon={showSectionSelector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                size="small"
            >
                {showSectionSelector ? 'Nascondi sezioni' : 'Scegli le sezioni da attivare'}
            </Button>
        </Box>
        
        <Collapse in={showSectionSelector}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                        Sezioni da attivare per il nuovo anno
                    </Typography>
                    <Button 
                        size="small" 
                        onClick={handleToggleAllSections}
                    >
                        {selectedSections.length === schoolSections.length ? 'Deseleziona tutte' : 'Seleziona tutte'}
                    </Button>
                </Box>
                
                {schoolSections.length > 0 ? (
    <Grid container spacing={1}>
                {schoolSections
            .filter(section => section.isActive) // Mostra solo sezioni attive
            .map((section) => {
                // Determina se la sezione è già configurata per questo anno
                const isAlreadyConfigured = section.hasConfigForYear;
                // Determina se la sezione è usata in altri anni
                const usedInOtherYears = section.usedInYears && section.usedInYears.length > 0;
                // Determina se è una sezione temporanea
                const isTemp = section.isTemp;
                
                return (
                    <Grid item xs={12} sm={6} md={4} key={section.id}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedSections.includes(section.id)}
                                    onChange={() => handleSectionToggle(section.id)}
                                    disabled={isAlreadyConfigured} // Disabilita se già configurata
                                />
                            }
                            label={
                                <Box>
                                    <Typography 
                                        variant="body2"
                                        component="span"
                                        sx={isTemp ? { fontStyle: 'italic', color: 'primary.main' } : {}}
                                    >
                                        Sezione {section.name} {isAlreadyConfigured && "(già configurata)"}
                                        {isTemp && " (nuova)"}
                                    </Typography>
                                    <Typography variant="caption" component="span" display="block" color="text.secondary">
                                        Max {section.maxStudents} studenti
                                        {usedInOtherYears && !isAlreadyConfigured && ` • Usata in ${section.usedInYears.length} anni`}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Grid>
                );
        })}
    </Grid>
                ) : (
                    <Typography color="text.secondary">
                        Nessuna sezione attiva disponibile
                    </Typography>
                )}

                {schoolSections.filter(section => !section.isActive).length > 0 && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Sezioni inattive:
                        </Typography>
                        <Grid container spacing={1}>
                            {schoolSections
                                .filter(section => !section.isActive)
                                .map((section) => (
                                    <Grid item key={section.id}>
                                        <Chip
                                            label={`Sezione ${section.name}`}
                                            variant="outlined"
                                            color="default"
                                            onClick={() => {
                                                // Attiva temporaneamente questa sezione solo per questo anno
                                                handleToggleInactiveSection(section.id);
                                            }}
                                        />
                                    </Grid>
                                ))}
                        </Grid>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Clicca su una sezione inattiva per includerla in questo anno accademico
                        </Typography>
                    </Box>
                )}
                
                {/* Nuova sezione per aggiungere rapidamente sezioni con chips */}
                {availableLetters.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Aggiungi nuove sezioni:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {availableLetters.map(letter => (
                                <Chip
                                    key={letter}
                                    label={letter}
                                    onClick={() => handleQuickAddSection(letter)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ 
                                        fontWeight: 'bold',
                                        width: '36px',
                                        height: '36px' 
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Clicca su una lettera per creare rapidamente una nuova sezione
                        </Typography>
                    </Box>
                )}
                
                {/* Pulsante per aprire il dialog di creazione sezione avanzata */}
                {availableLetters.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<AddIcon />}
                            onClick={handleOpenNewSectionDialog}
                        >
                            Configurazione avanzata sezione
                        </Button>
                    </Box>
                )}
            </Paper>
        </Collapse>
        
        <Typography variant="caption" color="text.secondary" display="block">
            {showSectionSelector 
                ? "Seleziona le sezioni per cui vuoi creare classi nel nuovo anno accademico."
                : "Verranno create classi per tutte le sezioni attive selezionate."}
        </Typography>
    </Grid>
)}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseNewYearDialog}>Annulla</Button>
                <Button 
                    onClick={handleCreateNewYear} 
                    variant="contained"
                    disabled={
                        !newYearData.year || 
                        !newYearData.year.match(/^\d{4}\/\d{4}$/) ||
                        !newYearData.startDate ||
                        !newYearData.endDate ||
                        (newYearData.createClasses && selectedSections.length === 0)
                    }
                >
                    Crea
                </Button>
            </DialogActions>
        </Dialog>
    );

    const NewSectionDialog = () => (
        <Dialog 
            open={openNewSectionDialog} 
            onClose={handleCloseNewSectionDialog}
        >
            <DialogTitle>Crea Nuova Sezione</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Inserisci i dettagli per la nuova sezione.
                </DialogContentText>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            label="Nome Sezione"
                            name="name"
                            value={newSectionData.name}
                            onChange={handleNewSectionInputChange}
                            fullWidth
                            margin="normal"
                            helperText="Inserisci una lettera maiuscola (A-Z)"
                            inputProps={{
                                maxLength: 1,
                                style: { textTransform: 'uppercase' }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Numero massimo studenti"
                            name="maxStudents"
                            type="number"
                            value={newSectionData.maxStudents}
                            onChange={handleNewSectionInputChange}
                            fullWidth
                            margin="normal"
                            InputProps={{
                                inputProps: { 
                                    min: 15, 
                                    max: school?.schoolType === 'middle_school' ? 30 : 35 
                                }
                            }}
                            helperText={`Minimo: 15, Massimo: ${school?.schoolType === 'middle_school' ? 30 : 35}`}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseNewSectionDialog}>Annulla</Button>
                <Button 
                    onClick={handleCreateNewSection} 
                    variant="contained"
                    disabled={!newSectionData.name || !/^[A-Z]$/.test(newSectionData.name)}
                >
                    Crea
                </Button>
            </DialogActions>
        </Dialog>
    );
    
    

    // Dialog per visualizzazione classi
    const ClassesDialog = () => (
        <Dialog 
            open={openClassesDialog} 
            onClose={handleCloseClassesDialog}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                Classi - Anno Accademico {selectedYear ? formatYearDisplay(selectedYear.year) : ''}
            </DialogTitle>
            <DialogContent>
                {loadingClasses ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography component="div">Caricamento classi...</Typography>
                    </Box>
                ) : yearClasses.length > 0 ? (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {yearClasses.map((classItem) => (
                            <Grid item xs={12} sm={6} md={4} key={classItem._id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography component="div" variant="h6" gutterBottom>
                                            {classItem.year}ª {classItem.section}
                                        </Typography>
                                        <Stack spacing={1}>
                                            <Typography component="div" variant="body2">
                                                Studenti: {classItem.activeStudentsCount || 0} / {classItem.capacity || '-'}
                                            </Typography>
                                            <Chip 
                                                label={classItem.status} 
                                                color={
                                                    classItem.status === 'active' ? 'success' : 
                                                    classItem.status === 'planned' ? 'info' : 'default'
                                                }
                                                size="small"
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography component="div" color="text.secondary">
                            Nessuna classe trovata per questo anno accademico
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseClassesDialog}>Chiudi</Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box>
            <CurrentYearCard>
           
            </CurrentYearCard>
            <PlannedYearsCard />
            <PastYearsCard />

            {/* Dialoghi */}
            <NewYearDialog>
                
            </NewYearDialog>
            <ClassesDialog />
            <NewSectionDialog /> {/* Nuovo dialog */}

            {/* Dialog di conferma archiviazione */}
            <Dialog
                open={openArchiveDialog}
                onClose={() => setOpenArchiveDialog(false)}
            >
                <DialogTitle>
                    Conferma Archiviazione Anno Accademico
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography component="div">
                            NOTA: Questa operazione è riservata agli utenti Administrator e Developer.
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography component="div">
                            Stai per archiviare l'anno accademico {yearToArchive?.year}. Questa operazione:
                        </Typography>
                    </Box>
                    <ul>
                        <li>Archivierà tutte le classi dell'anno</li>
                        <li>Rimuoverà tutti i riferimenti agli insegnanti dalle classi</li>
                        <li>Disattiverà gli studenti delle classi coinvolte</li>
                        <li>Rimuoverà i riferimenti alle classi e agli studenti dai profili degli insegnanti</li>
                        {yearToArchive?.status === 'active' && (
                            <li>Attiverà automaticamente l'anno pianificato più recente (se presente)</li>
                        )}
                    </ul>
                    <Box sx={{ mt: 2 }}>
                        <Typography component="div" color="error">
                            Questa operazione non può essere annullata. Sei sicuro di voler procedere?
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenArchiveDialog(false)}>
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleConfirmArchive} 
                        color="warning"
                        variant="contained"
                    >
                        Conferma Archiviazione
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di conferma riattivazione */}
            <Dialog
                open={openReactivateDialog}
                onClose={() => setOpenReactivateDialog(false)}
            >
                <DialogTitle>
                    Conferma Riattivazione Anno Accademico
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography component="div">
                            Stai per riattivare l'anno accademico {yearToReactivate?.year}.
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography component="div">
                            Questa operazione:
                        </Typography>
                        <ul>
                            <li>Ripristinerà l'anno accademico in stato "pianificato"</li>
                            <li>Permetterà di attivare nuovamente l'anno</li>
                            <li>Non ripristinerà automaticamente le classi e gli studenti archiviati</li>
                        </ul>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography component="div">
                            Vuoi procedere con la riattivazione dell'anno accademico?
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReactivateDialog(false)}>
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleConfirmReactivate} 
                        color="primary"
                        variant="contained"
                    >
                        Conferma Riattivazione
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AcademicYearsTab;