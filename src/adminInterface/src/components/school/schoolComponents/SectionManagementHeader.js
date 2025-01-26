// SectionManagementHeader.js
import React from 'react';
import { Box, Typography, FormControlLabel, Switch } from '@mui/material';

const SectionManagementHeader = ({ showInactive, onToggleInactive }) => (
    <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2 
    }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            Gestione Sezioni
        </Typography>
        <FormControlLabel
            control={
                <Switch
                    size="small"
                    checked={showInactive}
                    onChange={onToggleInactive}
                />
            }
            label={
                <Typography variant="body2">
                    {showInactive ? "Mostra tutte le sezioni" : "Solo sezioni attive"}
                </Typography>
            }
        />
    </Box>
);

export default SectionManagementHeader;