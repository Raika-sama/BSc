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
        selectedSchoolSections,
        loading,
        error,
        getSchoolById,
        getSections,
        deactivateSection,
        reactivateSection
    } = useSchool();

    const [showInactive, setShowInactive] = useState(true);
    const [stats, setStats] = useState({
        totalSections: 0,
        activeSections: 0,
        totalStudents: 0
    });
    const [selectedSection, setSelectedSection] = useState(null);
    const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log("Loading data...");
                if (!selectedSchool) {
                    await getSchoolById(schoolId);
                }
                await refreshSections();
                console.log("Data loaded:", {
                    selectedSchoolSections,
                    showInactive
                });
            } catch (error) {
                console.error('Error loading sections:', error);
            }
        };

        loadData();
    }, [schoolId]);

    const refreshSections = async () => {
        const sections = await getSections(schoolId, true);
        updateStats(sections);
    };

    const updateStats = (sections) => {
        const activeSections = sections.filter(s => s.isActive);
        const totalStudents = sections.reduce((acc, s) => acc + (s.studentsCount || 0), 0);
        
        setStats({
            totalSections: sections.length,
            activeSections: activeSections.length,
            totalStudents
        });
    };

    const handleDeactivateClick = (section) => {
        setSelectedSection(section);
        setIsDeactivationDialogOpen(true);
    };

    const handleDeactivateConfirm = async (section) => {
        try {
            await deactivateSection(schoolId, section.name);
            await refreshSections();
        } catch (error) {
            console.error('Error deactivating section:', error);
        }
    };

    const handleReactivate = async (section) => {
        try {
            await reactivateSection(schoolId, section.name);
            await refreshSections();
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

    if (!selectedSchool) {
        return (
            <Box textAlign="center" py={4}>
                <Typography variant="h6">Scuola non trovata</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3} gap={2}>
                <IconButton onClick={() => navigate(`/admin/schools/${schoolId}`)}>
                    <ArrowBackIcon />
                </IconButton>
                <Box flex={1}>
                    <Typography variant="caption" display="block" color="text.secondary">
                        {selectedSchool.name}
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

            {/* Stats Cards */}
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
                                        {stats.totalSections}
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
                                        {stats.activeSections}
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
                                        {stats.totalStudents}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Aggiungi log prima del render di SectionList */}
            {console.log("Rendering SectionList with:", {
                            sections: selectedSchoolSections,
                            showInactive,
                            sectionsLength: selectedSchoolSections?.length
                        })}

            {/* Section List */}
            <SectionList
                sections={selectedSchoolSections || []}
                showInactive={showInactive}
                onDeactivate={handleDeactivateClick}
                onReactivate={handleReactivate}
            />

            {/* Deactivation Dialog */}
            <DeactivationDialog
                open={isDeactivationDialogOpen}
                onClose={() => setIsDeactivationDialogOpen(false)}
                onConfirm={handleDeactivateConfirm}
                section={selectedSection}
            />
        </Container>
    );
};

export default SectionManagement;