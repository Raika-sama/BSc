import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Grid,
    TextField,
    Button,
    Box,
    Typography,
    Collapse,
    Paper
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

// Importa il componente SectionSelector
import SectionSelector from '../components/SectionSelector';

const EditYearDialog = ({
    open,
    handleClose,
    yearToEdit,
    editYearData,
    handleEditYearInputChange,
    handleSaveEditedYear,
    showSectionSelector,
    setShowSectionSelector,
    schoolSections,
    selectedSections,
    setSelectedSections,
    isLoading,
    availableLetters,
    handleQuickAddSection,
    handleOpenNewSectionDialog,
    tempNewSections
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>Modifica Anno Accademico</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Modifica i dettagli dell'anno accademico {yearToEdit?.year}.
                </DialogContentText>
                
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            label="Anno Accademico"
                            name="year"
                            value={editYearData.year}
                            onChange={handleEditYearInputChange}
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
                            value={editYearData.startDate}
                            onChange={handleEditYearInputChange}
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
                            value={editYearData.endDate}
                            onChange={handleEditYearInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Descrizione"
                            name="description"
                            value={editYearData.description}
                            onChange={handleEditYearInputChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={2}
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => setShowSectionSelector(!showSectionSelector)}
                                startIcon={showSectionSelector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                size="small"
                            >
                                {showSectionSelector ? 'Nascondi sezioni' : 'Gestisci sezioni per questo anno'}
                            </Button>
                        </Box>
                        
                        <Collapse in={showSectionSelector}>
                            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Sezioni abilitate per questo anno accademico
                                </Typography>
                                
                                {/* Integrazione del componente SectionSelector */}
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
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Annulla</Button>
                <Button 
                    onClick={handleSaveEditedYear}
                    variant="contained"
                    disabled={
                        isLoading ||
                        !editYearData.year || 
                        !editYearData.year.match(/^\d{4}\/\d{4}$/) ||
                        !editYearData.startDate ||
                        !editYearData.endDate
                    }
                >
                    {isLoading ? 'Salvataggio in corso...' : 'Salva Modifiche'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditYearDialog;