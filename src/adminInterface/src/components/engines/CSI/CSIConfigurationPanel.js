import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    TextField, 
    Switch, 
    FormControlLabel,
    Button,
    Grid,
    Divider,
    Tooltip
} from '@mui/material';
import { useCSITest } from '../../../context/TestContext/CSITestContext';
import { Save as SaveIcon } from '@mui/icons-material';

const CSIConfigurationPanel = () => {
    const { getTestConfiguration, updateTestConfiguration, loading = {} } = useCSITest();
    const [config, setConfig] = useState({
        version: '1.0.0',
        active: true,
        scoring: {
            categorie: [
                {
                    nome: 'Elaborazione',
                    pesoDefault: 1,
                    min: 1,
                    max: 5
                },
                {
                    nome: 'Creatività',
                    pesoDefault: 1,
                    min: 1,
                    max: 5
                }
                // ... altre categorie
            ],
            algoritmo: {
                version: '1.0.0',
                parametri: new Map([
                    ['tempoLimite', 30],
                    ['tentativiMax', 1],
                    ['cooldownPeriod', 168]
                ])
            }
        },
        validazione: {
            tempoMinimoDomanda: 2000,
            tempoMassimoDomanda: 300000,
            numeroMinimoDomande: 20,
            sogliaRisposteVeloci: 5
        },
        interfaccia: {
            istruzioni: '',
            mostraProgressBar: true,
            permettiTornaIndietro: false,
            mostraRisultatiImmediati: false
        },
        analytics: {
            metriche: [],
            pattern: new Map([
                ['checkConsistenza', true],
                ['checkTempi', true],
                ['checkPattern', true]
            ])
        }
    });

    useEffect(() => {
        const fetchConfig = async () => {
            const currentConfig = await getTestConfiguration();
            if (currentConfig) {
                // Convertiamo i parametri da oggetto a Map
                const parametriMap = new Map();
                if (currentConfig.scoring?.algoritmo?.parametri) {
                    Object.entries(currentConfig.scoring.algoritmo.parametri).forEach(([key, value]) => {
                        parametriMap.set(key, value);
                    });
                } else {
                    // Valori di default
                    parametriMap.set('tempoLimite', 30);
                    parametriMap.set('tentativiMax', 1);
                    parametriMap.set('cooldownPeriod', 168);
                }
    
                // Convertiamo il pattern da oggetto a Map
                const patternMap = new Map();
                if (currentConfig.analytics?.pattern) {
                    Object.entries(currentConfig.analytics.pattern).forEach(([key, value]) => {
                        patternMap.set(key, value);
                    });
                } else {
                    // Valori di default
                    patternMap.set('checkConsistenza', true);
                    patternMap.set('checkTempi', true);
                    patternMap.set('checkPattern', true);
                }
    
                setConfig({
                    version: currentConfig.version || '1.0.0',
                    active: currentConfig.active ?? true,
                    scoring: {
                        categorie: currentConfig.scoring?.categorie || [
                            {
                                nome: 'Elaborazione',
                                pesoDefault: 1,
                                min: 1,
                                max: 5
                            },
                            {
                                nome: 'Creatività',
                                pesoDefault: 1,
                                min: 1,
                                max: 5
                            }
                        ],
                        algoritmo: {
                            version: currentConfig.scoring?.algoritmo?.version || '1.0.0',
                            parametri: parametriMap
                        }
                    },
                    validazione: {
                        tempoMinimoDomanda: currentConfig.validazione?.tempoMinimoDomanda || 2000,
                        tempoMassimoDomanda: currentConfig.validazione?.tempoMassimoDomanda || 300000,
                        numeroMinimoDomande: currentConfig.validazione?.numeroMinimoDomande || 20,
                        sogliaRisposteVeloci: currentConfig.validazione?.sogliaRisposteVeloci || 5
                    },
                    interfaccia: {
                        randomizzaDomande: currentConfig.interfaccia?.randomizzaDomande ?? true,
                        mostraProgressBar: currentConfig.interfaccia?.mostraProgressBar ?? true,
                        permettiTornaIndietro: currentConfig.interfaccia?.permettiTornaIndietro ?? false,
                        mostraRisultatiImmediati: currentConfig.interfaccia?.mostraRisultatiImmediati ?? false,
                        istruzioni: currentConfig.interfaccia?.istruzioni || ''
                    },
                    analytics: {
                        metriche: currentConfig.analytics?.metriche || [],
                        pattern: patternMap
                    }
                });
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        const [section, subsection, field] = name.split('.');
        
        setConfig(prev => {
            if (subsection) {
                if (section === 'scoring' && subsection === 'algoritmo') {
                    // Gestione parametri algoritmo
                    const newParametri = new Map(prev.scoring.algoritmo.parametri);
                    newParametri.set(field, e.target.type === 'checkbox' ? checked : Number(value));
                    return {
                        ...prev,
                        scoring: {
                            ...prev.scoring,
                            algoritmo: {
                                ...prev.scoring.algoritmo,
                                parametri: newParametri
                            }
                        }
                    };
                } else {
                    // Gestione altri campi nested
                    return {
                        ...prev,
                        [section]: {
                            ...prev[section],
                            [subsection]: e.target.type === 'checkbox' ? checked : 
                                        e.target.type === 'number' ? Number(value) : value
                        }
                    };
                }
            } else {
                // Gestione campi diretti
                return {
                    ...prev,
                    [section]: e.target.type === 'checkbox' ? checked : 
                              e.target.type === 'number' ? Number(value) : value
                };
            }
        });
    };

    const handleSave = async () => {
        // Convertiamo le Map in oggetti per il server
        const configToSend = {
            ...config,
            scoring: {
                ...config.scoring,
                algoritmo: {
                    ...config.scoring.algoritmo,
                    parametri: Object.fromEntries(config.scoring.algoritmo.parametri)
                }
            },
            analytics: {
                ...config.analytics,
                pattern: Object.fromEntries(config.analytics.pattern)
            }
        };
    
        const saved = await updateTestConfiguration(configToSend);
        if (saved) {
            console.log('Configurazione salvata con successo');
        }
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
                {/* Sezione Scoring */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Parametri Test
                    </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Tooltip title="Durata massima del test in minuti">
                        <TextField
                            fullWidth
                            label="Tempo Limite (minuti)"
                            name="scoring.algoritmo.parametri.tempoLimite"
                            type="number"
                            value={config.scoring.algoritmo.parametri.get('tempoLimite')}
                            onChange={handleChange}
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </Tooltip>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Tooltip title="Tempo di attesa tra tentativi in ore">
                        <TextField
                            fullWidth
                            label="Periodo di Attesa (ore)"
                            name="scoring.algoritmo.parametri.cooldownPeriod"
                            type="number"
                            value={config.scoring.algoritmo.parametri.get('cooldownPeriod')}
                            onChange={handleChange}
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </Tooltip>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Tooltip title="Numero massimo di tentativi">
                        <TextField
                            fullWidth
                            label="Tentativi Massimi"
                            name="scoring.algoritmo.parametri.tentativiMax"
                            type="number"
                            value={config.scoring.algoritmo.parametri.get('tentativiMax')}
                            onChange={handleChange}
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </Tooltip>
                </Grid>

{/* Sezione Validazione */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        Validazione Risposte
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Tempo Minimo Risposta (sec)"
                        name="validazione.tempoMinimoDomanda"
                        type="number"
                        value={config.validazione.tempoMinimoDomanda / 1000}
                        onChange={(e) => handleChange({
                            target: {
                                name: 'validazione.tempoMinimoDomanda',
                                value: e.target.value * 1000,
                                type: 'number'
                            }
                        })}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Tooltip title="Tempo massimo per risposta in secondi">
                        <TextField
                            fullWidth
                            label="Tempo Massimo Risposta (secondi)"
                            name="validazione.tempoMassimoDomanda"
                            type="number"
                            value={config.validazione.tempoMassimoDomanda / 1000}
                            onChange={(e) => handleChange({
                                target: {
                                    name: e.target.name,
                                    value: e.target.value * 1000,
                                    type: 'number'
                                }
                            })}
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </Tooltip>
                </Grid>

{/* Sezione Interfaccia */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                        Interfaccia Test
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.interfaccia.randomizzaDomande}
                                onChange={handleChange}
                                name="interfaccia.randomizzaDomande"
                            />
                        }
                        label="Randomizza Ordine Domande"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.interfaccia.mostraProgressBar}
                                onChange={handleChange}
                                name="interfaccia.mostraProgressBar"
                            />
                        }
                        label="Mostra Barra Progresso"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.interfaccia.permettiTornaIndietro}
                                onChange={handleChange}
                                name="interfaccia.permettiTornaIndietro"
                            />
                        }
                        label="Permetti Navigazione Domande"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.interfaccia.mostraRisultatiImmediati}
                                onChange={handleChange}
                                name="interfaccia.mostraRisultatiImmediati"
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
                        name="interfaccia.istruzioni"
                        value={config.interfaccia.istruzioni}
                        onChange={handleChange}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading.saving}
                        sx={{ mt: 2 }}
                    >
                        {loading.saving ? 'Salvataggio...' : 'Salva Configurazione'}
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default CSIConfigurationPanel;