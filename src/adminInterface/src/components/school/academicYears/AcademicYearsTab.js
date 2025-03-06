import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useSchool } from '../../../context/SchoolContext';
import { useNotification } from '../../../context/NotificationContext';
import { axiosInstance } from '../../../services/axiosConfig';
import Loading from '../../common/Loading';

// Importazione dei sottocomponenti
import CurrentYearCard from './cards/CurrentYearCard';
import PlannedYearsCard from './cards/PlannedYearsCard';
import PastYearsCard from './cards/PastYearsCard';
import NewYearDialog from './dialogs/NewYearDialog';
import EditYearDialog from './dialogs/EditYearDialog';
import ClassesDialog from './dialogs/ClassesDialog';
import NewSectionDialog from './dialogs/NewSectionDialog';
import ArchiveYearDialog from './dialogs/ArchiveYearDialog';
import ReactivateYearDialog from './dialogs/ReactivateYearDialog';

/**
 * Componente principale per la gestione degli anni accademici.
 * È stato refactorizzato per migliorare la manutenibilità e la leggibilità
 * suddividendo la UI in componenti più piccoli.
 */
const AcademicYearsTab = ({ school }) => {
    const { showNotification } = useNotification();
    const { getSchoolById } = useSchool();
    
    // Stati della schermata
    const [schoolSections, setSchoolSections] = useState([]);
    const [selectedSections, setSelectedSections] = useState([]);
    const [showSectionSelector, setShowSectionSelector] = useState(false);
    const [tempNewSections, setTempNewSections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Stati per gli anni accademici
    const [currentYear, setCurrentYear] = useState(null);
    const [pastYears, setPastYears] = useState([]);
    const [plannedYears, setPlannedYears] = useState([]);
    
    // Stati per i dialoghi
    const [openNewYearDialog, setOpenNewYearDialog] = useState(false);
    const [openEditYearDialog, setOpenEditYearDialog] = useState(false);
    const [openClassesDialog, setOpenClassesDialog] = useState(false);
    const [openNewSectionDialog, setOpenNewSectionDialog] = useState(false);
    const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
    const [openReactivateDialog, setOpenReactivateDialog] = useState(false);
    
    // Stati per la gestione dei dati
    const [selectedYear, setSelectedYear] = useState(null);
    const [yearClasses, setYearClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [yearToArchive, setYearToArchive] = useState(null);
    const [yearToReactivate, setYearToReactivate] = useState(null);
    const [yearToEdit, setYearToEdit] = useState(null);

    // Stati per i form
    const [newSectionData, setNewSectionData] = useState({
        name: '',
        maxStudents: school?.defaultMaxStudentsPerClass || 25
    });
    
    const [newYearData, setNewYearData] = useState({
        year: "",
        startDate: "",
        endDate: "",
        status: "planned",
        createClasses: true
    });
    
    const [editYearData, setEditYearData] = useState({
        year: "",
        startDate: "",
        endDate: "",
        description: ""
    });
    
    // Stato per le lettere disponibili per le nuove sezioni
    const [availableLetters, setAvailableLetters] = useState([]);

    // Effetto per ordinare gli anni accademici all'avvio
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
    
    // Funzioni helper per la formattazione
    const formatYearDisplay = (yearString) => {
        if (!yearString) return 'N/A';
        return yearString;
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Non specificata';
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    // Funzione per ottenere l'anno scolastico corrente
    const getCurrentSchoolYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        if (month >= 9) {
            return `${year}/${year + 1}`;
        } else {
            return `${year - 1}/${year}`;
        }
    };

    // Funzione per suggerire l'anno accademico in modo intelligente
    const suggestAcademicYear = (currentActiveYear) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        let currentYear;
        if (month >= 9) {
            currentYear = `${year}/${year + 1}`;
        } else {
            currentYear = `${year - 1}/${year}`;
        }
        
        if (!currentActiveYear) {
            return currentYear;
        }
        
        if (currentActiveYear.year === currentYear) {
            const [firstPart, secondPart] = currentYear.split('/');
            return `${parseInt(firstPart) + 1}/${parseInt(secondPart) + 1}`;
        } else {
            return currentYear;
        }
    };
    
    // Gestione dei dialoghi: apertura, chiusura e submit
    const handleOpenNewYearDialog = () => {
        const suggestedYear = suggestAcademicYear(currentYear);
        
        const [startYear, endYear] = suggestedYear.split('/');
        const defaultStartDate = `${startYear}-09-01`;
        const defaultEndDate = `${endYear}-06-30`;
        
        const allSections = school.sections.map(s => ({
            id: s._id,
            name: s.name,
            maxStudents: s.maxStudents || school.defaultMaxStudentsPerClass,
            isActive: s.isActive,
            usedInYears: s.academicYears.map(ay => ay.year),
            hasConfigForYear: s.academicYears.some(ay => ay.year === suggestedYear)
        }));
        
        const activeSections = allSections.filter(s => s.isActive);
        
        setSchoolSections(allSections);
        setSelectedSections(activeSections.filter(s => !s.hasConfigForYear).map(s => s.id));
        
        // Genera l'array di lettere disponibili per nuove sezioni
        const existingSections = school.sections.map(s => s.name.toUpperCase());
        const allLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
        const unusedLetters = allLetters.filter(letter => !existingSections.includes(letter));
        
        setAvailableLetters(unusedLetters);
        
        setNewYearData({
            year: suggestedYear,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            status: 'planned',
            createClasses: true
        });
        
        setShowSectionSelector(false);
        setOpenNewYearDialog(true);
    };

    const handleCloseNewYearDialog = () => {
        // Ripristina le lettere per le sezioni temporanee
        if (tempNewSections.length > 0) {
            const tempLetters = tempNewSections.map(s => s.name);
            setAvailableLetters(prev => [...prev, ...tempLetters].sort());
            setTempNewSections([]);
        }
        
        setOpenNewYearDialog(false);
    };

    const handleOpenEditYearDialog = (year) => {
        setYearToEdit(year);
        
        // Prepara i dati delle sezioni della scuola
        const allSections = school.sections.map(s => {
            // Verifica se questa sezione è abilitata per questo anno accademico
            const sectionAcademicYear = s.academicYears.find(ay => ay.year === year.year);
            const isEnabledForYear = sectionAcademicYear && sectionAcademicYear.status === 'active';
            
            return {
                id: s._id,
                name: s.name,
                maxStudents: s.maxStudents || school.defaultMaxStudentsPerClass,
                isActive: s.isActive,
                isEnabledForYear: isEnabledForYear
            };
        });
        
        setSchoolSections(allSections);
        
        // Popola il campo selectedSections con le sezioni attualmente abilitate per questo anno
        const enabledSections = allSections
            .filter(s => s.isEnabledForYear)
            .map(s => s.name);
        
        setSelectedSections(enabledSections);
        
        // Genera l'array di lettere disponibili (non già usate come sezioni)
        const existingSections = school.sections.map(s => s.name.toUpperCase());
        const allLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z
        const unusedLetters = allLetters.filter(letter => !existingSections.includes(letter));
        
        setAvailableLetters(unusedLetters);
        
        // Resetta le sezioni temporanee
        setTempNewSections([]);
        
        // Popola i campi del form con i dati dell'anno accademico
        setEditYearData({
            year: year.year,
            startDate: year.startDate ? new Date(year.startDate).toISOString().split('T')[0] : '',
            endDate: year.endDate ? new Date(year.endDate).toISOString().split('T')[0] : '',
            description: year.description || ''
        });
        
        setOpenEditYearDialog(true);
    };
    
    const handleCloseEditYearDialog = () => {
        setOpenEditYearDialog(false);
        setYearToEdit(null);
    };
    
    const handleOpenClassesDialog = async (year) => {
        setSelectedYear(year);
        setLoadingClasses(true);
        
        try {
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
    
    // Gestione delle sezioni
    const handleSectionToggle = (sectionId) => {
        setSelectedSections(prev => {
            if (prev.includes(sectionId)) {
                return prev.filter(id => id !== sectionId);
            } else {
                return [...prev, sectionId];
            }
        });
    };
    
    const handleToggleAllSections = () => {
        if (selectedSections.length === schoolSections.length) {
            setSelectedSections([]);
        } else {
            setSelectedSections(schoolSections.map(s => s.id));
        }
    };
    
    const handleQuickAddSection = (letter) => {
        const tempSection = {
            id: `temp-${letter}`,
            name: letter,
            maxStudents: school.defaultMaxStudentsPerClass || 25,
            isActive: true,
            isTemp: true
        };
        
        setTempNewSections(prev => [...prev, tempSection]);
        setSchoolSections(prev => [...prev, tempSection]);
        setSelectedSections(prev => [...prev, tempSection.id]);
        setAvailableLetters(prev => prev.filter(l => l !== letter));
        
        showNotification(`Sezione ${letter} aggiunta (sarà creata al salvataggio)`, 'info');
    };
    
    const handleToggleInactiveSection = (sectionId) => {
        const section = schoolSections.find(s => s.id === sectionId);
        
        if (!section) return;
        
        if (selectedSections.includes(sectionId)) {
            setSelectedSections(prev => prev.filter(id => id !== sectionId));
            showNotification(`Sezione ${section.name} esclusa dall'anno accademico`, 'info');
        } else {
            setSelectedSections(prev => [...prev, sectionId]);
            showNotification(`Sezione ${section.name} inclusa nell'anno accademico`, 'success');
        }
    };
    
    // Handlers per il form e submission
    const handleNewYearInputChange = (e) => {
        const { name, value } = e.target;
        setNewYearData({
            ...newYearData,
            [name]: value
        });
    };
    
    const handleEditYearInputChange = (e) => {
        const { name, value } = e.target;
        setEditYearData({
            ...editYearData,
            [name]: value
        });
    };
    
    const handleNewSectionInputChange = (e) => {
        const { name, value } = e.target;
        setNewSectionData({
            ...newSectionData,
            [name]: name === 'maxStudents' ? parseInt(value) : value
        });
    };
    
    // Operazioni su anni accademici
    const handleCreateNewYear = async () => {
        try {
            setIsLoading(true);
            const hasTemporarySection = tempNewSections.length > 0;
            
            if (hasTemporarySection) {
                showNotification('Creazione nuove sezioni in corso...', 'info');
                
                const tempToRealIds = {};
                
                for (const tempSection of tempNewSections) {
                    try {
                        const response = await axiosInstance.post(`/schools/${school._id}/sections`, {
                            name: tempSection.name,
                            maxStudents: tempSection.maxStudents,
                            isActive: true
                        });
                        
                        if (response.data.status === 'success') {
                            const newSectionData = response.data.data.section;
                            tempToRealIds[tempSection.id] = newSectionData._id;
                        }
                    } catch (error) {
                        console.error(`Error creating section ${tempSection.name}:`, error);
                        showNotification(
                            `Errore nella creazione della sezione ${tempSection.name}`, 
                            'error'
                        );
                    }
                }
                
                const updatedSelectedSections = selectedSections.map(id => {
                    if (id.toString().startsWith('temp-') && tempToRealIds[id]) {
                        return tempToRealIds[id];
                    }
                    return id;
                });
                
                const dataToSend = {
                    ...newYearData,
                    selectedSections: updatedSelectedSections
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
                    await getSchoolById(school._id);
                    setTempNewSections([]);
                    handleCloseNewYearDialog();
                }
            } else {
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
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveEditedYear = async () => {
        try {
            setIsLoading(true);
            
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
                            
                            // Aggiungi il nome della sezione all'array selectedSections
                            if (!selectedSections.includes(newSectionData.name)) {
                                setSelectedSections(prev => [...prev, newSectionData.name]);
                            }
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
                
                // Invia la richiesta di aggiornamento anno
                const dataToSend = {
                    ...editYearData,
                    selectedSections
                };
                
                // Correzione dell'URL dell'API - rimuovere "v1" dal percorso
                const response = await axiosInstance.put(
                    `/schools/${school._id}/academic-years/${yearToEdit._id}`, 
                    dataToSend
                );
                
                if (response.data.status === 'success') {
                    showNotification('Anno accademico aggiornato con successo', 'success');
                    await getSchoolById(school._id);
                    
                    // Resetta le sezioni temporanee
                    setTempNewSections([]);
                    
                    handleCloseEditYearDialog();
                }
            } else {
                // Nessuna sezione temporanea, procedi normalmente
                const dataToSend = {
                    ...editYearData,
                    selectedSections
                };
                
                // Correzione dell'URL dell'API - rimuovere "v1" dal percorso
                const response = await axiosInstance.put(
                    `/schools/${school._id}/academic-years/${yearToEdit._id}`, 
                    dataToSend
                );
                
                if (response.data.status === 'success') {
                    showNotification('Anno accademico aggiornato con successo', 'success');
                    await getSchoolById(school._id);
                    handleCloseEditYearDialog();
                }
            }
        } catch (error) {
            console.error('Error updating academic year:', error);
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'aggiornamento dell\'anno accademico', 
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateNewSection = async () => {
        try {
            setIsLoading(true);
            if (!newSectionData.name || !/^[A-Z]$/.test(newSectionData.name)) {
                showNotification('Il nome della sezione deve essere una singola lettera maiuscola (A-Z)', 'error');
                return;
            }
            
            const sectionExists = school.sections.some(
                s => s.name.toUpperCase() === newSectionData.name.toUpperCase()
            );
            
            if (sectionExists) {
                showNotification('Esiste già una sezione con questo nome', 'error');
                return;
            }
            
            const response = await axiosInstance.post(`/schools/${school._id}/sections`, {
                name: newSectionData.name,
                maxStudents: newSectionData.maxStudents,
                isActive: true
            });
            
            if (response.data.status === 'success') {
                await getSchoolById(school._id);
                
                const newSection = response.data.data.section;
                setSchoolSections(prev => [
                    ...prev,
                    {
                        id: newSection._id,
                        name: newSection.name,
                        maxStudents: newSection.maxStudents
                    }
                ]);
                
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
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleActivateYear = async (yearId) => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.post(`/schools/${school._id}/academic-years/${yearId}/activate`);
            
            if (response.data.status === 'success') {
                showNotification('Anno accademico attivato con successo', 'success');
                await getSchoolById(school._id);
            }
        } catch (error) {
            console.error('Error activating academic year:', error);
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'attivazione dell\'anno accademico', 
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleArchiveYear = () => {
        setYearToArchive(currentYear);
        setOpenArchiveDialog(true);
    };

    const handleConfirmArchive = async () => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReactivateYear = (year) => {
        setYearToReactivate(year);
        setOpenReactivateDialog(true);
    };

    const handleConfirmReactivate = async () => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box>
            {isLoading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                          backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                          zIndex: 9999, 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center' }}>
                    <Loading message="Operazione in corso..." />
                </Box>
            )}

            {/* Cards */}
            <CurrentYearCard 
                currentYear={currentYear}
                formatYearDisplay={formatYearDisplay}
                formatDate={formatDate}
                handleOpenClassesDialog={handleOpenClassesDialog}
                handleOpenEditYearDialog={handleOpenEditYearDialog}
                handleArchiveYear={handleArchiveYear}
                handleOpenNewYearDialog={handleOpenNewYearDialog}
                school={school}
                getSchoolById={getSchoolById}
            />
            
            <PlannedYearsCard 
                plannedYears={plannedYears}
                formatYearDisplay={formatYearDisplay}
                formatDate={formatDate}
                handleOpenNewYearDialog={handleOpenNewYearDialog}
                handleOpenEditYearDialog={handleOpenEditYearDialog}
                handleOpenClassesDialog={handleOpenClassesDialog}
                handleActivateYear={handleActivateYear}
            />
            
            <PastYearsCard 
                pastYears={pastYears}
                formatYearDisplay={formatYearDisplay}
                formatDate={formatDate}
                handleOpenEditYearDialog={handleOpenEditYearDialog}
                handleOpenClassesDialog={handleOpenClassesDialog}
                handleReactivateYear={handleReactivateYear}
            />

            {/* Dialoghi */}
            <NewYearDialog 
                open={openNewYearDialog}
                handleClose={handleCloseNewYearDialog}
                newYearData={newYearData}
                handleNewYearInputChange={handleNewYearInputChange}
                handleCreateNewYear={handleCreateNewYear}
                showSectionSelector={showSectionSelector}
                setShowSectionSelector={setShowSectionSelector}
                schoolSections={schoolSections}
                selectedSections={selectedSections}
                handleSectionToggle={handleSectionToggle}
                handleToggleAllSections={handleToggleAllSections}
                handleToggleInactiveSection={handleToggleInactiveSection}
                availableLetters={availableLetters}
                handleQuickAddSection={handleQuickAddSection}
                handleOpenNewSectionDialog={handleOpenNewSectionDialog}
                isLoading={isLoading}
            />
            
            <EditYearDialog 
                open={openEditYearDialog}
                handleClose={handleCloseEditYearDialog}
                yearToEdit={yearToEdit}
                editYearData={editYearData}
                handleEditYearInputChange={handleEditYearInputChange}
                handleSaveEditedYear={handleSaveEditedYear}
                showSectionSelector={showSectionSelector}
                setShowSectionSelector={setShowSectionSelector}
                schoolSections={schoolSections}
                selectedSections={selectedSections}
                setSelectedSections={setSelectedSections}
                isLoading={isLoading}
                availableLetters={availableLetters}
                handleQuickAddSection={handleQuickAddSection}
                handleOpenNewSectionDialog={handleOpenNewSectionDialog}
                tempNewSections={tempNewSections}
            />
            
            <ClassesDialog 
                open={openClassesDialog}
                handleClose={handleCloseClassesDialog}
                selectedYear={selectedYear}
                yearClasses={yearClasses}
                loadingClasses={loadingClasses}
                formatYearDisplay={formatYearDisplay}
            />
            
            <NewSectionDialog 
                open={openNewSectionDialog}
                handleClose={handleCloseNewSectionDialog}
                newSectionData={newSectionData}
                handleNewSectionInputChange={handleNewSectionInputChange}
                handleCreateNewSection={handleCreateNewSection}
                isLoading={isLoading}
                schoolType={school?.schoolType}
            />
            
            <ArchiveYearDialog
                open={openArchiveDialog}
                handleClose={() => setOpenArchiveDialog(false)}
                yearToArchive={yearToArchive}
                handleConfirmArchive={handleConfirmArchive}
                isLoading={isLoading}
            />
            
            <ReactivateYearDialog
                open={openReactivateDialog}
                handleClose={() => setOpenReactivateDialog(false)}
                yearToReactivate={yearToReactivate}
                handleConfirmReactivate={handleConfirmReactivate}
                isLoading={isLoading}
            />
        </Box>
    );
};

export default AcademicYearsTab;