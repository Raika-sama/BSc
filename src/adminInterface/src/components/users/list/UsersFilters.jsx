// src/components/users/list/UsersFilters.jsx
import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const UsersFilters = ({ filters, onFiltersChange }) => {
    const handleChange = (field) => (event) => {
        onFiltersChange({
            ...filters,
            [field]: event.target.value
        });
    };

    return (
        <Box sx={{ 
            mb: 3,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap'
        }}>
            <TextField
                size="small"
                placeholder="Cerca utenti..."
                value={filters.search}
                onChange={handleChange('search')}
                sx={{ minWidth: 200 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    )
                }}
            />

            <TextField
                select
                size="small"
                label="Ruolo"
                value={filters.role}
                onChange={handleChange('role')}
                sx={{ minWidth: 150 }}
            >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="teacher">Insegnante</MenuItem>
            </TextField>

            <TextField
                select
                size="small"
                label="Stato"
                value={filters.status}
                onChange={handleChange('status')}
                sx={{ minWidth: 150 }}
            >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="active">Attivo</MenuItem>
                <MenuItem value="inactive">Inattivo</MenuItem>
                <MenuItem value="suspended">Sospeso</MenuItem>
            </TextField>
        </Box>
    );
};

export default UsersFilters;