import React, { useState } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    TextField, 
    Switch, 
    FormControlLabel,
    Button,
    Grid,
    Divider 
} from '@mui/material';
import { useTest } from '../../../context/TestContext';
import { Save as SaveIcon } from '@mui/icons-material';

const CSIConfigurationPanel = () => {
    const { selectedTest, loading } = useTest();
    const [config, setConfig] = useState({
        tempoLimite: 30,
        tentativiMax: 1,
        cooldownPeriod: 168, // 1 settimana in ore
        randomizzaDomande: true,
        mostraRisultatiImmediati: false,
        istruzioni: ''
    });

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: e.target.type === 'checkbox' ? checked : value
        }));
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
            }}
        >
            <Typography variant="h6" gutterBottom>
                Configurazione CSI Test
            </Typography>
            
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Tempo Limite (minuti)"
                        name="tempoLimite"
                        type="number"
                        value={config.tempoLimite}
                        onChange={handleChange}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Periodo di Attesa (ore)"
                        name="cooldownPeriod"
                        type="number"
                        value={config.cooldownPeriod}
                        onChange={handleChange}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Tentativi Massimi"
                        name="tentativiMax"
                        type="number"
                        value={config.tentativiMax}
                        onChange={handleChange}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.randomizzaDomande}
                                onChange={handleChange}
                                name="randomizzaDomande"
                            />
                        }
                        label="Randomizza Ordine Domande"
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.mostraRisultatiImmediati}
                                onChange={handleChange}
                                name="mostraRisultatiImmediati"
                            />
                        }
                        label="Mostra Risultati Immediati"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Istruzioni Test"
                        name="istruzioni"
                        value={config.istruzioni}
                        onChange={handleChange}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        Salva Configurazione
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default CSIConfigurationPanel;