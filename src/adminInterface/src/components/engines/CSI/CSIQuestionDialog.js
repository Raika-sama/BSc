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
        weight: 1
    });

    useEffect(() => {
        if (question) {
            // Se stiamo modificando una domanda esistente
            setFormData({
                ...question,
                metadata: {
                    polarity: question.metadata?.polarity || '+'
                },
                weight: question.weight || 1,
                version: question.version || '1.0.0',
                active: question.active ?? true
            });
        } else {
            // Reset per nuova domanda
            setFormData({
                testo: '',
                categoria: '',
                metadata: { polarity: '+' },
                version: '1.0.0',
                active: true,
                weight: 1
            });
        }
    }, [question]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        
        switch(name) {
            case 'polarity':
                setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, polarity: value }
                }));
                break;
            
            case 'weight':
                let weightValue = value;
                if (weightValue < 0.1) weightValue = 0.1;
                if (weightValue > 10) weightValue = 10;
                setFormData(prev => ({
                    ...prev,
                    weight: weightValue
                }));
                break;
            
            case 'active':
                setFormData(prev => ({
                    ...prev,
                    active: checked
                }));
                break;
            
            default:
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
        }
    };

    const handleSubmit = () => {
        if (!formData.testo.trim()) {
            alert('Il testo della domanda è obbligatorio');
            return;
        }
    
        if (!formData.categoria) {
            alert('La categoria è obbligatoria');
            return;
        }
    
        // Strutturiamo i dati nello stesso formato in cui li riceviamo
        const dataToSubmit = {
            id: formData.id,
            testo: formData.testo,
            categoria: formData.categoria,
            metadata: {
                polarity: formData.metadata.polarity,
                weight: parseFloat(formData.weight) || 1  // Mettiamo il weight dentro metadata
            },
            version: formData.version || '1.0.0',
            active: formData.active
        };
    
        console.log('Submitting data:', dataToSubmit); // Log per debug
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
                        required
                        label="Testo della domanda"
                        name="testo"
                        value={formData.testo}
                        onChange={handleChange}
                        multiline
                        rows={3}
                    />

                    <FormControl fullWidth required>
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
                                        checked: e.target.checked
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
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Salva
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CSIQuestionDialog;