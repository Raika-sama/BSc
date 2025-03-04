// src/components/users/list/UsersFilters.jsx
import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    InputAdornment,
    Button,
    Chip
} from '@mui/material';
import { 
    Search as SearchIcon,
    FilterAlt as FilterIcon,
    Close as CloseIcon 
} from '@mui/icons-material';

const UsersFilters = ({ filters, onFiltersChange }) => {
    // Verifica se ci sono filtri attivi
    const hasActiveFilters = filters.role || filters.status;

    // Gestisci i cambiamenti nei filtri
    const handleChange = (field) => (event) => {
        onFiltersChange({
            ...filters,
            [field]: event.target.value
        });
    };

    // Resetta tutti i filtri
    const handleResetFilters = () => {
        onFiltersChange({
            ...filters,
            role: '',
            status: ''
        });
    };

    return (
        <Box sx={{ 
            mb: 3,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'flex-start'
        }}>
            <TextField
                select
                size="small"
                label="Ruolo"
                value={filters.role || ''}
                onChange={handleChange('role')}
                sx={{ minWidth: 150 }}
            >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teacher">Docente</MenuItem>
                <MenuItem value="school_admin">Admin Scuola</MenuItem>
            </TextField>

            <TextField
                select
                size="small"
                label="Stato"
                value={filters.status || ''}
                onChange={handleChange('status')}
                sx={{ minWidth: 150 }}
            >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="active">Attivo</MenuItem>
                <MenuItem value="inactive">Inattivo</MenuItem>
                <MenuItem value="suspended">Sospeso</MenuItem>
            </TextField>

            {hasActiveFilters && (
                <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={handleResetFilters}
                    sx={{ height: 40 }}
                >
                    Azzera filtri
                </Button>
            )}

            {hasActiveFilters && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {filters.role && (
                        <Chip 
                            label={`Ruolo: ${filters.role === 'admin' ? 'Admin' : 
                                        filters.role === 'teacher' ? 'Docente' : 
                                        filters.role === 'school_admin' ? 'Admin Scuola' : 
                                        filters.role}`}
                            onDelete={() => onFiltersChange({ ...filters, role: '' })}
                            color="primary"
                            size="small"
                        />
                    )}
                    {filters.status && (
                        <Chip 
                            label={`Stato: ${filters.status === 'active' ? 'Attivo' : 
                                        filters.status === 'inactive' ? 'Inattivo' : 
                                        filters.status === 'suspended' ? 'Sospeso' : 
                                        filters.status}`}
                            onDelete={() => onFiltersChange({ ...filters, status: '' })}
                            color="primary"
                            size="small"
                        />
                    )}
                </Box>
            )}
        </Box>
    );
};

export default UsersFilters;