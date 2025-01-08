// src/components/school/SchoolManagement.js
import React, { useState, useEffect } from 'react';
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
import SchoolForm from './SchoolForm';
import { useSchool } from '../../context/SchoolContext';

const ITEMS_PER_PAGE = 10;

const SchoolManagement = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
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
        createSchool, 
        updateSchool, 
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

    const handleSaveSchool = async (schoolData, isEdit = false) => {
        try {
            if (isEdit) {
                await updateSchool(selectedSchool._id, schoolData);
            } else {
                await createSchool(schoolData);
            }
            setIsFormOpen(false);
            setSelectedSchool(null);
            loadSchools(); // Ricarica la lista dopo il salvataggio
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nel salvataggio della scuola';
            showNotification(errorMessage, 'error');
            console.error('Error saving school:', error);
        }
    };

    const handleDeleteSchool = async (schoolId) => {
        try {
            await deleteSchool(schoolId);
            loadSchools(); // Ricarica la lista dopo l'eliminazione
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore nell\'eliminazione della scuola';
            showNotification(errorMessage, 'error');
            console.error('Error deleting school:', error);
        }
    };

    const handleEditClick = (school) => {
        setSelectedSchool(school);
        setIsFormOpen(true);
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
        setPage(1); // Reset alla prima pagina quando cambiano i filtri
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
                        onClick={() => {
                            setSelectedSchool(null);
                            setIsFormOpen(true);
                        }}
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

                <SchoolForm
                    open={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleSaveSchool}
                    school={null} // Passa null quando è una nuova scuola
                />
        </Container>
    );
};

export default SchoolManagement;