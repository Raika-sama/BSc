import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Grid,
    TextField,
    Button
} from '@mui/material';

const NewSectionDialog = ({
    open,
    handleClose,
    newSectionData,
    handleNewSectionInputChange,
    handleCreateNewSection,
    isLoading,
    schoolType
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
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
                                    max: schoolType === 'middle_school' ? 30 : 35 
                                }
                            }}
                            helperText={`Minimo: 15, Massimo: ${schoolType === 'middle_school' ? 30 : 35}`}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Annulla</Button>
                <Button 
                    onClick={handleCreateNewSection} 
                    variant="contained"
                    disabled={isLoading || !newSectionData.name || !/^[A-Z]$/.test(newSectionData.name)}
                >
                    {isLoading ? 'Creazione in corso...' : 'Crea'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewSectionDialog;