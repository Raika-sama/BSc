import React, { useState } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Paper,
    Alert,
    Tooltip,
    IconButton
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const TabPanel = ({ children, value, index, ...props }) => {
    return (
        <div hidden={value !== index} {...props}>
            {value === index && children}
        </div>
    );
};

const CSIPsychometricAnalysis = () => {
    const [analysisTab, setAnalysisTab] = useState(0);
    const [dateRange, setDateRange] = useState('last30');

    const tabDescriptions = {
        reliability: {
            title: "Affidabilità del Test",
            description: `L'analisi dell'affidabilità valuta la consistenza interna del test. 
                        Include il calcolo dell'Alpha di Cronbach, che dovrebbe essere > 0.7 per una buona affidabilità.`,
            metrics: [
                {
                    name: "Alpha di Cronbach",
                    description: "Misura la consistenza interna del test. Formula: α = (k/(k-1)) * (1 - (Σσᵢ²/σₜ²))"
                },
                {
                    name: "Consistenza Interna",
                    description: "Valuta quanto gli item di una stessa dimensione misurano lo stesso costrutto"
                },
                {
                    name: "Item Problematici",
                    description: "Identifica gli item con bassa correlazione item-totale (< 0.3)"
                }
            ]
        },
        dimensional: {
            title: "Analisi Dimensionale",
            description: `Esamina le caratteristiche statistiche di ogni dimensione del test,
                        fornendo statistiche descrittive e distribuzioni.`,
            metrics: [
                {
                    name: "Statistiche Descrittive",
                    description: "Media, deviazione standard e range per ogni dimensione"
                },
                {
                    name: "Distribuzione Punteggi",
                    description: "Visualizzazione della distribuzione dei punteggi tramite istogrammi"
                },
                {
                    name: "Box Plot",
                    description: "Identificazione di outlier e visualizzazione della distribuzione"
                }
            ]
        },
        patterns: {
            title: "Pattern di Risposta",
            description: `Analizza i pattern nelle risposte degli studenti, inclusi tempi di risposta
                        e possibili comportamenti anomali.`,
            metrics: [
                {
                    name: "Analisi Temporale",
                    description: "Media e distribuzione dei tempi di risposta per item"
                },
                {
                    name: "Pattern Sospetti",
                    description: "Identificazione di risposte troppo veloci o pattern ripetitivi"
                },
                {
                    name: "Distribuzione Risposte",
                    description: "Analisi della distribuzione delle risposte per ogni item"
                }
            ]
        },
        discriminant: {
            title: "Validità Discriminante",
            description: `Valuta quanto le diverse dimensioni del test siano effettivamente distinte
                        tra loro attraverso correlazioni e analisi fattoriale.`,
            metrics: [
                {
                    name: "Correlazioni",
                    description: "Matrice di correlazione tra le diverse dimensioni"
                },
                {
                    name: "Analisi Fattoriale",
                    description: "Esplorazione della struttura fattoriale del test"
                },
                {
                    name: "Discriminazione Item",
                    description: "Capacità di ogni item di discriminare tra livelli diversi di abilità"
                }
            ]
        }
    };

    const renderMetricsDescription = (metrics) => (
        <Box sx={{ mt: 2 }}>
            {metrics.map((metric, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {metric.name}
                        <Tooltip title={metric.description}>
                            <IconButton size="small" sx={{ ml: 1 }}>
                                <HelpOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {metric.description}
                    </Typography>
                </Box>
            ))}
        </Box>
    );

    return (
        <Container maxWidth="xl">
            {/* Filters rimangono invariati */}
            
            <Box sx={{ mb: 3 }}>
                <Tabs value={analysisTab} onChange={(e, newValue) => setAnalysisTab(newValue)}>
                    <Tab label="Affidabilità" />
                    <Tab label="Analisi Dimensionale" />
                    <Tab label="Pattern di Risposta" />
                    <Tab label="Validità Discriminante" />
                </Tabs>
            </Box>

            {/* Tab Panels con Descrizioni */}
            <TabPanel value={analysisTab} index={0}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6">{tabDescriptions.reliability.title}</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {tabDescriptions.reliability.description}
                    </Alert>
                    {renderMetricsDescription(tabDescriptions.reliability.metrics)}
                </Paper>
                {/* Contenuto analisi affidabilità */}
            </TabPanel>

            <TabPanel value={analysisTab} index={1}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6">{tabDescriptions.dimensional.title}</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {tabDescriptions.dimensional.description}
                    </Alert>
                    {renderMetricsDescription(tabDescriptions.dimensional.metrics)}
                </Paper>
                {/* Contenuto analisi dimensionale */}
            </TabPanel>

            <TabPanel value={analysisTab} index={2}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6">{tabDescriptions.patterns.title}</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {tabDescriptions.patterns.description}
                    </Alert>
                    {renderMetricsDescription(tabDescriptions.patterns.metrics)}
                </Paper>
                {/* Contenuto pattern di risposta */}
            </TabPanel>

            <TabPanel value={analysisTab} index={3}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6">{tabDescriptions.discriminant.title}</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {tabDescriptions.discriminant.description}
                    </Alert>
                    {renderMetricsDescription(tabDescriptions.discriminant.metrics)}
                </Paper>
                {/* Contenuto validità discriminante */}
            </TabPanel>
        </Container>
    );
};

export default CSIPsychometricAnalysis;