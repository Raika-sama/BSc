// src/components/classes/details/detailscomponents/ClassTestAggregateView.js
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    Chip,
    Tab,
    Tabs,
    alpha,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Stack
} from '@mui/material';
import {
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    Insights as InsightsIcon,
    Info as InfoIcon,
    Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Import visualization libraries if not already in package.json
// You may need to run: npm install recharts

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Map dimensions to names and colors (same as in TestResultsView)
const DIMENSIONS_MAPPING = {
    'elaborazione': {
        name: 'Elaborazione',
        leftExtreme: 'Analitico',
        rightExtreme: 'Globale',
        description: 'Modalità di elaborazione delle informazioni',
        color: '#2196f3'
    },
    'creativita': {
        name: 'Creatività',
        leftExtreme: 'Sistematico',
        rightExtreme: 'Intuitivo',
        description: 'Approccio alla risoluzione dei problemi',
        color: '#4caf50'
    },
    'preferenzaVisiva': {
        name: 'Preferenza Visiva',
        leftExtreme: 'Verbale',
        rightExtreme: 'Visivo',
        description: 'Preferenza nella modalità di apprendimento',
        color: '#ff9800'
    },
    'decisione': {
        name: 'Decisione',
        leftExtreme: 'Impulsivo',
        rightExtreme: 'Riflessivo',
        description: 'Stile decisionale',
        color: '#9c27b0'
    },
    'autonomia': {
        name: 'Autonomia',
        leftExtreme: 'Dipendente',
        rightExtreme: 'Indipendente',
        description: 'Autonomia nell\'apprendimento',
        color: '#f44336'
    }
};

// Tab Panel component
const TabPanel = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`aggregate-tabpanel-${index}`}
            aria-labelledby={`aggregate-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

/**
 * Component to display aggregated CSI test results for a class
 */
const ClassTestAggregateView = ({ data, classData }) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [selectedDimension, setSelectedDimension] = useState('elaborazione');

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle dimension selection change
    const handleDimensionChange = (event) => {
        setSelectedDimension(event.target.value);
    };

    // Extract distribution data for charts
    const distributionData = useMemo(() => {
        if (!data || !data.dimensionDistribution) return [];

        return Object.entries(data.dimensionDistribution).map(([dimension, distribution]) => {
            const dimensionInfo = DIMENSIONS_MAPPING[dimension];
            const levels = Object.entries(distribution).map(([level, count]) => ({
                name: level.charAt(0).toUpperCase() + level.slice(1),
                value: count,
                color: getColorForLevel(level, dimensionInfo.color)
            }));

            return {
                dimension,
                levels
            };
        });
    }, [data]);

    // Generate radar chart data
    const radarData = useMemo(() => {
        if (!data || !data.averageScores) return [];
        
        return Object.entries(data.averageScores).map(([dimension, score]) => ({
            dimension: DIMENSIONS_MAPPING[dimension]?.name || dimension,
            value: score,
            fullMark: 100
        }));
    }, [data]);

    // Get data for the selected dimension
    const selectedDistribution = useMemo(() => {
        if (!distributionData) return null;
        return distributionData.find(item => item.dimension === selectedDimension);
    }, [distributionData, selectedDimension]);

    // Dominant styles distribution
    const dominantStylesData = useMemo(() => {
        if (!data || !data.dominantStylesDistribution) return [];
        
        return Object.entries(data.dominantStylesDistribution).map(([style, count]) => {
            const dimensionInfo = DIMENSIONS_MAPPING[style];
            return {
                name: dimensionInfo?.name || style,
                value: count,
                color: dimensionInfo?.color || '#757575'
            };
        });
    }, [data]);
    
    // Helper function to get color for levels
    function getColorForLevel(level, baseColor) {
        switch(level.toLowerCase()) {
            case 'basso':
                return alpha(baseColor, 0.3);
            case 'medio':
                return alpha(baseColor, 0.6);
            case 'alto':
                return alpha(baseColor, 0.9);
            default:
                return alpha(baseColor, 0.5);
        }
    }

    // If no data provided
    if (!data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Paper
                elevation={0}
                sx={{ 
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PsychologyIcon color="primary" />
                    <Typography variant="h6">
                        Analisi Aggregata Test CSI - Classe {classData?.year}{classData?.section}
                    </Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2,
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Test Completati
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                {data.totalCompletedTests || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                su {data.totalStudents || 0} studenti
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2,
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Completamento
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {data.totalStudents ? 
                                    Math.round((data.totalCompletedTests / data.totalStudents) * 100) : 0}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                percentuale completamento
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2,
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Stile Dominante
                            </Typography>
                            <Typography variant="h6" color="warning.main">
                                {data.mostCommonStyle ? 
                                    DIMENSIONS_MAPPING[data.mostCommonStyle]?.name || data.mostCommonStyle : 
                                    'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                più diffuso nella classe
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2,
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Variabilità
                            </Typography>
                            <Typography variant="h4" color="info.main">
                                {data.diversityIndex ? Math.round(data.diversityIndex * 10) / 10 : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                indice di diversità cognitiva
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabs for different views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    aria-label="analisi aggregate tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<BarChartIcon />} label="Distribuzioni" iconPosition="start" />
                    <Tab icon={<PieChartIcon />} label="Stili Dominanti" iconPosition="start" />
                    <Tab icon={<InsightsIcon />} label="Profilo di Classe" iconPosition="start" />
                </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={activeTab} index={0}>
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Distribuzione per Dimensione</Typography>
                        <FormControl size="small" sx={{ width: 200 }}>
                            <InputLabel id="dimension-select-label">Dimensione</InputLabel>
                            <Select
                                labelId="dimension-select-label"
                                value={selectedDimension}
                                label="Dimensione"
                                onChange={handleDimensionChange}
                            >
                                {Object.entries(DIMENSIONS_MAPPING).map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        {value.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {selectedDistribution && selectedDistribution.levels.length > 0 && (
                        <Box sx={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={selectedDistribution.levels}
                                    margin={{
                                        top: 20, right: 30, left: 20, bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip formatter={(value) => [`${value} studenti`, 'Conteggio']} />
                                    <Legend />
                                    <Bar 
                                        dataKey="value" 
                                        name={DIMENSIONS_MAPPING[selectedDimension]?.name || selectedDimension}
                                    >
                                        {selectedDistribution.levels.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    )}

                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="subtitle1">Caratteristiche della distribuzione</Typography>
                        
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575', 0.05),
                                border: '1px solid',
                                borderColor: alpha(DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575', 0.1)
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2">
                                        <strong>Media:</strong> {data.averageScores && data.averageScores[selectedDimension] ? 
                                            Math.round(data.averageScores[selectedDimension] * 10) / 10 : 'N/A'}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Deviazione Standard:</strong> {data.standardDeviations && data.standardDeviations[selectedDimension] ? 
                                            Math.round(data.standardDeviations[selectedDimension] * 10) / 10 : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2">
                                        <strong>Classe:</strong> {classData?.year}{classData?.section}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Studenti Totali:</strong> {data.totalStudents || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">
                                        <strong>Descrizione:</strong> {DIMENSIONS_MAPPING[selectedDimension]?.description || 'N/A'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Chip 
                                            label={DIMENSIONS_MAPPING[selectedDimension]?.leftExtreme || 'Sinistra'} 
                                            size="small"
                                            variant="outlined"
                                            sx={{ 
                                                bgcolor: alpha(DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575', 0.1),
                                                borderColor: DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575'
                                            }}
                                        />
                                        <Box sx={{ flex: 1, height: 3, bgcolor: alpha(DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575', 0.2) }} />
                                        <Chip 
                                            label={DIMENSIONS_MAPPING[selectedDimension]?.rightExtreme || 'Destra'} 
                                            size="small"
                                            variant="outlined"
                                            sx={{ 
                                                bgcolor: alpha(DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575', 0.1),
                                                borderColor: DIMENSIONS_MAPPING[selectedDimension]?.color || '#757575'
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <Box>
                    <Typography variant="h6" gutterBottom>Distribuzione degli Stili Dominanti</Typography>
                    
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dominantStylesData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {dominantStylesData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => [`${value} studenti`, 'Conteggio']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Stili Dominanti nella Classe
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Questo grafico mostra la distribuzione degli stili cognitivi dominanti tra gli studenti della classe.
                                Uno stile dominante viene determinato quando un punteggio è significativamente alto in una dimensione.
                            </Typography>

                            <Stack spacing={1} sx={{ mt: 3 }}>
                                {dominantStylesData.map((style, index) => (
                                    <Box 
                                        key={index} 
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1,
                                            p: 1,
                                            borderRadius: 1,
                                            bgcolor: alpha(style.color, 0.1)
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                width: 12, 
                                                height: 12, 
                                                borderRadius: '50%', 
                                                bgcolor: style.color 
                                            }} 
                                        />
                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                            {style.name}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {style.value} {style.value === 1 ? 'studente' : 'studenti'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <Box>
                    <Typography variant="h6" gutterBottom>Profilo Cognitivo di Classe</Typography>
                    
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="dimension" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar
                                            name="Punteggio medio"
                                            dataKey="value"
                                            stroke={theme.palette.primary.main}
                                            fill={alpha(theme.palette.primary.main, 0.2)}
                                            fillOpacity={0.6}
                                        />
                                        <RechartsTooltip />
                                        <Legend />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Punteggi medi della classe per dimensione
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Questo grafico radar mostra i punteggi medi della classe per ciascuna dimensione cognitiva.
                                I valori più alti indicano una maggiore tendenza verso l'estremo destro di quella dimensione.
                            </Typography>

                            <Alert 
                                severity="info" 
                                icon={<InfoIcon />}
                                sx={{ 
                                    mt: 2,
                                    '& .MuiAlert-message': { width: '100%' }
                                }}
                            >
                                <Typography variant="subtitle2" gutterBottom>
                                    Interpretazione del profilo di classe
                                </Typography>
                                <Typography variant="body2">
                                    {data.classInterpretation || 
                                    'Il profilo cognitivo di questa classe mostra una distribuzione di stili cognitivi che ' +
                                    'riflette diverse modalità di apprendimento. L\'analisi dettagliata aiuta a personalizzare ' +
                                    'le strategie didattiche per ottimizzare l\'esperienza di apprendimento.'}
                                </Typography>
                            </Alert>

                            {data.recommendations && data.recommendations.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Raccomandazioni didattiche
                                    </Typography>
                                    <Stack spacing={1}>
                                        {data.recommendations.map((rec, index) => (
                                            <Box 
                                                key={index} 
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'flex-start', 
                                                    gap: 1 
                                                }}
                                            >
                                                <Box 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: 'primary.main',
                                                        mt: 1
                                                    }} 
                                                />
                                                <Typography variant="body2">
                                                    {rec}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </TabPanel>
        </Box>
    );
};

export default ClassTestAggregateView;