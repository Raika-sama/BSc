// SectionManagement.js
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useSchool } from '../../../context/SchoolContext';
import SectionManagementHeader from './SectionManagementHeader';
import SectionStats from './SectionStats';
import SectionList from './SectionList';
import DeactivationDialog from './DeactivationDialog';

const SectionManagement = () => {
    const { 
        selectedSchool, 
        getSchoolById,
        deactivateSection,
        reactivateSection,
        loading,
        error
    } = useSchool();

    const [showInactive, setShowInactive] = useState(true);
    const [selectedSection, setSelectedSection] = useState(null);
    const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] = useState(false);

    const sections = selectedSchool?.sections || [];

    const handleDeactivateClick = (section) => {
        const fullSection = selectedSchool.sections.find(s => s.name === section.name);
        setSelectedSection({
            ...fullSection,
            schoolId: selectedSchool._id
        });
        setIsDeactivationDialogOpen(true);
    };

    const handleDeactivateConfirm = async () => {
        try {
            if (!selectedSection) return;
            await deactivateSection(selectedSchool._id, selectedSection.name);
            await getSchoolById(selectedSchool._id);
        } catch (error) {
            console.error('Error deactivating section:', error);
        } finally {
            setIsDeactivationDialogOpen(false);
            setSelectedSection(null);
        }
    };

    const handleReactivate = async (section) => {
        try {
            await reactivateSection(selectedSchool._id, section.name);
            await getSchoolById(selectedSchool._id);
        } catch (error) {
            console.error('Error reactivating section:', error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    return (
        <Box sx={{ pt: 1 }}>
            <SectionManagementHeader 
                showInactive={showInactive}
                onToggleInactive={(e) => setShowInactive(e.target.checked)}
            />
            
            <SectionStats sections={sections} />
            
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
        </Box>
    );
};

export default SectionManagement;