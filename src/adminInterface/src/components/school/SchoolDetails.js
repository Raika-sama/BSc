import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Container, Typography, Box, Button,
    IconButton, CircularProgress, Alert, Tabs, Tab,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { useNotification } from '../../context/NotificationContext';

// Importiamo i componenti
import OverviewTab from './details/OverviewTab';
import AdminDetailsTab from './details/AdminDetailsTab';
// Importiamo il componente refactorizzato utilizzando React.lazy
const AcademicYearsTab = React.lazy(() => import('./academicYears/AcademicYearsTab'));
import SectionManagement from './schoolComponents/SectionManagement';
import SchoolUsersManagement from './schoolComponents/SchoolUsersManagement';

// Definizione delle animazioni
const pageVariants = {
    initial: { 
        opacity: 0, 
        y: 20 
    },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    },
    exit: { 
        opacity: 0, 
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeIn"
        }
    }
};

const tabContentVariants = {
    initial: { 
        opacity: 0, 
        x: 20 
    },
    animate: { 
        opacity: 1, 
        x: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    exit: { 
        opacity: 0, 
        x: -20,
        transition: {
            duration: 0.2,
            ease: "easeIn"
        }
    }
};

const SchoolDetails = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { 
        selectedSchool,
        loading,
        error,
        getSchoolById,
        updateSchool,
        addUserToSchool,
        deleteSchool
    } = useSchool();

    useEffect(() => {
        if (id && (!selectedSchool || selectedSchool._id !== id)) {
            getSchoolById(id);
        }
    }, [id, getSchoolById, selectedSchool]);

    const handleAddUser = async (userData) => {
        try {
            await addUserToSchool(id, userData.email, userData.role);
            await getSchoolById(id);
            showNotification('Utente aggiunto con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'aggiunta dell\'utente',
                'error'
            );
        }
    };

    const handleRemoveUser = async (userId) => {
        try {
            await updateSchool(id, {
                action: 'removeUser',
                userId: userId
            });
            await getSchoolById(id);
            showNotification('Utente rimosso con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nella rimozione dell\'utente',
                'error'
            );
        }
    };

    const handleChangeManager = async (newManagerId) => {
        try {
            await updateSchool(id, {
                manager: newManagerId
            });
            await getSchoolById(id);
            showNotification('Manager aggiornato con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nel cambio del manager',
                'error'
            );
        }
    };

    const handleBack = () => {
        navigate('/admin/schools');
    };

    const handleEdit = () => {
        navigate(`/admin/schools/${id}/edit`);
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteSchool(id);
            showNotification('Scuola eliminata con successo', 'success');
            navigate('/admin/schools');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'eliminazione della scuola',
                'error'
            );
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!selectedSchool) {
        return <Alert severity="info">Scuola non trovata</Alert>;
    }

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            <Container maxWidth="lg" sx={{ mt: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={handleBack} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
                        {selectedSchool.name}
                    </Typography>
                    
                    <Button 
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteClick}
                    >
                        Elimina
                    </Button>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs 
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        aria-label="school details tabs"
                    >
                        <Tab label="Panoramica" />
                        <Tab label="Dettagli Amministrativi" />
                        <Tab label="Anni Accademici" />
                        <Tab label="Sezioni" />
                        <Tab label="Utenti" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={tabContentVariants}
                    >
                        {activeTab === 0 && <OverviewTab school={selectedSchool} />}
                        {activeTab === 1 && <AdminDetailsTab school={selectedSchool} />}
                        {activeTab === 2 && (
                            <React.Suspense fallback={<Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}>
                                <AcademicYearsTab school={selectedSchool} />
                            </React.Suspense>
                        )}
                        {activeTab === 3 && <SectionManagement schoolId={id} />}
                        {activeTab === 4 && (
                            <SchoolUsersManagement
                                schoolId={id}
                                users={selectedSchool.users}
                                manager={selectedSchool.manager}
                                onAddUser={handleAddUser}
                                onRemoveUser={handleRemoveUser}
                                onChangeManager={handleChangeManager}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </Container>

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
                        Stai per eliminare la scuola <strong>{selectedSchool?.name}</strong>.
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
        </motion.div>
    );
};

export default SchoolDetails;