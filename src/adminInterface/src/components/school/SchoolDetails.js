import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Container, Typography, Box, Button,
    IconButton, CircularProgress, Alert, Tabs, Tab
} from '@mui/material';
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';

// Importiamo i nuovi componenti
import OverviewTab from './details/OverviewTab';
import AdminDetailsTab from './details/AdminDetailsTab';
import AcademicYearsTab from './details/AcademicYearsTab';
import SectionManagement from './schoolComponents/SectionManagement';
import SchoolUsersManagement from './schoolComponents/SchoolUsersManagement';

// Animazioni
const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

const tabContentTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
};

const SchoolDetails = () => {
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();
    const { id } = useParams();
    const { 
        selectedSchool,
        loading,
        error,
        getSchoolById,
        updateSchool
    } = useSchool();

    useEffect(() => {
        // Verifichiamo che id esista e che selectedSchool non sia già caricato 
        // o che sia una scuola diversa
        if (id && (!selectedSchool || selectedSchool._id !== id)) {
            getSchoolById(id);
        }
    }, [id]);

    const handleBack = () => {
        navigate('/admin/schools');
    };

    const handleEdit = () => {
        // Implementare la logica di edit
        console.log('Edit clicked');
    };

    console.log('SchoolDetails rendered with:', {
        selectedSchool,
        loading,
        error,
        id
    });

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
        console.log('selectedSchool is null or undefined');
        return <Alert severity="info">Scuola non trovata</Alert>;
    }
    console.log('School data:', selectedSchool);

    return (
        <motion.div {...pageTransition}>
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
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                    >
                        Modifica
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

                {/* Aggiungiamo i nuovi componenti nel Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div {...tabContentTransition} key={activeTab}>
                        {activeTab === 0 && <OverviewTab school={selectedSchool} />}
                        {activeTab === 1 && <AdminDetailsTab school={selectedSchool} />}
                        {activeTab === 2 && <AcademicYearsTab school={selectedSchool} />}
                        {activeTab === 3 && <SectionManagement />}
                        {activeTab === 4 && (
                            <SchoolUsersManagement
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
        </motion.div>
    );
};

export default SchoolDetails;