import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    IconButton,
    Grid,
    Card,
    CardContent,
    FormControlLabel,
    Switch,
    CircularProgress,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClassIcon from '@mui/icons-material/Class';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useSchool } from '../../../context/SchoolContext';
import SectionList from './SectionList';
import DeactivationDialog from './DeactivationDialog';

const SectionManagement = () => {
    const navigate = useNavigate();
    const { id: schoolId } = useParams();
    const { 
        selectedSchool, 
        getSchoolById,
        getSectionStudents,  // Assicurati di includere questo 
        deactivateSection,
        reactivateSection,
        loading,
        error
    } = useSchool();

    const [showInactive, setShowInactive] = useState(true);
    const [selectedSection, setSelectedSection] = useState(null);
    const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] = useState(false);

    // Invece di usare sectionsLoaded, usiamo direttamente le sezioni dalla scuola
    const sections = selectedSchool?.sections || [];

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!selectedSchool) {
                    await getSchoolById(schoolId);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, [schoolId, selectedSchool, getSchoolById]);



    // Handler per la disattivazione
    const handleDeactivateClick = (section) => {
        // Prendiamo la sezione completa dai dati della scuola
        const fullSection = selectedSchool.sections.find(s => s.name === section.name);
        setSelectedSection({
            ...fullSection,
            schoolId: schoolId
        });
        setIsDeactivationDialogOpen(true);
    };

    // Handler per la conferma della disattivazione
    const handleDeactivateConfirm = async () => {
        try {
            if (!selectedSection) return;

            await deactivateSection(schoolId, selectedSection.name);
            // Ricarica i dati della scuola per aggiornare le sezioni
            await getSchoolById(schoolId);
        } catch (error) {
            console.error('Error deactivating section:', error);
        } finally {
            setIsDeactivationDialogOpen(false);
            setSelectedSection(null);
        }
    };

    // Modificato anche questo per coerenza
    const handleReactivate = async (section) => {
        try {
            await reactivateSection(schoolId, section.name);
            // Ricarica i dati della scuola per aggiornare le sezioni
            await getSchoolById(schoolId);
        } catch (error) {
            console.error('Error reactivating section:', error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            </Container>
        );
    }



    return (
        <Container maxWidth="lg">
            <Box display="flex" alignItems="center" mb={3} gap={2}>
                <IconButton onClick={() => navigate(`/admin/schools/${schoolId}`)}>
                    <ArrowBackIcon />
                </IconButton>
                <Box flex={1}>
                    <Typography variant="caption" display="block" color="text.secondary">
                        {selectedSchool?.name}
                    </Typography>
                    <Typography variant="h4" component="h1">
                        Gestione Sezioni
                    </Typography>
                </Box>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                    }
                    label={showInactive ? "Mostra tutte le sezioni" : "Mostra solo sezioni attive"}
                />
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <ClassIcon color="primary" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Sezioni Totali
                                    </Typography>
                                    <Typography variant="h4">
                                        {sections.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CheckCircleIcon color="success" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Sezioni Attive
                                    </Typography>
                                    <Typography variant="h4">
                                        {sections.filter(s => s.isActive).length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <GroupIcon color="info" />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Studenti Totali
                                    </Typography>
                                    <Typography variant="h4">
                                        {sections.reduce((acc, s) => acc + (s.studentsCount || 0), 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <SectionList
                sections={showInactive ? sections : sections.filter(s => s.isActive)}
                showInactive={showInactive}
                onDeactivate={handleDeactivateClick}
                onReactivate={handleReactivate}
            />

            <DeactivationDialog
                open={isDeactivationDialogOpen}
                onClose={() => {
                    setIsDeactivationDialogOpen(false);
                    setSelectedSection(null);
                }}
                onConfirm={handleDeactivateConfirm}
                section={selectedSection}
            />
        </Container>
    );
};

export default SectionManagement;