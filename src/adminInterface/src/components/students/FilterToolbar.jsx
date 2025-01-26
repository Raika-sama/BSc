import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Box, 
    TextField, 
    MenuItem, 
    Button,
    InputAdornment,
    Divider
} from '@mui/material';
import {
    FilterList as FilterListIcon,
    RestartAlt as ResetIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { useSchool } from '../../context/SchoolContext';

export const FilterToolbar = ({
    searchTerm,
    setSearchTerm,
    schoolFilter,
    setSchoolFilter,
    classFilter,
    setClassFilter,
    statusFilter,
    setStatusFilter,
    specialNeedsFilter,
    setSpecialNeedsFilter,
    handleSearch,
    handleResetFilters
}) => {
    const { schools, fetchSchools } = useSchool();
    const [availableClasses, setAvailableClasses] = useState([]);

    // Carica le scuole quando il componente viene montato
    useEffect(() => {
        fetchSchools();
    }, []);

    // Aggiorna le classi disponibili quando viene selezionata una scuola
    useEffect(() => {
        if (schoolFilter) {
            const selectedSchool = schools.find(s => s._id === schoolFilter);
            if (selectedSchool) {
                // Genera le classi basate sui dati della scuola
                const classes = [];
                for (let year = 1; year <= selectedSchool.numberOfYears; year++) {
                    selectedSchool.sections.forEach(section => {
                        classes.push(`${year}${section.name}`);
                    });
                }
                setAvailableClasses(classes);
            }
        } else {
            setAvailableClasses([]);
            setClassFilter('');
        }
    }, [schoolFilter, schools]);

    const statusOptions = [
        { value: '', label: 'Tutti gli stati' },
        { value: 'active', label: 'Attivi' },
        { value: 'pending', label: 'In Attesa' },
        { value: 'inactive', label: 'Inattivi' },
        { value: 'transferred', label: 'Trasferiti' },
        { value: 'graduated', label: 'Diplomati' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Box sx={{
                p: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <TextField
                    placeholder="Cerca studenti..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    sx={{ 
                        minWidth: 250,
                        '& .MuiInputBase-root': { height: '40px' }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Divider orientation="vertical" flexItem />
                <TextField
                    select
                    label="Scuola"
                    size="small"
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    sx={{ 
                        minWidth: 200,
                        '& .MuiInputBase-root': { height: '40px' }
                    }}
                >
                    <MenuItem value="">Tutte le scuole</MenuItem>
                    {schools.map(school => (
                        <MenuItem key={school._id} value={school._id}>
                            {school.name}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Classe"
                    size="small"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    disabled={!schoolFilter}
                    sx={{ 
                        width: 120,
                        '& .MuiInputBase-root': { height: '40px' }
                    }}
                >
                    <MenuItem value="">Tutte</MenuItem>
                    {availableClasses.map(className => (
                        <MenuItem key={className} value={className}>
                            {className}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Stato"
                    size="small"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ 
                        width: 150,
                        '& .MuiInputBase-root': { height: '40px' }
                    }}
                >
                    {statusOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Necessità Speciali"
                    size="small"
                    value={specialNeedsFilter}
                    onChange={(e) => setSpecialNeedsFilter(e.target.value)}
                    sx={{ 
                        width: 180,
                        '& .MuiInputBase-root': { height: '40px' }
                    }}
                >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="true">Con necessità</MenuItem>
                    <MenuItem value="false">Senza necessità</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleResetFilters}
                        startIcon={<ResetIcon />}
                        sx={{ height: '40px' }}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSearch}
                        startIcon={<FilterListIcon />}
                        sx={{ height: '40px' }}
                    >
                        Applica Filtri
                    </Button>
                </Box>
            </Box>
        </motion.div>
    );
};