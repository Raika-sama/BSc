// CSIQuestionDialog.js
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
    Stack,
    Alert
} from '@mui/material';

const CATEGORIES = ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia'];

const CSIQuestionDialog = ({ open, question, onClose, onSave, error }) => {
    const [formData, setFormData] = useState({
        testo: '',
        categoria: '',
        metadata: {
            polarity: '+',
            weight: 1,
            difficultyLevel: 'medio'
        },
        version: '1.0.0',
        active: true
    });

    useEffect(() => {
        if (question) {
            setFormData({
                ...question,
                metadata: {
                    polarity: question.metadata?.polarity || '+',
                    weight: question.metadata?.weight || 1,
                    difficultyLevel: question.metadata?.difficultyLevel || 'medio'
                },
                version: question.version || '1.0.0',
                active: question.active ?? true
            });
        } else {
            // Reset per nuova domanda
            setFormData({
                testo: '',
                categoria: '',
                metadata: {
                    polarity: '+',
                    weight: 1,
                    difficultyLevel: 'medio'
                },
                version: '1.0.0',
                active: true
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
                let weightValue = parseFloat(value);
                if (weightValue < 0.1) weightValue = 0.1;
                if (weightValue > 5) weightValue = 5;
                setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, weight: weightValue }
                }));
                break;
            
            case 'difficultyLevel':
                setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, difficultyLevel: value }
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
    
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {question ? 'Modifica Domanda' : 'Nuova Domanda'}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
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
                        value={formData.metadata.weight}
                        onChange={handleChange}
                        inputProps={{
                            min: 0.1,
                            max: 5,
                            step: 0.1
                        }}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Difficoltà</InputLabel>
                        <Select
                            name="difficultyLevel"
                            value={formData.metadata.difficultyLevel}
                            onChange={handleChange}
                        >
                            <MenuItem value="facile">Facile</MenuItem>
                            <MenuItem value="medio">Medio</MenuItem>
                            <MenuItem value="difficile">Difficile</MenuItem>
                        </Select>
                    </FormControl>

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