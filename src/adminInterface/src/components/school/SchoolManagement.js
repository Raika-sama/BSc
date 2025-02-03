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
    Tooltip,
    Pagination,
    Collapse
} from '@mui/material';
import {
    Add as AddIcon,
    FilterList as FilterListIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Class as ClassIcon
} from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
import { useNotification } from '../../context/NotificationContext';
import { useSchool } from '../../context/SchoolContext';
import SchoolList from './SchoolList';
import SchoolFilters from './schoolComponents/SchoolFilters';

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
            icon: <SchoolIcon />,
            color: 'primary.main' 
        },
        { 
            title: 'Scuole Medie', 
            value: schools?.filter(s => s?.schoolType === 'middle_school')?.length || 0,
            icon: <ClassIcon />,
            color: 'secondary.main' 
        },
        { 
            title: 'Scuole Superiori', 
            value: schools?.filter(s => s?.schoolType === 'high_school')?.length || 0,
            icon: <SchoolIcon />,
            color: 'success.main' 
        },
        { 
            title: 'Regioni', 
            value: [...new Set(schools?.map(s => s?.region))].length || 0,
            icon: <LocationIcon />,
            color: 'info.main' 
        }
    ];

    return (
        <ContentLayout
            title="Gestione Scuole"
            subtitle="Gestisci le scuole e le loro informazioni"
            actions={
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Filtri">
                        <IconButton 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            sx={{ color: 'inherit' }}
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/schools/create')}
                    >
                        Nuova Scuola
                    </Button>
                </Box>
            }
        >
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statsCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card elevation={2}>
                            <CardContent sx={{ 
                                p: 2,
                                '&:last-child': { pb: 2 }
                            }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2
                                }}>
                                    <Box sx={{ 
                                        color: card.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${card.color}15`,
                                        borderRadius: 1,
                                        p: 1
                                    }}>
                                        {card.icon}
                                    </Box>
                                    <Box>
                                        <Typography 
                                            variant="body2" 
                                            color="textSecondary"
                                            gutterBottom
                                        >
                                            {card.title}
                                        </Typography>
                                        <Typography 
                                            variant="h5" 
                                            sx={{ color: card.color }}
                                        >
                                            {card.value}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

             {/* Filtri Collassabili */}
             <Collapse in={isFilterOpen}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <SchoolFilters
                        filters={filters}
                        onChange={setFilters}
                        onReset={() => setFilters({
                            region: '',
                            schoolType: '',
                            institutionType: ''
                        })}
                    />
                </Paper>
            </Collapse>

            {/* Lista Scuole */}
            <Paper elevation={2}>
                <SchoolList
                    schools={schools}
                    loading={loading}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteSchool}
                />
            </Paper>

            {/* Paginazione */}
            {!loading && totalSchools > ITEMS_PER_PAGE && (
                <Box sx={{ 
                    mt: 3, 
                    display: 'flex', 
                    justifyContent: 'center' 
                }}>
                    <Pagination
                        count={Math.ceil(totalSchools / ITEMS_PER_PAGE)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}
        </ContentLayout>
    );
};

export default SchoolManagement;