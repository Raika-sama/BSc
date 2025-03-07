import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Grid,
    TextField,
    MenuItem,
    Button,
    Box,
    Paper,
    Typography,
    FormControlLabel,
    Checkbox,
    Collapse
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

// Importa il componente SectionSelector
import SectionSelector from '../components/SectionSelector';

const NewYearDialog = ({
    open,
    handleClose,
    newYearData,
    handleNewYearInputChange,
    handleCreateNewYear,
    showSectionSelector,
    setShowSectionSelector,
    schoolSections,
    selectedSections,
    handleSectionToggle,
    handleToggleAllSections,
    handleToggleInactiveSection,
    availableLetters,
    handleQuickAddSection,
    handleOpenNewSectionDialog,
    isLoading,
    tempNewSections
}) => {
    // Creiamo un wrapper attorno a handleSectionToggle per compatibilità con SectionSelector
    const setSelectedSections = (newSections) => {
        // Se riceviamo una funzione (come in setState), la chiamiamo con l'array corrente
        if (typeof newSections === 'function') {
            const updatedSections = newSections(selectedSections);
            
            // Aggiungiamo ogni nuova sezione 
            updatedSections.filter(id => !selectedSections.includes(id))
                .forEach(id => handleSectionToggle(id));
            
            // Rimuoviamo ogni sezione non più presente
            selectedSections.filter(id => !updatedSections.includes(id))
                .forEach(id => handleSectionToggle(id));
        } else {
            // Se riceviamo un array, calcoliamo le differenze e applichiamo le modifiche
            const addedSections = newSections.filter(id => !selectedSections.includes(id));
            const removedSections = selectedSections.filter(id => !newSections.includes(id));
            
            // Aggiungi nuove sezioni
            addedSections.forEach(id => handleSectionToggle(id));
            
            // Rimuovi sezioni non più presenti
            removedSections.forEach(id => handleSectionToggle(id));
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
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
                                    onChange={(e) => handleNewYearInputChange({
                                        target: {
                                            name: 'createClasses',
                                            value: e.target.checked
                                        }
                                    })}
                                    name="createClasses"
                                />
                            }
                            label="Crea automaticamente le classi per il nuovo anno"
                        />
                    </Grid>
                    
                    {newYearData.createClasses && (
                        <Grid item xs={12}>
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
                                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                        Sezioni da attivare per il nuovo anno
                                    </Typography>
                                    
                                    {/* Utilizzo del componente SectionSelector migliorato */}
                                    <SectionSelector 
                                        schoolSections={schoolSections}
                                        selectedSections={selectedSections}
                                        setSelectedSections={setSelectedSections}
                                        availableLetters={availableLetters}
                                        handleQuickAddSection={handleQuickAddSection}
                                        handleOpenNewSectionDialog={handleOpenNewSectionDialog}
                                        tempNewSections={tempNewSections}
                                    />
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
                <Button onClick={handleClose}>Annulla</Button>
                <Button 
                    onClick={handleCreateNewYear} 
                    variant="contained"
                    disabled={
                        isLoading ||
                        !newYearData.year || 
                        !newYearData.year.match(/^\d{4}\/\d{4}$/) ||
                        !newYearData.startDate ||
                        !newYearData.endDate ||
                        (newYearData.createClasses && selectedSections.length === 0)
                    }
                >
                    {isLoading ? 'Creazione in corso...' : 'Crea'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewYearDialog;