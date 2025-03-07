import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Divider,
    FormGroup,
    FormControlLabel,
    Checkbox,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    Badge
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    FilterList as FilterListIcon,
    Info as InfoIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

/**
 * Componente avanzato per la selezione delle sezioni.
 * Offre funzionalità di ricerca, filtro, e due modalità di visualizzazione (griglia e lista).
 */
const SectionSelector = ({
    schoolSections = [],
    selectedSections = [],
    setSelectedSections,
    availableLetters = [],
    handleQuickAddSection,
    handleOpenNewSectionDialog,
    tempNewSections = []
}) => {
    // Stati interni del componente
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'
    const [activeTab, setActiveTab] = useState(0); // 0: Tutte, 1: Attive, 2: Inattive
    
    // Filtra le sezioni in base alla ricerca e al tab attivo
    const filteredSections = schoolSections.filter(section => {
        // Filtra per termine di ricerca
        const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtra per tab attivo
        if (activeTab === 1 && !section.isActive) return false;
        if (activeTab === 2 && section.isActive) return false;
        
        return matchesSearch;
    });
    
    // Organizza le sezioni per stato
    const activeSections = filteredSections.filter(s => s.isActive);
    const inactiveSections = filteredSections.filter(s => !s.isActive);
    
    // Conta le sezioni per ogni categoria
    const totalCount = schoolSections.length;
    const activeCount = schoolSections.filter(s => s.isActive).length;
    const inactiveCount = schoolSections.filter(s => !s.isActive).length;
    
    // Determina se tutte le sezioni visualizzate sono selezionate
    const allFilteredSelected = filteredSections.length > 0 && 
        filteredSections.every(s => selectedSections.includes(s.name || s.id));
    
    // Funzione per selezionare/deselezionare tutte le sezioni filtrate
    const handleToggleAllFiltered = () => {
        if (allFilteredSelected) {
            // Deseleziona tutte le sezioni filtrate
            const filteredIds = filteredSections.map(s => s.name || s.id);
            setSelectedSections(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            // Seleziona tutte le sezioni filtrate
            const filteredIds = filteredSections.map(s => s.name || s.id);
            setSelectedSections(prev => {
                const currentSelected = new Set(prev);
                filteredIds.forEach(id => currentSelected.add(id));
                return Array.from(currentSelected);
            });
        }
    };
    
    // Funzione per selezionare/deselezionare una sezione
    const handleToggleSection = (section) => {
        const sectionId = section.name || section.id;
        
        if (selectedSections.includes(sectionId)) {
            // Deseleziona
            setSelectedSections(prev => prev.filter(id => id !== sectionId));
        } else {
            // Seleziona
            setSelectedSections(prev => [...prev, sectionId]);
        }
    };
    
    // Verifica se una sezione è temporanea (appena aggiunta)
    const isTempSection = (section) => {
        return section.isTemp || (tempNewSections && tempNewSections.some(s => s.id === section.id));
    };

    return (
        <Box>
            {/* Barra degli strumenti con ricerca e controlli */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <TextField
                    placeholder="Cerca sezione..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: '200px' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                
                <Tooltip title="Aggiungi nuova sezione">
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={handleOpenNewSectionDialog}
                    >
                        Nuova Sezione
                    </Button>
                </Tooltip>
                
                <Tooltip title={allFilteredSelected ? "Deseleziona tutte" : "Seleziona tutte"}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        onClick={handleToggleAllFiltered}
                        startIcon={allFilteredSelected ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    >
                        {allFilteredSelected ? "Deseleziona" : "Seleziona tutte"}
                    </Button>
                </Tooltip>
                
                <Tooltip title={viewMode === 'grid' ? "Vista lista" : "Vista griglia"}>
                    <IconButton 
                        size="small" 
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                        {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
            
            {/* Tabs per filtrare le sezioni */}
            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                >
                    <Tab 
                        label={
                            <Badge badgeContent={totalCount} color="primary">
                                <Typography variant="button">Tutte</Typography>
                            </Badge>
                        } 
                    />
                    <Tab 
                        label={
                            <Badge badgeContent={activeCount} color="success">
                                <Typography variant="button">Attive</Typography>
                            </Badge>
                        } 
                    />
                    <Tab 
                        label={
                            <Badge badgeContent={inactiveCount} color="error">
                                <Typography variant="button">Inattive</Typography>
                            </Badge>
                        } 
                    />
                </Tabs>
            </Box>
            
            {/* Visualizzazione a griglia o lista delle sezioni */}
            {filteredSections.length > 0 ? (
                viewMode === 'grid' ? (
                    <Grid container spacing={1}>
                        {filteredSections.map((section) => {
                            const isSelected = selectedSections.includes(section.name || section.id);
                            const isTemp = isTempSection(section);
                            
                            return (
                                <Grid item xs={6} sm={4} md={3} key={section.id || section.name}>
                                    <Paper 
                                        elevation={1} 
                                        sx={{ 
                                            p: 1.5, 
                                            cursor: 'pointer',
                                            borderLeft: '4px solid',
                                            borderColor: section.isActive ? 'success.main' : 'grey.400',
                                            bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            },
                                            position: 'relative',
                                            ...(isTemp && {
                                                borderStyle: 'dashed',
                                                borderWidth: 1,
                                                borderColor: 'primary.main'
                                            })
                                        }}
                                        onClick={() => handleToggleSection(section)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Checkbox 
                                                    checked={isSelected}
                                                    size="small"
                                                    sx={{ p: 0.5, mr: 1 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleSection(section);
                                                    }}
                                                />
                                                <Typography 
                                                    variant="h6" 
                                                    component="div"
                                                    sx={{
                                                        ...(isTemp && {
                                                            fontStyle: 'italic',
                                                            color: 'primary.main'
                                                        })
                                                    }}
                                                >
                                                    {section.name}
                                                    {isTemp && (
                                                        <Chip 
                                                            label="Nuova" 
                                                            size="small" 
                                                            color="primary"
                                                            sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                                                        />
                                                    )}
                                                </Typography>
                                            </Box>
                                            
                                            {!section.isActive && (
                                                <Tooltip title="Sezione inattiva">
                                                    <WarningIcon color="error" fontSize="small" />
                                                </Tooltip>
                                            )}
                                        </Box>
                                        
                                        <Typography variant="body2" color="text.secondary">
                                            Max {section.maxStudents} studenti
                                        </Typography>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : (
                    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                        {filteredSections.map((section, index) => {
                            const isSelected = selectedSections.includes(section.name || section.id);
                            const isTemp = isTempSection(section);
                            
                            return (
                                <React.Fragment key={section.id || section.name}>
                                    <Box 
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            p: 1.5,
                                            cursor: 'pointer',
                                            bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            },
                                            ...(isTemp && {
                                                borderStyle: 'dashed',
                                                borderWidth: 1,
                                                borderColor: 'primary.main'
                                            })
                                        }}
                                        onClick={() => handleToggleSection(section)}
                                    >
                                        <Checkbox 
                                            checked={isSelected}
                                            size="small"
                                            sx={{ mr: 1 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleSection(section);
                                            }}
                                        />
                                        
                                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                            <Typography 
                                                variant="body1" 
                                                component="div"
                                                sx={{ 
                                                    fontWeight: 'medium',
                                                    mr: 1,
                                                    ...(isTemp && {
                                                        fontStyle: 'italic',
                                                        color: 'primary.main'
                                                    })
                                                }}
                                            >
                                                Sezione {section.name}
                                            </Typography>
                                            
                                            {isTemp && (
                                                <Chip 
                                                    label="Nuova" 
                                                    size="small" 
                                                    color="primary"
                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                />
                                            )}
                                            
                                            <Box sx={{ flex: 1 }} />
                                            
                                            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                                Max {section.maxStudents} studenti
                                            </Typography>
                                            
                                            <Chip 
                                                label={section.isActive ? "Attiva" : "Inattiva"} 
                                                size="small" 
                                                color={section.isActive ? "success" : "default"}
                                            />
                                        </Box>
                                    </Box>
                                    {index < filteredSections.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </Paper>
                )
            ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        {searchTerm 
                            ? `Nessuna sezione trovata con "${searchTerm}"` 
                            : "Nessuna sezione disponibile"}
                    </Typography>
                </Paper>
            )}
            
            {/* Sezione per aggiungere nuove sezioni rapidamente */}
            {availableLetters && availableLetters.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Aggiungi nuove sezioni rapidamente:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
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
        </Box>
    );
};

export default SectionSelector;