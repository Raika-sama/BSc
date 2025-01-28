import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const CognitiveGauge = ({ 
    value = 50,
    leftLabel = '', 
    rightLabel = '', 
    color = '#2196f3',
    description = ''
}) => {
    // Normalizza il valore tra 0 e 100
    const normalizedValue = Math.min(Math.max(value, 0), 100);
    
    // Calcola l'angolo per l'indicatore (da -90 a 90 gradi)
    const angle = ((normalizedValue - 50) * 1.8); // Converte il valore in gradi

    // Dati per la tabella
    const tableData = {
        valore: normalizedValue,
        minimo: 0,
        massimo: 100,
        deviazione: normalizedValue - 50
    };

    // Stili per il semicerchio e l'indicatore
    const gaugeStyles = {
        position: 'relative',
        width: '200px',
        height: '100px',
        margin: '20px auto',
        background: '#f5f5f5',
        borderTopLeftRadius: '100px',
        borderTopRightRadius: '100px',
        overflow: 'hidden',
        '&::before': {
            content: '""',
            display: 'block',
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`,
            opacity: 0.1
        }
    };

    const indicatorStyles = {
        position: 'absolute',
        bottom: '0',
        left: '50%',
        width: '2px',
        height: '90%',
        backgroundColor: color,
        transformOrigin: 'bottom center',
        transform: `rotate(${angle}deg)`,
        transition: 'transform 0.3s ease-out',
        '&::after': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '-4px',
            width: '10px',
            height: '10px',
            backgroundColor: color,
            borderRadius: '50%'
        }
    };

    const markersContainerStyles = {
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        height: '100%',
    };

    // Genera i marker per le divisioni del semicerchio
    const generateMarkers = () => {
        const markers = [];
        for (let i = -90; i <= 90; i += 30) {
            markers.push(
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        width: '1px',
                        height: '10px',
                        backgroundColor: '#999',
                        transformOrigin: 'bottom center',
                        transform: `rotate(${i}deg)`
                    }}
                />
            );
        }
        return markers;
    };

    return (
        <Box>
            {/* Tabella dei dati */}
            <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Descrittore</TableCell>
                            <TableCell align="right">Valore</TableCell>
                            <TableCell align="right">Min</TableCell>
                            <TableCell align="right">Max</TableCell>
                            <TableCell align="right">Deviazione</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                {`${leftLabel} - ${rightLabel}`}
                            </TableCell>
                            <TableCell align="right">{tableData.valore}%</TableCell>
                            <TableCell align="right">{tableData.minimo}%</TableCell>
                            <TableCell align="right">{tableData.massimo}%</TableCell>
                            <TableCell align="right">
                                {tableData.deviazione > 0 ? `+${tableData.deviazione}` : tableData.deviazione}%
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Gauge semicircolare */}
            <Box sx={{ position: 'relative', width: '200px', margin: 'auto' }}>
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                    {description}
                </Typography>
                
                <Box sx={gaugeStyles}>
                    <Box sx={markersContainerStyles}>
                        {generateMarkers()}
                    </Box>
                    <Box sx={indicatorStyles} />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">{leftLabel}</Typography>
                    <Typography variant="caption" color="text.secondary">{rightLabel}</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default CognitiveGauge;