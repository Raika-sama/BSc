import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNotification } from '../../context/NotificationContext';
import SchoolList from './SchoolList';
import { useSchool } from '../../context/SchoolContext';
import { SchoolWizard } from './wizard/SchoolWizard';

const ITEMS_PER_PAGE = 10;

const SchoolManagement = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        region: '',
        schoolType: '',
        institutionType: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { showNotification } = useNotification();
    const { 
        schools, 
        loading, 
        error,
        totalSchools,
        fetchSchools, 
        deleteSchool,
        getSchoolsByRegion,
        getSchoolsByType
    } = useSchool();

    useEffect(() => {
        loadSchools();
    }, [page, filters]);

    const loadSchools = async () => {
        try {
            await fetchSchools(page, ITEMS_PER_PAGE, filters);
        } catch (error) {
            console.error('Error loading schools:', error);
        }
    };

    const handleDeleteSchool = async (schoolId) => {
        try {
            await deleteSchool(schoolId);
            loadSchools();
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'eliminazione della scuola';
            showNotification(errorMessage, 'error');
        }
    };

    const handleEditClick = (school) => {
        navigate(`/admin/schools/${school._id}/edit`);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1);
    };

    return (
        <Container maxWidth="lg">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Gestione Scuole
                </Typography>
                <Box>
                    <Tooltip title="Filtri">
                        <IconButton onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/schools/create')}
                    >
                        Nuova Scuola
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {isFilterOpen && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" gap={2}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Tipo Scuola</InputLabel>
                            <Select
                                name="schoolType"
                                value={filters.schoolType}
                                onChange={handleFilterChange}
                                label="Tipo Scuola"
                            >
                                <MenuItem value="">Tutti</MenuItem>
                                <MenuItem value="middle_school">Scuola Media</MenuItem>
                                <MenuItem value="high_school">Scuola Superiore</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Tipo Istituto</InputLabel>
                            <Select
                                name="institutionType"
                                value={filters.institutionType}
                                onChange={handleFilterChange}
                                label="Tipo Istituto"
                            >
                                <MenuItem value="">Tutti</MenuItem>
                                <MenuItem value="scientific">Scientifico</MenuItem>
                                <MenuItem value="classical">Classico</MenuItem>
                                <MenuItem value="artistic">Artistico</MenuItem>
                                <MenuItem value="none">Nessuno</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Regione"
                            name="region"
                            value={filters.region}
                            onChange={handleFilterChange}
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                </Paper>
            )}

            <SchoolList
                schools={schools}
                loading={loading}
                onEdit={handleEditClick}
                onDelete={handleDeleteSchool}
            />

            {!loading && totalSchools > ITEMS_PER_PAGE && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                        count={Math.ceil(totalSchools / ITEMS_PER_PAGE)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Container>
    );
};

export default SchoolManagement;