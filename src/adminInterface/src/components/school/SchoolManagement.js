import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    FilterList as FilterListIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Class as ClassIcon
} from '@mui/icons-material';
import { useNotification } from '../../context/NotificationContext';
import { useSchool } from '../../context/SchoolContext';
import SchoolList from './SchoolList';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import SchoolFilters from './schoolComponents/SchoolFilters';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend
);

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
        deleteSchool
    } = useSchool();

    useEffect(() => {
        loadSchools();
    }, [page, filters]);

    const loadSchools = async () => {
        try {
            await fetchSchools(page, ITEMS_PER_PAGE, filters);
        } catch (error) {
            console.error('Error loading schools:', error);
            showNotification('Errore nel caricamento delle scuole', 'error');
        }
    };

    const handleDeleteSchool = async (schoolId) => {
        try {
            await deleteSchool(schoolId);
            loadSchools();
            showNotification('Scuola eliminata con successo', 'success');
        } catch (error) {
            showNotification(error.response?.data?.error?.message || 'Errore nell\'eliminazione della scuola', 'error');
        }
    };

    const handleEditClick = (school) => {
        navigate(`/admin/schools/${school._id}/edit`);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const statsCards = [
        { 
            title: 'Scuole Totali', 
            value: totalSchools || 0,
            icon: <SchoolIcon fontSize="large" />,
            color: 'primary.main' 
        },
        { 
            title: 'Scuole Medie', 
            value: schools?.filter(s => s?.schoolType === 'middle_school')?.length || 0,
            icon: <ClassIcon fontSize="large" />,
            color: 'secondary.main' 
        },
        { 
            title: 'Scuole Superiori', 
            value: schools?.filter(s => s?.schoolType === 'high_school')?.length || 0,
            icon: <SchoolIcon fontSize="large" />,
            color: 'success.main' 
        },
        { 
            title: 'Regioni', 
            value: [...new Set(schools?.map(s => s?.region))].length || 0,
            icon: <LocationIcon fontSize="large" />,
            color: 'info.main' 
        }
    ];

    // Dati per il grafico di distribuzione delle scuole per regione
    const chartData = {
        labels: [...new Set(schools?.map(s => s?.region))],
        datasets: [
            {
                label: 'Scuole per Regione',
                data: [...new Set(schools?.map(s => s?.region))].map(region =>
                    schools?.filter(s => s?.region === region)?.length || 0
                ),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestione Scuole
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Filtri">
                        <IconButton onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/schools/create')}
                    >
                        Nuova Scuola
                    </Button>
                </Box>
            </Box>

            {/* Layout superiore con stats e grafico */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Colonna sinistra con stats cards */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={2}>
                        {statsCards.map((card, index) => (
                            <Grid item xs={6} md={12} key={index}>
                                <Card>
                                    <CardContent sx={{ py: 1.5 }}>  {/* Ridotto il padding */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ color: card.color }}>
                                                {React.cloneElement(card.icon, { fontSize: 'medium' })}  {/* Icona più piccola */}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" color="textSecondary">
                                                    {card.title}
                                                </Typography>
                                                <Typography variant="h6" sx={{ color: card.color }}>
                                                    {card.value}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Colonna destra con grafico */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>  {/* Ridotto il padding */}
                        <Typography variant="h6" gutterBottom>
                            Distribuzione Scuole per Regione
                        </Typography>
                        <Box sx={{ height: 280 }}>  {/* Altezza ridotta */}
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filtri */}
            {isFilterOpen && (
                <SchoolFilters
                    filters={filters}
                    onChange={setFilters}
                    onReset={() => setFilters({ region: '', schoolType: '', institutionType: '' })}
                />
            )}

            {/* Lista Scuole */}
            <SchoolList
                schools={schools}
                loading={loading}
                onEdit={handleEditClick}
                onDelete={handleDeleteSchool}
            />

            {/* Paginazione */}
            {!loading && totalSchools > ITEMS_PER_PAGE && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
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