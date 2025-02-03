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
    Stack
} from '@mui/material';

const CATEGORIES = ['Elaborazione', 'Creatività', 'Preferenza Visiva', 'Decisione', 'Autonomia'];

const CSIQuestionDialog = ({ open, question, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        testo: '',
        categoria: '',
        metadata: { polarity: '+' },
        version: '1.0.0',
        active: true
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
                active: true
            });
        }
    }, [question]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'polarity') {
            setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, polarity: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = () => {
        onSave(formData);
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