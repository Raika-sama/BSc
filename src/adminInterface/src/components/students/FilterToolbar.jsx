import React, { useEffect, useState, useCallback } from 'react'; // Aggiungiamo useCallback
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
    }, [fetchSchools]); // Aggiungiamo la dipendenza

    // Ottimizziamo la generazione delle classi disponibili
    const generateAvailableClasses = useCallback((selectedSchool) => {
        if (!selectedSchool) return [];
        
        const classes = [];
        for (let year = 1; year <= selectedSchool.numberOfYears; year++) {
            selectedSchool.sections.forEach(section => {
                classes.push({
                    value: `${year}${section.name}`,
                    year,
                    section: section.name
                });
            });
        }
        return classes.sort((a, b) => 
            a.year === b.year ? 
                a.section.localeCompare(b.section) : 
                a.year - b.year
        );
    }, []);

    // Aggiorna le classi disponibili quando viene selezionata una scuola
    useEffect(() => {
        if (schoolFilter) {
            const selectedSchool = schools.find(s => s._id === schoolFilter);
            if (selectedSchool) {
                const classes = generateAvailableClasses(selectedSchool);
                setAvailableClasses(classes);
            }
        } else {
            setAvailableClasses([]);
            setClassFilter('');
        }
    }, [schoolFilter, schools, generateAvailableClasses, setClassFilter]);

    // Ottimizziamo la gestione del search con Enter
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    }, [handleSearch]);

    const statusOptions = [
        { value: '', label: 'Tutti gli stati' },
        { value: 'active', label: 'Attivi' },
        { value: 'pending', label: 'In Attesa' },
        { value: 'inactive', label: 'Inattivi' },
        { value: 'transferred', label: 'Trasferiti' },
        { value: 'graduated', label: 'Diplomati' }
    ];

    // Gestiamo il cambio della scuola
    const handleSchoolChange = (event) => {
        const newSchoolId = event.target.value;
        setSchoolFilter(newSchoolId);
        setClassFilter(''); // Reset del filtro classe quando cambia la scuola
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
                    onKeyPress={handleKeyPress}
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
                    onChange={handleSchoolChange}
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
                    {availableClasses.map(({ value, year, section }) => (
                        <MenuItem key={value} value={value}>
                            {value}
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