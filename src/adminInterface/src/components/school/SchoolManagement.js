import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Pagination
} from '@mui/material';
import {
    Add as AddIcon,
    FilterList as FilterListIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Class as ClassIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ContentLayout } from '../common/commonIndex';
import ListLayout from '../common/ListLayout';
import { useNotification } from '../../context/NotificationContext';
import { useSchool } from '../../context/SchoolContext';
import SchoolList from './SchoolList';
import SchoolFilters from './schoolComponents/SchoolFilters';
import StatCard from './schoolComponents/StatCard'; // Assumiamo di aver spostato StatCard in un file separato

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
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
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/admin/schools/create')}
                        >
                            Nuova Scuola
                        </Button>
                    </Box>
                }
            >
                <ListLayout
                    statsCards={statsCards}
                    isFilterOpen={isFilterOpen}
                    filterComponent={
                        <SchoolFilters
                            filters={filters}
                            onChange={setFilters}
                            onReset={() => setFilters({
                                region: '',
                                schoolType: '',
                                institutionType: ''
                            })}
                        />
                    }
                    listComponent={
                        <SchoolList
                            schools={schools}
                            loading={loading}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteSchool}
                        />
                    }
                    paginationComponent={
                        !loading && totalSchools > ITEMS_PER_PAGE && (
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
                        )
                    }
                />
            </ContentLayout>
        </motion.div>
    );
};

export default SchoolManagement;