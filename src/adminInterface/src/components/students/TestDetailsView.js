// src/components/students/TestDetailsView.js
import React from 'react';
import {
    Box,
    Typography,
    Paper
} from '@mui/material';

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
        <Paper sx={{ height: 'calc(100vh - 250px)', overflow: 'auto', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Test {test.tipo} del {formatDate(test.dataCompletamento)}
            </Typography>
            
            {/* Per ora mostriamo solo i punteggi grezzi */}
            {test.punteggi && (
                <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                        Punteggi
                    </Typography>
                    {Object.entries(test.punteggi).map(([dimensione, punteggio]) => (
                        <Box key={dimensione} mb={1}>
                            <Typography variant="body2">
                                {dimensione.charAt(0).toUpperCase() + dimensione.slice(1)}: {punteggio}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
            
            {/* In futuro qui andrà la visualizzazione grafica dei risultati */}
        </Paper>
    );
};

export default TestDetailsView;