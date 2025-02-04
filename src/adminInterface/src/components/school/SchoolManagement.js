// src/components/school/SchoolManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Class as ClassIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { ContentLayout } from '../common/commonIndex';
import ListLayout from '../common/ListLayout';
import { useNotification } from '../../context/NotificationContext';
import { useSchool } from '../../context/SchoolContext';
import SchoolFilters from './schoolComponents/SchoolFilters';
import { GridActionsCellItem } from '@mui/x-data-grid';

const ITEMS_PER_PAGE = 10;

const SchoolManagement = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
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

    const handleViewDetails = (school) => {
        navigate(`/admin/schools/${school._id}`);  // Rimuoviamo /edit dal percorso
    };

    // Definizione delle colonne per il DataGrid
    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Nome Scuola',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                    <span>{params.value}</span>
                </Box>
            )
        },
        {
            field: 'schoolType',
            headerName: 'Tipo',
            width: 150,
            renderCell: (params) => (
                <Chip 
                    label={params.value === 'middle_school' ? 'Media' : 'Superiore'}
                    color={params.value === 'middle_school' ? 'primary' : 'secondary'}
                    size="small"
                />
            )
        },
        {
            field: 'region',
            headerName: 'Regione',
            width: 130
        },
        {
            field: 'city',
            headerName: 'Città',
            width: 130
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Azioni',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                icon={<VisibilityIcon />}  // Cambiamo l'icona
                label="Visualizza Dettagli"  // Aggiorniamo il label
                onClick={() => handleViewDetails(params.row)}
                sx={{ color: 'primary.main' }}  // Aggiungiamo un colore appropriato
            />,
            <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Elimina"
                onClick={() => handleDeleteSchool(params.row._id)}
                sx={{ color: 'error.main' }}
            />
            ]
        }
    ], [navigate]);

    const statsCards = useMemo(() => [
        { 
            title: 'Scuole Totali', 
            value: totalSchools || 0,
            icon: SchoolIcon,
            color: 'primary',
            description: 'Totale delle scuole registrate'
        },
        { 
            title: 'Scuole Medie', 
            value: schools?.filter(s => s?.schoolType === 'middle_school')?.length || 0,
            icon: ClassIcon,
            color: 'secondary',
            description: 'Totale delle scuole medie'
        },
        { 
            title: 'Scuole Superiori', 
            value: schools?.filter(s => s?.schoolType === 'high_school')?.length || 0,
            icon: SchoolIcon,
            color: 'success',
            description: 'Totale delle scuole superiori'
        },
        { 
            title: 'Regioni', 
            value: [...new Set(schools?.map(s => s?.region))].length || 0,
            icon: LocationIcon,
            color: 'info',
            description: 'Numero di regioni con scuole registrate'
        }
    ], [schools, totalSchools]);

    return (
        <ContentLayout
            title="Gestione Scuole"
            subtitle="Gestisci le scuole e monitora le statistiche"
            actions={
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Filtri">
                        <IconButton 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            color="primary"
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
                rows={schools || []}
                columns={columns}
                getRowId={(row) => row._id}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
            />
        </ContentLayout>
    );
};

export default SchoolManagement;