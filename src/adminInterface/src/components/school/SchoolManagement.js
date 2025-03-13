// src/components/school/SchoolManagement.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
    TextField
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Class as ClassIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Block as BlockIcon,
    Replay as ReplayIcon
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
    
    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [schoolToDelete, setSchoolToDelete] = useState(null);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [schoolToDeactivate, setSchoolToDeactivate] = useState(null);
    const [deactivateReason, setDeactivateReason] = useState('');
    const [deactivateNotes, setDeactivateNotes] = useState('');
    const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
    const [schoolToReactivate, setSchoolToReactivate] = useState(null);

    const { showNotification } = useNotification();
    const { 
        schools, 
        loading, 
        error,
        totalSchools,
        fetchSchools, 
        deleteSchool,
        deactivateSchool,
        reactivateSchool
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

    // Delete handlers
    const handleDeleteClick = (school) => {
        setSchoolToDelete(school);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!schoolToDelete) return;
        
        try {
            await deleteSchool(schoolToDelete._id);
            loadSchools();
            showNotification('Scuola eliminata con successo', 'success');
        } catch (error) {
            showNotification(error.response?.data?.error?.message || 'Errore nell\'eliminazione della scuola', 'error');
        } finally {
            setDeleteDialogOpen(false);
            setSchoolToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSchoolToDelete(null);
    };

    // Deactivate handlers
    const handleDeactivateSchool = (school) => {
        setSchoolToDeactivate(school);
        setDeactivateDialogOpen(true);
    };

    const handleDeactivateConfirm = async () => {
        if (!schoolToDeactivate) return;
        
        try {
            await deactivateSchool(schoolToDeactivate._id, {
                reason: deactivateReason,
                notes: deactivateNotes
            });
            await loadSchools(); // Ricarichiamo la lista
            showNotification('Scuola disattivata con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nella disattivazione della scuola', 
                'error'
            );
        } finally {
            setDeactivateDialogOpen(false);
            setSchoolToDeactivate(null);
            setDeactivateReason('');
            setDeactivateNotes('');
        }
    };

    const handleDeactivateCancel = () => {
        setDeactivateDialogOpen(false);
        setSchoolToDeactivate(null);
        setDeactivateReason('');
        setDeactivateNotes('');
    };

    // Reactivate handlers
    const handleReactivateSchool = (school) => {
        setSchoolToReactivate(school);
        setReactivateDialogOpen(true);
    };

    const handleReactivateConfirm = async () => {
        if (!schoolToReactivate) return;
        
        try {
            await reactivateSchool(schoolToReactivate._id);
            await loadSchools(); // Ricarichiamo la lista
            showNotification('Scuola riattivata con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nella riattivazione della scuola', 
                'error'
            );
        } finally {
            setReactivateDialogOpen(false);
            setSchoolToReactivate(null);
        }
    };

    const handleReactivateCancel = () => {
        setReactivateDialogOpen(false);
        setSchoolToReactivate(null);
    };

    const handleViewDetails = (school) => {
        navigate(`/admin/schools/${school._id}`);
    };

    const handleRowClick = (params) => {
        navigate(`/admin/schools/${params.row._id}`);
    };

    const toggleFilters = useCallback(() => {
        setIsFilterOpen(prev => !prev);
    }, []);

    // Definizione delle colonne per il DataGrid
    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: 'Nome Scuola',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    opacity: params.row.isActive ? 1 : 0.7,
                    fontStyle: params.row.isActive ? 'normal' : 'italic'
                }}>
                    <SchoolIcon sx={{ 
                        fontSize: '1.1rem', 
                        color: params.row.isActive ? 'primary.main' : 'text.disabled' 
                    }} />
                    <span>{params.value}</span>
                    {!params.row.isActive && (
                        <Chip 
                            label="Disattivata" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1 }}
                        />
                    )}
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
                    sx={{ opacity: params.row.isActive ? 1 : 0.7 }}
                />
            )
        },
        {
            field: 'region',
            headerName: 'Regione',
            width: 130,
            renderCell: (params) => (
                <Box sx={{ opacity: params.row.isActive ? 1 : 0.7 }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'city',
            headerName: 'Città',
            width: 130,
            renderCell: (params) => (
                <Box sx={{ opacity: params.row.isActive ? 1 : 0.7 }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'manager',
            headerName: 'Manager',
            width: 180,
            renderCell: (params) => {
                const manager = params.value;
                if (!manager) return (
                    <Chip 
                        label="Non assegnato" 
                        color="default" 
                        size="small" 
                        sx={{ opacity: params.row.isActive ? 1 : 0.7 }}
                    />
                );
                return (
                    <Tooltip title={`${manager.firstName} ${manager.lastName} (${manager.email})`}>
                        <Chip 
                            label={`${manager.firstName} ${manager.lastName}`} 
                            color="primary" 
                            size="small" 
                            variant="outlined"
                            sx={{ opacity: params.row.isActive ? 1 : 0.7 }}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: 'sections',
            headerName: 'Sezioni Attive',
            width: 120,
            valueGetter: (params) => {
                const sections = params.value || [];
                return sections.filter(section => !section.hasOwnProperty('isActive') || section.isActive).length;
            },
            renderCell: (params) => {
                const activeSections = params.value;
                return (
                    <Chip 
                        label={activeSections}
                        color={activeSections > 0 ? "success" : "default"}
                        size="small"
                        sx={{ opacity: params.row.isActive ? 1 : 0.7 }}
                    />
                );
            }
        },
        {
            field: 'status',
            headerName: 'Stato',
            width: 120,
            valueGetter: (params) => {
                if (!params.row.isActive) return 'Disattivata';
                
                const hasManager = !!params.row.manager;
                const hasActiveSections = (params.row.sections || [])
                    .some(section => !section.hasOwnProperty('isActive') || section.isActive);
                
                if (hasManager && hasActiveSections) return 'Attiva';
                if (hasManager) return 'Parziale';
                return 'Inattiva';
            },
            renderCell: (params) => {
                const status = params.value;
                const colors = {
                    'Attiva': 'success',
                    'Parziale': 'warning',
                    'Inattiva': 'error',
                    'Disattivata': 'error'
                };
                
                return (
                    <Chip 
                        label={status}
                        color={colors[status]}
                        size="small"
                        variant={status === 'Disattivata' ? 'outlined' : 'filled'}
                    />
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Azioni',
            width: 150,
            getActions: (params) => {
                const isActive = params.row.isActive;
                
                const baseActions = [
                    <GridActionsCellItem
                        icon={<VisibilityIcon />}
                        label="Visualizza Dettagli"
                        onClick={() => handleViewDetails(params.row)}
                        sx={{ color: 'primary.main' }}
                    />
                ];
                
                // Aggiungiamo l'azione di disattivazione/riattivazione in base allo stato
                if (isActive) {
                    baseActions.push(
                        <GridActionsCellItem
                            icon={<BlockIcon />}
                            label="Disattiva"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeactivateSchool(params.row);
                            }}
                            sx={{ color: 'warning.main' }}
                        />
                    );
                } else {
                    baseActions.push(
                        <GridActionsCellItem
                            icon={<ReplayIcon />}
                            label="Riattiva"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReactivateSchool(params.row);
                            }}
                            sx={{ color: 'success.main' }}
                        />
                    );
                }
                
                // Sempre aggiungiamo l'azione di eliminazione
                baseActions.push(
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Elimina"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(params.row);
                        }}
                        sx={{ color: 'error.main' }}
                    />
                );
                
                return baseActions;
            }
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
            title: 'Scuole Attive', 
            value: schools?.filter(s => s?.isActive)?.length || 0,
            icon: SchoolIcon,
            color: 'success',
            description: 'Totale delle scuole attive'
        },
        { 
            title: 'Scuole Disattivate', 
            value: schools?.filter(s => !s?.isActive)?.length || 0,
            icon: BlockIcon,
            color: 'error',
            description: 'Totale delle scuole disattivate'
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
                            onClick={toggleFilters}
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
                onToggleFilters={toggleFilters}
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
                onRowClick={handleRowClick}
            />

            {/* Dialog di conferma eliminazione */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth="md"
            >
                <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Conferma eliminazione scuola
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Stai per eliminare la scuola <strong>{schoolToDelete?.name}</strong>.
                    </DialogContentText>
                    <Box sx={{ mt: 2, mb: 2, backgroundColor: 'error.light', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Questa operazione comporterà:
                        </Typography>
                        <ul>
                            <li>L'eliminazione permanente di tutte le classi associate alla scuola</li>
                            <li>La rimozione di tutte le associazioni con gli utenti (docenti e manager)</li>
                            <li>La perdita di tutti i dati relativi alla scuola e alle sue configurazioni</li>
                        </ul>
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                            L'operazione non è reversibile e i dati non potranno essere recuperati.
                        </Typography>
                    </Box>
                    <DialogContentText color="error" sx={{ fontWeight: 'bold' }}>
                        Sei sicuro di voler procedere con l'eliminazione?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary" variant="outlined">
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        autoFocus
                    >
                        Elimina definitivamente
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di conferma disattivazione */}
            <Dialog
                open={deactivateDialogOpen}
                onClose={handleDeactivateCancel}
                aria-labelledby="deactivate-dialog-title"
                aria-describedby="deactivate-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="deactivate-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    Conferma disattivazione scuola
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="deactivate-dialog-description">
                        Stai per disattivare la scuola <strong>{schoolToDeactivate?.name}</strong>.
                        Questa operazione disattiverà anche tutte le classi associate.
                    </DialogContentText>
                    <Box sx={{ mt: 2, mb: 2, backgroundColor: 'warning.light', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Conseguenze della disattivazione:
                        </Typography>
                        <ul>
                            <li>La scuola sarà contrassegnata come "Disattivata"</li>
                            <li>Le classi associate saranno disattivate</li>
                            <li>Gli utenti associati non potranno accedere ai servizi della scuola</li>
                            <li>Gli studenti manterranno le loro associazioni ma non saranno accessibili</li>
                        </ul>
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                            L'operazione è reversibile - la scuola può essere riattivata in qualsiasi momento.
                        </Typography>
                    </Box>
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        id="reason"
                        label="Motivo della disattivazione"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        required
                        sx={{ mt: 2 }}
                    />
                    
                    <TextField
                        margin="dense"
                        id="notes"
                        label="Note aggiuntive"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={deactivateNotes}
                        onChange={(e) => setDeactivateNotes(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeactivateCancel} color="primary" variant="outlined">
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleDeactivateConfirm} 
                        color="warning" 
                        variant="contained"
                        startIcon={<BlockIcon />}
                        disabled={!deactivateReason.trim()}
                        autoFocus
                    >
                        Disattiva
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di conferma riattivazione */}
            <Dialog
                open={reactivateDialogOpen}
                onClose={handleReactivateCancel}
                aria-labelledby="reactivate-dialog-title"
                aria-describedby="reactivate-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="reactivate-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReplayIcon color="success" />
                    Conferma riattivazione scuola
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="reactivate-dialog-description">
                        Stai per riattivare la scuola <strong>{schoolToReactivate?.name}</strong>.
                        Questa operazione riabiliterà anche tutte le classi associate che erano state disattivate.
                    </DialogContentText>
                    <Box sx={{ mt: 2, mb: 2, backgroundColor: 'success.light', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Conseguenze della riattivazione:
                        </Typography>
                        <ul>
                            <li>La scuola sarà contrassegnata come "Attiva"</li>
                            <li>Le classi precedentemente disattivate saranno riattivate</li>
                            <li>Gli utenti associati potranno nuovamente accedere ai servizi della scuola</li>
                        </ul>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleReactivateCancel} color="primary" variant="outlined">
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleReactivateConfirm} 
                        color="success" 
                        variant="contained"
                        startIcon={<ReplayIcon />}
                        autoFocus
                    >
                        Riattiva
                    </Button>
                </DialogActions>
            </Dialog>
        </ContentLayout>
    );
};

export default SchoolManagement;