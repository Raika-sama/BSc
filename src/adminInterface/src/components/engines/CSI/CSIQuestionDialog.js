import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Stack
} from '@mui/material';

const CATEGORIES = ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia'];

const CSIQuestionDialog = ({ open, question, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        testo: '',
        categoria: '',
        metadata: { polarity: '+' },
        version: '1.0.0',
        active: true,
        weight: 1  // Valore predefinito per il peso
    });

    useEffect(() => {
        if (question) {
            setFormData(question);
        } else {
            setFormData({
                testo: '',
                categoria: '',
                metadata: { polarity: '+' },
                version: '1.0.0',
                active: true,
                weight: 1  // Reset al valore predefinito
            });
        }
    }, [question]);

   
const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Log di debug
    console.log('Handling change:', { name, value, checked });

    if (name === 'polarity') {
        setFormData(prev => ({
            ...prev,
            metadata: { ...prev.metadata, polarity: value }
        }));
    } 
    else if (name === 'weight') {
        // Assicurati che il peso sia un numero tra 0.1 e 10
        const numValue = Math.min(Math.max(parseFloat(value) || 0.1, 0.1), 10);
        setFormData(prev => ({
            ...prev,
            weight: numValue
        }));
    }
    else if (name === 'active') {
        setFormData(prev => ({
            ...prev,
            active: checked
        }));
    }
    else {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }
};

    // Modifichiamo handleSubmit per validare i dati prima dell'invio
    const handleSubmit = () => {
        // Validazione base
        if (!formData.testo || !formData.categoria || !formData.metadata?.polarity) {
            console.error('Validation failed:', formData);
            return;
        }

        // Assicuriamoci che tutti i campi necessari siano presenti
        const dataToSubmit = {
            ...formData,
            id: formData.id,
            weight: parseFloat(formData.weight) || 1,
            version: formData.version || '1.0.0',
            active: Boolean(formData.active)
        };

        console.log('Submitting data:', dataToSubmit); // Debug log
        onSave(dataToSubmit);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {question ? 'Modifica Domanda' : 'Nuova Domanda'}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Testo della domanda"
                        name="testo"
                        value={formData.testo}
                        onChange={handleChange}
                        multiline
                        rows={3}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Categoria</InputLabel>
                        <Select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                        >
                            {CATEGORIES.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Polarità</InputLabel>
                        <Select
                            name="polarity"
                            value={formData.metadata.polarity}
                            onChange={handleChange}
                        >
                            <MenuItem value="+">Positiva</MenuItem>
                            <MenuItem value="-">Negativa</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Peso"
                        name="weight"
                        type="number"
                        value={formData.weight}
                        onChange={handleChange}
                        inputProps={{
                            min: 0.1,
                            max: 10,
                            step: 0.1
                        }}
                        helperText="Inserisci un valore tra 0.1 e 10"
                    />

                    <TextField
                        fullWidth
                        label="Versione"
                        name="version"
                        value={formData.version}
                        onChange={handleChange}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.active}
                                onChange={(e) => handleChange({
                                    target: {
                                        name: 'active',
                                        value: e.target.checked
                                    }
                                })}
                            />
                        }
                        label="Domanda attiva"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annulla</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    color="primary"
                >
                    Salva
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CSIQuestionDialog;