// src/components/students/TestDetailsView.js
import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    LinearProgress,
    Chip,
    Card,
    CardContent
} from '@mui/material';

const DimensionBar = ({ dimension, score }) => {
    // Calcola il punto medio per il posizionamento dell'indicatore
    const position = score; // score dovrebbe essere già tra 0-100

    // Determina il colore in base al punteggio
    const getColor = (score) => {
        if (score < 33) return '#2196f3'; // blu per il primo terzo
        if (score < 66) return '#4caf50'; // verde per il secondo terzo
        return '#ff9800'; // arancione per l'ultimo terzo
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
                {dimension}
            </Typography>
            <Box sx={{ position: 'relative', height: 40, width: '100%' }}>
                {/* Barra di sfondo */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 4,
                        top: '50%',
                        transform: 'translateY(-50%)'
                    }}
                />
                {/* Indicatore di posizione */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: `${position}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 16,
                        height: 16,
                        bgcolor: getColor(score),
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: 2
                    }}
                />
                {/* Etichette */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        top: 0
                    }}
                >
                    <Typography variant="caption">0</Typography>
                    <Typography variant="caption">100</Typography>
                </Box>
            </Box>
        </Box>
    );
};

const TestDetailsView = ({ test, formatDate }) => {
    if (!test) {
        return (
            <Paper sx={{ height: 'calc(100vh - 250px)', overflow: 'auto', p: 2 }}>
                <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    height="100%"
                >
                    <Typography color="text.secondary">
                        Seleziona un test per visualizzarne i dettagli
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ height: 'calc(100vh - 250px)', overflow: 'auto', p: 3 }}>
            {/* Header */}
            <Box mb={3}>
                <Typography variant="h5" gutterBottom>
                    Risultati Test {test.tipo}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Completato il {formatDate(test.dataCompletamento)}
                </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Punteggi */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Profilo Cognitivo
                    </Typography>
                    
                    {test.punteggi && Object.entries(test.punteggi).map(([dimensione, punteggio]) => (
                        <DimensionBar 
                            key={dimensione}
                            dimension={dimensione.charAt(0).toUpperCase() + dimensione.slice(1)}
                            score={punteggio}
                        />
                    ))}
                </Grid>

                {/* Interpretazione */}
                <Grid item xs={12}>
                    <Card sx={{ mt: 2, bgcolor: 'primary.light' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary.contrastText">
                                Interpretazione
                            </Typography>
                            <Typography variant="body2" color="primary.contrastText">
                                {test.interpretazione || 
                                 "L'interpretazione dettagliata del test sarà disponibile a breve."}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Statistiche aggiuntive */}
                <Grid item xs={12}>
                    <Box mt={3}>
                        <Typography variant="subtitle1" gutterBottom>
                            Statistiche del Test
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="caption" color="text.secondary">
                                            Tempo Totale
                                        </Typography>
                                        <Typography variant="h6">
                                            {test.analytics?.tempoTotale 
                                             ? `${Math.round(test.analytics.tempoTotale / 60)} min` 
                                             : 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="caption" color="text.secondary">
                                            Domande Completate
                                        </Typography>
                                        <Typography variant="h6">
                                            {test.risposte?.length || 0}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default TestDetailsView;