// src/components/classes/ClassTests.js
import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Chip,
    Divider,
} from '@mui/material';
import {
    Quiz as QuizIcon,
    Construction as ConstructionIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const ClassTests = ({ classData }) => {
    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <QuizIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h6">
                            Gestione Test
                        </Typography>
                    </Box>
                    <Chip
                        icon={<ConstructionIcon />}
                        label="IN SVILUPPO"
                        color="warning"
                        variant="outlined"
                    />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    sx={{ 
                        backgroundColor: 'background.default',
                        '& .MuiAlert-message': { 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Funzionalità in fase di sviluppo
                    </Typography>
                    <Typography variant="body2">
                        La gestione dei test è attualmente in fase di sviluppo. 
                        Questa sezione permetterà di:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        <li>Creare e gestire test per la classe</li>
                        <li>Monitorare i progressi degli studenti</li>
                        <li>Analizzare i risultati dei test</li>
                        <li>Generare report dettagliati</li>
                    </Box>
                </Alert>
            </Paper>

            {/* Placeholder per futuri contenuti */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <ConstructionIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary">
                    Contenuti in arrivo
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    Questa sezione conterrà gli strumenti per la gestione dei test della classe.
                    <br />
                    Sarà disponibile nelle prossime versioni dell'applicazione.
                </Typography>
            </Paper>
        </Box>
    );
};

export default ClassTests;