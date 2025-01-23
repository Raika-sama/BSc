import React from 'react';
import {
    Paper,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Stack,
    Divider,
    Typography
} from '@mui/material';
import {
    FilterAlt as FilterIcon,
    Clear as ClearIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';

const SchoolFilters = ({ filters, onChange, onReset }) => {
    const handleChange = (event) => {
        const { name, value } = event.target;
        onChange({
            ...filters,
            [name]: value
        });
    };

    const handleReset = () => {
        onReset();
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon color="primary" />
                <Typography variant="h6">Filtri</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 220 }}>
                    <SchoolIcon color="action" />
                    <FormControl fullWidth size="small">
                        <InputLabel>Tipo Scuola</InputLabel>
                        <Select
                            name="schoolType"
                            value={filters.schoolType}
                            onChange={handleChange}
                            label="Tipo Scuola"
                        >
                            <MenuItem value="">Tutti</MenuItem>
                            <MenuItem value="middle_school">Scuola Media</MenuItem>
                            <MenuItem value="high_school">Scuola Superiore</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 220 }}>
                    <SchoolIcon color="action" />
                    <FormControl fullWidth size="small">
                        <InputLabel>Tipo Istituto</InputLabel>
                        <Select
                            name="institutionType"
                            value={filters.institutionType}
                            onChange={handleChange}
                            label="Tipo Istituto"
                        >
                            <MenuItem value="">Tutti</MenuItem>
                            <MenuItem value="scientific">Scientifico</MenuItem>
                            <MenuItem value="classical">Classico</MenuItem>
                            <MenuItem value="artistic">Artistico</MenuItem>
                            <MenuItem value="none">Nessuno</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 220 }}>
                    <LocationIcon color="action" />
                    <TextField
                        fullWidth
                        size="small"
                        label="Regione"
                        name="region"
                        value={filters.region}
                        onChange={handleChange}
                        placeholder="Es: Lombardia"
                    />
                </Box>

                <Stack 
                    direction="row" 
                    spacing={1} 
                    sx={{ 
                        ml: { md: 'auto' }, 
                        mt: { xs: 2, md: 0 },
                        minWidth: { xs: '100%', md: 'auto' }
                    }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={handleReset}
                        fullWidth
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<FilterIcon />}
                        onClick={() => onChange({ ...filters })}
                        fullWidth
                    >
                        Applica
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
};

export default SchoolFilters;